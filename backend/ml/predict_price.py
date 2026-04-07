import json
import os
import sys


def fallback_prediction(payload):
    crop_name = str(payload.get('cropName', 'generic')).lower().strip()
    quantity = float(payload.get('quantityKg', 1) or 1)
    demand_index = float(payload.get('demandIndex', 1.0) or 1.0)
    season_index = float(payload.get('seasonIndex', 1.0) or 1.0)
    fuel_cost_index = float(payload.get('fuelCostIndex', 1.0) or 1.0)

    base_prices = {
        'tomato': 220.0,
        'potato': 120.0,
        'onion': 160.0,
        'carrot': 140.0,
        'cabbage': 90.0,
        'rice': 70.0,
        'wheat': 60.0,
        'corn': 80.0
    }
    base = base_prices.get(crop_name, 150.0)

    # Simple deterministic fallback while the custom model file is being wired.
    adjusted = base * (0.55 + 0.25 * demand_index + 0.15 * season_index + 0.05 * fuel_cost_index)

    # Slight bulk discount if quantity is large.
    if quantity >= 100:
        adjusted *= 0.95
    elif quantity >= 250:
        adjusted *= 0.9

    return max(1.0, round(adjusted, 2))


def model_prediction(payload):
    model_path = os.getenv('PRICE_MODEL_PATH', os.path.join(os.path.dirname(__file__), 'price_model.pkl'))
    if not os.path.exists(model_path):
        return None

    try:
        import joblib  # type: ignore
    except Exception:
        return None

    model = joblib.load(model_path)

    features = [[
        float(payload.get('quantityKg', 1) or 1),
        float(payload.get('demandIndex', 1.0) or 1.0),
        float(payload.get('seasonIndex', 1.0) or 1.0),
        float(payload.get('fuelCostIndex', 1.0) or 1.0)
    ]]

    predicted = float(model.predict(features)[0])
    return max(1.0, round(predicted, 2))


def main():
    raw = sys.stdin.read()
    payload = json.loads(raw) if raw else {}

    predicted = model_prediction(payload)
    model_used = 'trained_model'

    if predicted is None:
        predicted = fallback_prediction(payload)
        model_used = 'fallback_formula'

    quantity = float(payload.get('quantityKg', 1) or 1)
    total = round(predicted * quantity, 2)

    response = {
        'predictedPricePerKg': predicted,
        'estimatedTotalAmount': total,
        'currency': 'INR',
        'modelUsed': model_used
    }
    sys.stdout.write(json.dumps(response))


if __name__ == '__main__':
    main()
