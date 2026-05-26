require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const deliveryRoutes = require('./routes/deliveries');
const { stopAll, startSimulation } = require('./simulation/driverSimulator');
const Delivery = require('./models/Delivery');

const PORT = parseInt(process.env.PORT, 10) || 3004;

const app = express();
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('combined'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'delivery-service' });
});

app.use('/', deliveryRoutes);

app.use((req, res, next) => {
  if (res.headersSent) return next();
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, _next) => {
  console.error('[delivery-service]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

let server;
(async () => {
  await connectDB();
  // Resume simulations for any in-flight deliveries after a restart.
  try {
    const inflight = await Delivery.find({ status: { $ne: 'DELIVERED' } }).limit(500);
    for (const d of inflight) startSimulation(d._id);
    console.log(`[delivery-service] Resumed ${inflight.length} active simulations`);
  } catch (e) {
    console.error('[delivery-service] Resume failed:', e.message);
  }
  server = app.listen(PORT, () => {
    console.log(`[delivery-service] Listening on port ${PORT}`);
  });
})();

function shutdown(signal) {
  console.log(`[delivery-service] ${signal} received, shutting down`);
  stopAll();
  if (server) {
    server.close(() => {
      mongoose.connection.close(false).then(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10000).unref();
  } else {
    process.exit(0);
  }
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
