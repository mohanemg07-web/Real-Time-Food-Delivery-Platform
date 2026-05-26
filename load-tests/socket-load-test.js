import { check, sleep } from 'k6';
import ws from 'k6/ws';
import { Counter, Trend } from 'k6/metrics';

const connectionTime = new Trend('ws_connection_time');
const messageLatency = new Trend('ws_message_latency');
const totalMessages = new Counter('total_messages_received');

export const options = {
  stages: [
    { duration: '30s', target: 1000 },
    { duration: '60s', target: 3000 },
    { duration: '60s', target: 5000 },
    { duration: '30s', target: 5000 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    ws_connection_time: ['p(95)<500'],
    ws_message_latency: ['p(95)<200'],
  },
};

// Engine.IO v4 packet types:
//   0 = open      1 = close     2 = ping      3 = pong
//   4 = message   5 = upgrade   6 = noop
//
// Socket.IO v5 packet types (prefixed onto Engine.IO MESSAGE frames):
//   0 = CONNECT       1 = DISCONNECT   2 = EVENT
//   3 = ACK           4 = CONNECT_ERROR
//
// So `40/orders,` = Engine.IO MESSAGE + Socket.IO CONNECT to namespace `/orders`.
// And `42/orders,["join_order","order-123"]` = MESSAGE + EVENT in that namespace.

const NAMESPACE = '/orders';

function parsePayload(raw) {
  // Socket.IO frames look like: 42/orders,["event",{json...}]
  //                     or:     42["event",{json...}]    (default namespace)
  if (!raw || raw[0] !== '4' || raw[1] !== '2') return null;
  let rest = raw.slice(2);
  if (rest.startsWith('/')) {
    const comma = rest.indexOf(',');
    if (comma === -1) return null;
    rest = rest.slice(comma + 1);
  }
  try {
    const arr = JSON.parse(rest);
    if (!Array.isArray(arr) || arr.length < 1) return null;
    return { event: arr[0], data: arr[1] };
  } catch (e) {
    return null;
  }
}

export default function () {
  const orderId = `test-order-${__VU}-${__ITER}`;
  const url = `ws://${__ENV.TARGET_HOST || 'localhost'}/socket.io/?EIO=4&transport=websocket`;

  const startTime = Date.now();

  const res = ws.connect(url, {}, function (socket) {
    // k6 invokes this callback once the WebSocket session is open, so the
    // delta here is the true connection-establishment time. Recording inside
    // socket.on('open') is unreliable — the open event can fire before the
    // listener is registered.
    connectionTime.add(Date.now() - startTime);

    socket.on('message', (msg) => {
      totalMessages.add(1);
      if (!msg) return;

      // Engine.IO open packet: `0{"sid":"...","pingInterval":..., ...}`
      if (msg[0] === '0') {
        // Immediately attach to the /orders namespace.
        socket.send(`40${NAMESPACE},`);
        return;
      }

      // Engine.IO PING from server — must reply with PONG to stay connected.
      if (msg === '2') {
        socket.send('3');
        return;
      }

      // Socket.IO CONNECT ack for our namespace: `40/orders,{"sid":"..."}`
      if (msg.startsWith(`40${NAMESPACE}`)) {
        // Now subscribe to the order's room.
        socket.send(`42${NAMESPACE},${JSON.stringify(['join_order', orderId])}`);
        return;
      }

      // Real EVENT frame.
      const parsed = parsePayload(msg);
      if (parsed && parsed.data && parsed.data.timestamp) {
        messageLatency.add(Date.now() - new Date(parsed.data.timestamp).getTime());
      }
    });

    socket.on('error', (e) => {
      console.error('WS error:', e.error());
    });

    sleep(Math.random() * 10 + 5);
    socket.send(`41${NAMESPACE}`); // Socket.IO DISCONNECT from namespace
    socket.close();
  });

  check(res, { 'WebSocket connected successfully': (r) => r && r.status === 101 });
  sleep(1);
}
