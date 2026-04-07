const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const auth = require('../middleware/auth');

const router = express.Router();

function runPrediction(payload) {
  return new Promise((resolve, reject) => {
    const pythonExecutable = process.env.PYTHON_EXECUTABLE || 'python';
    const scriptPath = path.join(__dirname, '..', 'ml', 'predict_price.py');

    const child = spawn(pythonExecutable, [scriptPath], {
      env: {
        ...process.env,
        PRICE_MODEL_PATH: process.env.PRICE_MODEL_PATH || path.join(__dirname, '..', 'ml', 'price_model.pkl')
      }
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to run predictor: ${err.message}`));
    });

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(stderr || `Predictor exited with code ${code}`));
      }

      try {
        const parsed = JSON.parse(stdout);
        resolve(parsed);
      } catch (parseErr) {
        reject(new Error(`Invalid predictor response: ${stdout}`));
      }
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-prediction' });
});

router.post('/predict-price', auth, async (req, res) => {
  try {
    const {
      cropName,
      quantityKg,
      demandIndex,
      seasonIndex,
      fuelCostIndex
    } = req.body;

    if (!cropName || !quantityKg) {
      return res.status(400).json({ msg: 'cropName and quantityKg are required' });
    }

    const payload = {
      cropName,
      quantityKg: Number(quantityKg),
      demandIndex: Number(demandIndex ?? 1.0),
      seasonIndex: Number(seasonIndex ?? 1.0),
      fuelCostIndex: Number(fuelCostIndex ?? 1.0)
    };

    const prediction = await runPrediction(payload);

    return res.json({
      input: payload,
      prediction
    });
  } catch (err) {
    console.error('AI prediction error:', err);
    return res.status(500).json({ msg: err.message || 'Prediction failed' });
  }
});

module.exports = router;
