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