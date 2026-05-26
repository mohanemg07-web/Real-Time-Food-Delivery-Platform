# Load Testing

Install k6: https://k6.io/docs/getting-started/installation/

## Run locally

    k6 run --env TARGET_HOST=localhost load-tests/socket-load-test.js

## Run via Docker (no local k6 install needed)

Linux / macOS:

    docker run --rm --network real-timefooddeliveryplatform_food-net \
      -v "$(pwd)/load-tests:/load" \
      grafana/k6 run --env TARGET_HOST=nginx /load/socket-load-test.js

Windows (Git Bash):

    MSYS_NO_PATHCONV=1 docker run --rm \
      --network real-timefooddeliveryplatform_food-net \
      -v "$(pwd -W)/load-tests:/load" \
      grafana/k6 run --env TARGET_HOST=nginx /load/socket-load-test.js

`TARGET_HOST=nginx` reaches the stack through the Nginx reverse-proxy
on the compose network. From outside the stack, use
`TARGET_HOST=localhost` to hit the published port 80.

## Target metrics

  - p95 connection time < 500ms
  - p95 message latency < 200ms
  - 5,000 concurrent WebSocket connections

`ws_message_latency` only records when the server emits an event whose
payload contains a `timestamp` field — i.e. real
`order:status_update` and `delivery:location_update` frames. Test
iterations join synthetic order IDs (`test-order-<VU>-<ITER>`), so no
status events stream back and the latency metric stays at zero during
the load run. To exercise the latency path, place a real order, capture
its `_id`, and set `TEST_ORDER_ID` in a derived script that joins that
ID.

## Notes

  - Ulimit warnings on macOS/Linux are normal at 5k VUs; raise the file
    descriptor limit (`ulimit -n 65535`) before running heavy stages.
  - To bypass Nginx and hit the order-service directly, point
    `TARGET_HOST` at `localhost:3003` (or `order-service:3003` inside
    the compose network) and the script will still work — the Socket.IO
    handshake URL is unchanged.
  - The script speaks Engine.IO v4 + Socket.IO v5 over a raw WebSocket:
    waits for the `0{...}` open packet, sends `40/orders,` to attach to
    the `/orders` namespace, sends `42/orders,["join_order",id]` to
    join the order room, replies `3` to ping (`2`) packets, and sends
    `41/orders` on teardown.
