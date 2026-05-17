import os
import logging
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

# ── Shared dataset path (absolute, works regardless of launch directory) ───────
DATASET_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "farmtrust_prices.csv")


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
    try:
        # Load dataset
        df = pd.read_csv(DATASET_PATH)

        # Exact match first; fall back to case-insensitive match
        product_df = df[df["Item"] == product_name].copy()
        if product_df.empty:
            ci_match = df[df["Item"].str.lower() == product_name.lower()]
            if ci_match.empty:
                raise HTTPException(status_code=404, detail=f"No data found for: {product_name}")
            product_df = ci_match.copy()
            product_name = ci_match["Item"].iloc[0]  # use canonical casing

        # Use Pettah wholesale price as the target
        product_df = product_df.rename(
            columns={
                "Date": "ds",
                "Pettah_Today_Wholesale": "y"
            }
        )

        # Keep needed columns
        product_df = product_df[["ds", "y"]]

        # Convert date format
        product_df["ds"] = pd.to_datetime(product_df["ds"])

        # ── Preprocessing: clean invalid price values ──────────────────────────
        product_df["y"] = pd.to_numeric(product_df["y"], errors="coerce")
        product_df = product_df.dropna(subset=["y"])
        product_df = product_df[product_df["y"] > 0]
        # ── End preprocessing ──────────────────────────────────────────────────

        if len(product_df) < 2:
            raise HTTPException(
                status_code=422,
                detail=f"Insufficient clean data to train model for: {product_name}"
            )

        # Train model
        model = Prophet()
        model.fit(product_df)

        # Predict next day
        future = model.make_future_dataframe(periods=1)
        forecast = model.predict(future)

        predicted_price = forecast.iloc[-1]["yhat"]

        return {
            "product": product_name,
            "predicted_price": round(predicted_price, 2)
        }

    except HTTPException:
        raise  # re-raise intentional HTTP errors (404, 422)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.get("/history/{product_name}")
def get_history(product_name: str):
    try:
        # Load dataset
        df = pd.read_csv(DATASET_PATH)

        # Exact match first; fall back to case-insensitive match
        product_df = df[df["Item"] == product_name].copy()
        if product_df.empty:
            ci_match = df[df["Item"].str.lower() == product_name.lower()]
            if ci_match.empty:
                raise HTTPException(status_code=404, detail=f"No data found for: {product_name}")
            product_df = ci_match.copy()
            product_name = ci_match["Item"].iloc[0]  # use canonical casing

        # Keep needed columns
        product_df = product_df[["Date", "Pettah_Today_Wholesale"]].copy()
        product_df["Date"] = pd.to_datetime(product_df["Date"])

        # Cleaning: convert prices to floats, ignoring commas
        product_df["Pettah_Today_Wholesale"] = pd.to_numeric(
            product_df["Pettah_Today_Wholesale"].astype(str).str.replace(',', ''), 
            errors="coerce"
        )
        product_df = product_df.dropna(subset=["Pettah_Today_Wholesale"])

        # Sort by Date
        product_df = product_df.sort_values(by="Date", ascending=True)

        # Slice most recent 30 records
        recent_30 = product_df.tail(30)

        history = []
        for _, row in recent_30.iterrows():
            history.append({
                "date": row["Date"].strftime("%Y-%m-%d"),
                "price": round(float(row["Pettah_Today_Wholesale"]), 2)
            })

        return {
            "product": product_name,
            "history": history
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"History failed: {str(e)}")


@app.get("/forecast/{product_name}")
def forecast_price(product_name: str):
    try:
        # Load dataset
        df = pd.read_csv(DATASET_PATH)

        # Exact match first; fall back to case-insensitive match
        product_df = df[df["Item"] == product_name].copy()
        if product_df.empty:
            ci_match = df[df["Item"].str.lower() == product_name.lower()]
            if ci_match.empty:
                raise HTTPException(status_code=404, detail=f"No data found for: {product_name}")
            product_df = ci_match.copy()
            product_name = ci_match["Item"].iloc[0]  # use canonical casing

        # Use Pettah wholesale price as the target
        product_df = product_df.rename(
            columns={
                "Date": "ds",
                "Pettah_Today_Wholesale": "y"
            }
        )

        # Keep needed columns
        product_df = product_df[["ds", "y"]].copy()

        # Convert date format
        product_df["ds"] = pd.to_datetime(product_df["ds"])

        # ── Preprocessing: clean invalid price values ──────────────────────────
        product_df["y"] = pd.to_numeric(
            product_df["y"].astype(str).str.replace(',', ''), 
            errors="coerce"
        )
        product_df = product_df.dropna(subset=["y"])
        product_df = product_df[product_df["y"] > 0]
        # ── End preprocessing ──────────────────────────────────────────────────

        if len(product_df) < 2:
            raise HTTPException(
                status_code=422,
                detail=f"Insufficient clean data to train model for: {product_name}"
            )

        # Train model
        model = Prophet()
        model.fit(product_df)

        # Predict next 7 days
        future = model.make_future_dataframe(periods=7)
        forecast = model.predict(future)

        # Get the last 7 rows
        future_forecast = forecast.tail(7)

        forecast_list = []
        for _, row in future_forecast.iterrows():
            forecast_list.append({
                "date": row["ds"].strftime("%Y-%m-%d"),
                "predicted": round(float(row["yhat"]), 2),
                "lower": round(float(row["yhat_lower"]), 2),
                "upper": round(float(row["yhat_upper"]), 2)
            })

        return {
            "product": product_name,
            "forecast": forecast_list
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecast failed: {str(e)}")


@app.get("/summary/{product_name}")
def get_summary(product_name: str):
    try:
        # Load dataset
        df = pd.read_csv(DATASET_PATH)

        # Exact match first; fall back to case-insensitive match
        product_df = df[df["Item"] == product_name].copy()
        if product_df.empty:
            ci_match = df[df["Item"].str.lower() == product_name.lower()]
            if ci_match.empty:
                raise HTTPException(status_code=404, detail=f"No data found for: {product_name}")
            product_df = ci_match.copy()
            product_name = ci_match["Item"].iloc[0]  # use canonical casing

        # Base preprocessing for metrics
        metrics_df = product_df.copy()
        metrics_df["Date"] = pd.to_datetime(metrics_df["Date"])
        metrics_df["Pettah_Today_Wholesale"] = pd.to_numeric(
            metrics_df["Pettah_Today_Wholesale"].astype(str).str.replace(',', ''), 
            errors="coerce"
        )
        metrics_df = metrics_df.dropna(subset=["Pettah_Today_Wholesale"])
        metrics_df = metrics_df.sort_values(by="Date", ascending=True)

        if metrics_df.empty:
            raise HTTPException(status_code=404, detail=f"No valid price data for: {product_name}")

        # Metrics based on CSV data
        recent_30 = metrics_df.tail(30)
        recent_7 = metrics_df.tail(7)

        last_month_avg = recent_30["Pettah_Today_Wholesale"].mean()
        last_week_avg = recent_7["Pettah_Today_Wholesale"].mean()
        min_30d = recent_30["Pettah_Today_Wholesale"].min()
        max_30d = recent_30["Pettah_Today_Wholesale"].max()

        # Prophet Prediction for tomorrow_price
        prophet_df = metrics_df.rename(
            columns={"Date": "ds", "Pettah_Today_Wholesale": "y"}
        )[["ds", "y"]].copy()
        
        prophet_df = prophet_df[prophet_df["y"] > 0]

        if len(prophet_df) < 2:
            raise HTTPException(status_code=422, detail=f"Insufficient data to train model for: {product_name}")

        model = Prophet()
        model.fit(prophet_df)

        future = model.make_future_dataframe(periods=1)
        forecast_res = model.predict(future)
        tomorrow_price = float(forecast_res.iloc[-1]["yhat"])

        # Calculate status and trends
        if tomorrow_price > last_month_avg * 1.10:
            market_status = "HIGH"
        elif tomorrow_price < last_month_avg * 0.90:
            market_status = "LOW"
        else:
            market_status = "AVERAGE"

        change_week_percent = ((tomorrow_price - last_week_avg) / last_week_avg) * 100 if last_week_avg else 0
        change_month_percent = ((tomorrow_price - last_month_avg) / last_month_avg) * 100 if last_month_avg else 0

        trend = "UP" if tomorrow_price > last_week_avg else "DOWN"

        return {
            "product": product_name,
            "tomorrow_price": round(tomorrow_price, 2),
            "last_week_avg": round(float(last_week_avg), 2),
            "last_month_avg": round(float(last_month_avg), 2),
            "change_week_percent": round(float(change_week_percent), 1),
            "change_month_percent": round(float(change_month_percent), 1),
            "market_status": market_status,
            "min_30d": round(float(min_30d), 2),
            "max_30d": round(float(max_30d), 2),
            "trend": trend
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary failed: {str(e)}")
