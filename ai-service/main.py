import os
import json
import logging
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import pandas as pd
from prophet import Prophet

# Suppress verbose Prophet / CmdStan output in server logs
logging.getLogger("prophet").setLevel(logging.WARNING)
logging.getLogger("cmdstanpy").setLevel(logging.WARNING)

app = FastAPI()

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "farmtrust_prices.csv")
CACHE_FILE = os.path.join(BASE_DIR, "forecast_cache.json")

# ── The 9 crops in farmtrust_prices.csv ──────────────────────────────────────
SUPPORTED_CROPS = [
    "Beans",
    "Brinjal",
    "Cabbage",
    "Carrot",
    "Green Chilli",
    "Lime",
    "Pumpkin",
    "Snake gourd",
    "Tomato",
]


# ──────────────────────────────────────────────────────────────────────────────
#  DAILY LAZY-CACHE HELPER
# ──────────────────────────────────────────────────────────────────────────────

def _build_crop_cache(df: pd.DataFrame, crop: str) -> dict:
    """
    Train Prophet for one crop and return a dict with 'forecast' and 'summary'.
    Raises ValueError if the data is insufficient.
    """
    # ── Filter & clean ────────────────────────────────────────────────────────
    product_df = df[df["Item"] == crop].copy()
    if product_df.empty:
        raise ValueError(f"No data for crop: {crop}")

    product_df = product_df.rename(
        columns={"Date": "ds", "Pettah_Today_Wholesale": "y"}
    )
    product_df = product_df[["ds", "y"]].copy()
    product_df["ds"] = pd.to_datetime(product_df["ds"])
    product_df["y"] = pd.to_numeric(
        product_df["y"].astype(str).str.replace(",", ""), errors="coerce"
    )
    product_df = product_df.dropna(subset=["y"])
    product_df = product_df[product_df["y"] > 0]
    product_df = product_df.sort_values("ds", ascending=True)

    if len(product_df) < 2:
        raise ValueError(f"Insufficient clean data for: {crop}")

    # ── Train Prophet ─────────────────────────────────────────────────────────
    model = Prophet()
    model.fit(product_df)

    # ── 7-day forecast anchored to TODAY ──────────────────────────────────────
    # The CSV may end days in the past. We must extend far enough so that
    # today through today+6 are all inside the forecast window.
    today_ts = pd.Timestamp(datetime.today().date())
    tomorrow_ts = today_ts + pd.Timedelta(days=1)
    last_train_date = product_df["ds"].max()

    # Days from last training point → today+6 (inclusive)
    days_gap = (today_ts - last_train_date).days  # could be 0 if CSV is current
    periods_needed = max(7, days_gap + 6)          # always at least 7

    future = model.make_future_dataframe(periods=periods_needed)
    forecast_df = model.predict(future)

    # Select exactly 7 rows starting from today
    future_rows = forecast_df[forecast_df["ds"] >= today_ts].head(7)

    forecast_list = [
        {
            "date": row["ds"].strftime("%Y-%m-%d"),
            "predicted": round(float(row["yhat"]), 2),
            "lower": round(float(row["yhat_lower"]), 2),
            "upper": round(float(row["yhat_upper"]), 2),
        }
        for _, row in future_rows.iterrows()
    ]

    # ── Summary metrics ───────────────────────────────────────────────────────
    recent_30 = product_df.tail(30)
    recent_7 = product_df.tail(7)

    last_month_avg = recent_30["y"].mean()
    last_week_avg = recent_7["y"].mean()
    min_30d = recent_30["y"].min()
    max_30d = recent_30["y"].max()

    # tomorrow_price = Prophet's prediction for actual tomorrow
    # Reuse forecast_df (already computed with periods_needed) to find tomorrow's row
    tomorrow_rows = forecast_df[forecast_df["ds"] == tomorrow_ts]
    if tomorrow_rows.empty:
        # Fallback: extend one more day if needed
        future_ext = model.make_future_dataframe(periods=periods_needed + 1)
        forecast_ext = model.predict(future_ext)
        tomorrow_rows = forecast_ext[forecast_ext["ds"] == tomorrow_ts]

    tomorrow_price = float(tomorrow_rows.iloc[-1]["yhat"]) if not tomorrow_rows.empty else float(forecast_df.iloc[-1]["yhat"])

    if tomorrow_price > last_month_avg * 1.10:
        market_status = "HIGH"
    elif tomorrow_price < last_month_avg * 0.90:
        market_status = "LOW"
    else:
        market_status = "AVERAGE"

    change_week_percent = (
        ((tomorrow_price - last_week_avg) / last_week_avg) * 100
        if last_week_avg
        else 0
    )
    change_month_percent = (
        ((tomorrow_price - last_month_avg) / last_month_avg) * 100
        if last_month_avg
        else 0
    )
    trend = "UP" if tomorrow_price > last_week_avg else "DOWN"

    summary = {
        "product": crop,
        "tomorrow_price": round(tomorrow_price, 2),
        "last_week_avg": round(float(last_week_avg), 2),
        "last_month_avg": round(float(last_month_avg), 2),
        "change_week_percent": round(float(change_week_percent), 1),
        "change_month_percent": round(float(change_month_percent), 1),
        "market_status": market_status,
        "min_30d": round(float(min_30d), 2),
        "max_30d": round(float(max_30d), 2),
        "trend": trend,
    }

    return {"forecast": forecast_list, "summary": summary}


def update_daily_cache() -> dict:
    """
    Lazy daily cache:
      - If CACHE_FILE exists and last_updated == today  →  return cached data immediately.
      - Otherwise retrain Prophet for all SUPPORTED_CROPS and overwrite the file.

    Returns the full cache dict { "last_updated": "...", "data": { crop: {...} } }.
    """
    today_str = str(datetime.today().date())

    # ── Try to load existing cache ────────────────────────────────────────────
    try:
        if os.path.exists(CACHE_FILE):
            with open(CACHE_FILE, "r", encoding="utf-8") as fh:
                cache = json.load(fh)
            if cache.get("last_updated") == today_str:
                # Cache is fresh — return immediately
                return cache
    except Exception as read_err:
        logging.warning(f"[cache] Could not read cache file: {read_err}")

    # ── Cache is stale / missing — rebuild ────────────────────────────────────
    logging.info(f"[cache] Building daily cache for {today_str} …")

    try:
        df = pd.read_csv(DATASET_PATH)
    except Exception as csv_err:
        raise RuntimeError(f"Cannot read dataset: {csv_err}")

    cache_data: dict = {}
    for crop in SUPPORTED_CROPS:
        try:
            cache_data[crop] = _build_crop_cache(df, crop)
        except Exception as crop_err:
            logging.error(f"[cache] Skipping '{crop}': {crop_err}")
            # Store an empty placeholder so the endpoint can give a clean 404
            cache_data[crop] = None

    new_cache = {"last_updated": today_str, "data": cache_data}

    # ── Persist to disk ───────────────────────────────────────────────────────
    try:
        with open(CACHE_FILE, "w", encoding="utf-8") as fh:
            json.dump(new_cache, fh, indent=2)
        logging.info(f"[cache] Saved to {CACHE_FILE}")
    except Exception as write_err:
        # Non-fatal: the in-memory cache is still usable for this request
        logging.warning(f"[cache] Could not write cache file: {write_err}")

    return new_cache


# ──────────────────────────────────────────────────────────────────────────────
#  ENDPOINTS
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/crops", response_model=List[str])
def get_crops():
    """Return a sorted list of all unique crop names from the dataset."""
    try:
        df = pd.read_csv(DATASET_PATH)
        crops = sorted(df["Item"].dropna().unique().tolist())
        return crops
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load crops: {str(e)}")


@app.get("/predict/{product_name}")
def predict_price(product_name: str):
    """Legacy single-day price prediction — trains on-demand (no cache)."""
    try:
        df = pd.read_csv(DATASET_PATH)

        # Exact match first; fall back to case-insensitive match
        product_df = df[df["Item"] == product_name].copy()
        if product_df.empty:
            ci_match = df[df["Item"].str.lower() == product_name.lower()]
            if ci_match.empty:
                raise HTTPException(status_code=404, detail=f"No data found for: {product_name}")
            product_df = ci_match.copy()
            product_name = ci_match["Item"].iloc[0]

        product_df = product_df.rename(
            columns={"Date": "ds", "Pettah_Today_Wholesale": "y"}
        )
        product_df = product_df[["ds", "y"]]
        product_df["ds"] = pd.to_datetime(product_df["ds"])
        product_df["y"] = pd.to_numeric(product_df["y"], errors="coerce")
        product_df = product_df.dropna(subset=["y"])
        product_df = product_df[product_df["y"] > 0]

        if len(product_df) < 2:
            raise HTTPException(
                status_code=422,
                detail=f"Insufficient clean data to train model for: {product_name}",
            )

        model = Prophet()
        model.fit(product_df)

        future = model.make_future_dataframe(periods=1)
        forecast = model.predict(future)
        predicted_price = forecast.iloc[-1]["yhat"]

        return {"product": product_name, "predicted_price": round(predicted_price, 2)}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.get("/history/{product_name}")
def get_history(product_name: str):
    """
    Return the last 30 days of price data ending on yesterday.
    Real CSV prices are used where available; Prophet fills any gap
    between the last CSV date and yesterday so the chart is always current.
    """
    try:
        df = pd.read_csv(DATASET_PATH)

        product_df = df[df["Item"] == product_name].copy()
        if product_df.empty:
            ci_match = df[df["Item"].str.lower() == product_name.lower()]
            if ci_match.empty:
                raise HTTPException(status_code=404, detail=f"No data found for: {product_name}")
            product_df = ci_match.copy()
            product_name = ci_match["Item"].iloc[0]

        product_df = product_df[["Date", "Pettah_Today_Wholesale"]].copy()
        product_df["Date"] = pd.to_datetime(product_df["Date"])
        product_df["Pettah_Today_Wholesale"] = pd.to_numeric(
            product_df["Pettah_Today_Wholesale"].astype(str).str.replace(",", ""),
            errors="coerce",
        )
        product_df = product_df.dropna(subset=["Pettah_Today_Wholesale"])
        product_df = product_df[product_df["Pettah_Today_Wholesale"] > 0]
        product_df = product_df.sort_values(by="Date", ascending=True)

        # ── Fill forward to yesterday if the CSV is stale ─────────────────────
        yesterday_ts = pd.Timestamp(datetime.today().date()) - pd.Timedelta(days=1)
        last_csv_date = product_df["Date"].max()

        if last_csv_date < yesterday_ts:
            # Train Prophet and predict the gap days
            try:
                prophet_df = product_df.rename(
                    columns={"Date": "ds", "Pettah_Today_Wholesale": "y"}
                )[["ds", "y"]].copy()

                fill_model = Prophet()
                fill_model.fit(prophet_df)

                # periods needed to reach yesterday
                gap_days = (yesterday_ts - last_csv_date).days
                future_fill = fill_model.make_future_dataframe(periods=gap_days)
                forecast_fill = fill_model.predict(future_fill)

                # Keep only the gap rows (after last CSV date, up to yesterday)
                gap_rows = forecast_fill[
                    (forecast_fill["ds"] > last_csv_date) &
                    (forecast_fill["ds"] <= yesterday_ts)
                ][["ds", "yhat"]].copy()
                gap_rows.columns = ["Date", "Pettah_Today_Wholesale"]
                gap_rows["Pettah_Today_Wholesale"] = gap_rows["Pettah_Today_Wholesale"].round(2)

                # Append gap predictions to the real historical data
                product_df = pd.concat([product_df, gap_rows], ignore_index=True)
                product_df = product_df.sort_values(by="Date", ascending=True)
            except Exception as fill_err:
                logging.warning(f"[history] Gap fill failed for {product_name}: {fill_err}")
                # Fall back to raw CSV data — no crash

        # ── Return last 30 data points (now ending on or near yesterday) ──────
        recent_30 = product_df.tail(30)
        history = [
            {
                "date": row["Date"].strftime("%Y-%m-%d"),
                "price": round(float(row["Pettah_Today_Wholesale"]), 2),
            }
            for _, row in recent_30.iterrows()
        ]

        return {"product": product_name, "history": history}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"History failed: {str(e)}")



@app.get("/forecast/{product_name}")
def forecast_price(product_name: str):
    """
    Return the 7-day Prophet forecast for a crop.
    Served from the daily cache; cache is rebuilt lazily if stale.
    """
    try:
        cache = update_daily_cache()
    except Exception as cache_err:
        raise HTTPException(status_code=500, detail=f"Cache build failed: {str(cache_err)}")

    # Resolve the crop key (exact → case-insensitive)
    crop_key = _resolve_crop_key(cache["data"], product_name)
    if crop_key is None:
        raise HTTPException(status_code=404, detail=f"No data found for: {product_name}")

    crop_cache = cache["data"].get(crop_key)
    if not crop_cache:
        raise HTTPException(
            status_code=422,
            detail=f"Forecast could not be generated for: {product_name}",
        )

    # Response shape is identical to the old endpoint
    return {"product": crop_key, "forecast": crop_cache["forecast"]}


@app.get("/summary/{product_name}")
def get_summary(product_name: str):
    """
    Return summary/insight metrics for a crop.
    Served from the daily cache; cache is rebuilt lazily if stale.
    """
    try:
        cache = update_daily_cache()
    except Exception as cache_err:
        raise HTTPException(status_code=500, detail=f"Cache build failed: {str(cache_err)}")

    crop_key = _resolve_crop_key(cache["data"], product_name)
    if crop_key is None:
        raise HTTPException(status_code=404, detail=f"No data found for: {product_name}")

    crop_cache = cache["data"].get(crop_key)
    if not crop_cache:
        raise HTTPException(
            status_code=422,
            detail=f"Summary could not be generated for: {product_name}",
        )

    # Response shape is identical to the old endpoint
    return crop_cache["summary"]


# ──────────────────────────────────────────────────────────────────────────────
#  UTILITIES
# ──────────────────────────────────────────────────────────────────────────────

def _resolve_crop_key(data: dict, product_name: str):
    """
    Returns the canonical key from the cache dict that matches product_name.
    Tries exact match first, then case-insensitive. Returns None if not found.
    """
    if product_name in data:
        return product_name
    lower = product_name.lower()
    for key in data:
        if key.lower() == lower:
            return key
    return None
