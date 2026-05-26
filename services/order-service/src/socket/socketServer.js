const { Server } = require('socket.io');

let io;

function init(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: '*' },
    perMessageDeflate: false,
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6,
    transports: ['websocket', 'polling'],
  });

  io.of('/orders').on('connection', (socket) => {
    socket.on('join_order', (orderId) => {
      if (orderId) socket.join(`order:${orderId}`);
    });
    socket.on('leave_order', (orderId) => {
      if (orderId) socket.leave(`order:${orderId}`);
    });
  });

  io.of('/restaurants').on('connection', (socket) => {
    socket.on('join_restaurant', (restaurantId) => {
      if (restaurantId) socket.join(`restaurant:${restaurantId}`);
    });
    socket.on('leave_restaurant', (restaurantId) => {
      if (restaurantId) socket.leave(`restaurant:${restaurantId}`);
    });
  });

  return io;
}

function getIo() {
  return io;
}

function emitOrderStatus(orderId, status, note) {
  if (!io) return;
  io.of('/orders')
    .to(`order:${orderId}`)
    .emit('order:status_update', {
      orderId: orderId.toString(),
      status,
      note: note || '',
      timestamp: new Date().toISOString(),
    });
}

function emitNewOrder(restaurantId, order) {
  if (!io) return;
  io.of('/restaurants').to(`restaurant:${restaurantId}`).emit('order:new', order);
}

function emitDeliveryLocation(orderId, lat, lng, driverId) {
  if (!io) return;
  io.of('/orders')
    .to(`order:${orderId}`)
    .emit('delivery:location_update', {
      orderId: orderId.toString(),
      lat,
      lng,
      driverId,
      timestamp: new Date().toISOString(),
    });
}

function clientCount() {
  if (!io) return 0;
  return io.engine ? io.engine.clientsCount : 0;
}

module.exports = {
  init,
  getIo,
  emitOrderStatus,
  emitNewOrder,
  emitDeliveryLocation,
  clientCount,
};
