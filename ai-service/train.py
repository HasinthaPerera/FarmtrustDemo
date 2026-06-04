import pandas as pd
from prophet import Prophet

# Load CSV file
df = pd.read_csv("farmtrust_prices.csv")

# Select product to test
product_name = "Tomato"

product_df = df[df["Item"] == product_name].copy()

# Rename columns for Prophet
product_df = product_df.rename(
    columns={
        "Date": "ds",
        "Pettah_Today_Wholesale": "y"
    }
)

# Keep only required columns
product_df = product_df[["ds", "y"]]

# Convert date column
product_df["ds"] = pd.to_datetime(product_df["ds"])

# Clean data
product_df["y"] = pd.to_numeric(product_df["y"], errors="coerce")
product_df = product_df.dropna(subset=["y"])
product_df = product_df[product_df["y"] > 0]

print(f"Training on {len(product_df)} rows for {product_name}")

# Create and train model
model = Prophet()
model.fit(product_df)

# Predict next 7 days
future = model.make_future_dataframe(periods=7)
forecast = model.predict(future)

# Show predictions
print(forecast[["ds", "yhat"]].tail(7))