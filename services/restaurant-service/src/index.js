require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const restaurantRoutes = require('./routes/restaurants');
const { runIfEmpty } = require('./seeders/seed');

const PORT = parseInt(process.env.PORT, 10) || 3002;

const app = express();
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('combined'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'restaurant-service' });
});

app.use('/', restaurantRoutes);

app.use((req, res, next) => {
  if (res.headersSent) return next();
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, _next) => {
  console.error('[restaurant-service]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

let server;
(async () => {
  await connectDB();
  try {
    await runIfEmpty();
  } catch (e) {
    console.error('[restaurant-service] Seeder error:', e);
  }
  server = app.listen(PORT, () => {
    console.log(`[restaurant-service] Listening on port ${PORT}`);
  });
})();

function shutdown(signal) {
  console.log(`[restaurant-service] ${signal} received, shutting down`);
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
