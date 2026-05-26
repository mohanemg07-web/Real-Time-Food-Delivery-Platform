require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const recommendationRoutes = require('./routes/recommendations');
const socketServer = require('./socket/socketServer');

const PORT = parseInt(process.env.PORT, 10) || 3003;

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('combined'));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'order-service',
    connections: socketServer.clientCount(),
  });
});

app.use('/payments', paymentRoutes);
app.use('/recommendations', recommendationRoutes);
app.use('/', orderRoutes);

app.use((req, res, next) => {
  if (res.headersSent) return next();
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, _next) => {
  console.error('[order-service]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const server = http.createServer(app);
socketServer.init(server);

(async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`[order-service] Listening on port ${PORT}`);
  });
})();

function shutdown(signal) {
  console.log(`[order-service] ${signal} received, shutting down`);
  server.close(() => {
    mongoose.connection.close(false).then(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
