const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const predictRoutes = require('./routes/predict');

// Load environment variables
dotenv.config();

// Import database connection
require('./models');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth',  require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/crops', require('./routes/crops'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/ai',    require('./routes/ai'));
app.use('/predict',     predictRoutes);          // Direct access: /predict/:product
app.use('/api/predict', predictRoutes);          // API-prefixed access: /api/predict/:product
app.use('/api/admin', require('./routes/admin'));

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please stop the process using that port or change PORT in backend/.env.`);
    process.exit(1);
  }
  console.error('Server error:', err);
  process.exit(1);
});