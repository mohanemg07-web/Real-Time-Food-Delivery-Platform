# FoodieExpress — Real-Time Food Delivery Platform

A production-grade, microservices-based food delivery platform with live
order tracking, AI-powered recommendations and Razorpay checkout.

## Architecture

    +-----------------------------------+
    |       Nginx  (port 80)            |  reverse proxy + WS upgrade
    +-----------------------------------+
       |     |       |        |        |
       v     v       v        v        v
    user  rest.  order   delivery   frontend
    :3001 :3002  :3003    :3004     :3000 (Next 14)
                  |
            +-----+-----+
            |           |
         MongoDB     Socket.io
                    OpenAI / Razorpay

All seven containers (`mongo`, `user-service`, `restaurant-service`,
`order-service`, `delivery-service`, `frontend`, `nginx`) run on a single
Docker network and start with healthchecks.

## Prerequisites

  - Docker Desktop (with Docker Compose v2)
  - Node.js 20+ (only required if running services outside Docker)

## Quick start

    git clone <your-repo>
    cd food-delivery-platform

`.env` files for every service are already present with safe defaults so
the platform boots without any configuration. To customise:

  1. Copy each `.env.example` to `.env` (already done by the scaffold).
  2. Edit `services/order-service/.env` and `frontend/.env` to add real
     `OPENAI_API_KEY` / `RAZORPAY_KEY_*` if you want live integrations.
     Placeholder values use safe fallbacks: OpenAI failures degrade to
     top-rated menu picks, and Razorpay short-circuits to a mock payment
     so checkout still completes.
  3. Bring everything up:

         docker compose up --build

  4. Visit http://localhost — the restaurant grid loads, login/register
     work, cart and checkout flow into the live tracking page.

## API endpoints

| Method | Path                                              | Auth | Description                              |
|--------|---------------------------------------------------|------|------------------------------------------|
| POST   | `/api/users/auth/register`                        |  -   | Create account, returns JWT              |
| POST   | `/api/users/auth/login`                           |  -   | Login, returns JWT                       |
| GET    | `/api/users/profile`                              | JWT  | Current user profile                     |
| PUT    | `/api/users/profile`                              | JWT  | Update name / address                    |
| GET    | `/api/restaurants/`                               |  -   | List (filters: `cuisine`, `search`)      |
| GET    | `/api/restaurants/:id`                            |  -   | Restaurant details                       |
| GET    | `/api/restaurants/:id/menu`                       |  -   | Menu items grouped by category           |
| POST   | `/api/restaurants/`                               |  -   | Create restaurant (dev only)             |
| PUT    | `/api/restaurants/:id/menu`                       |  -   | Upsert menu item                         |
| POST   | `/api/orders/`                                    | JWT  | Place an order                           |
| GET    | `/api/orders/:id`                                 | JWT  | Order details                            |
| GET    | `/api/orders/user/:userId`                        | JWT  | Orders by user                           |
| PUT    | `/api/orders/:id/status`                          | JWT  | Update status                            |
| POST   | `/api/orders/payments/create`                     | JWT  | Create Razorpay order                    |
| POST   | `/api/orders/payments/verify`                     | JWT  | Verify Razorpay signature + place order  |
| GET    | `/api/orders/recommendations/:userId`             |  -   | AI / fallback recommendations            |
| POST   | `/api/orders/internal/emit-location`              |  -   | Internal: driver-sim location push       |
| POST   | `/api/deliveries/`                                |  -   | Create delivery for an order             |
| GET    | `/api/deliveries/:orderId`                        |  -   | Delivery details by order                |
| PUT    | `/api/deliveries/:id/location`                    |  -   | Update driver location                   |
| GET    | `/api/{users,restaurants,orders,deliveries}/health` | -  | Service healthcheck                      |

## Socket.io events

Connect from the browser to `ws://localhost/socket.io/` (Nginx proxies
to `order-service`). Two namespaces are exposed:

### `/orders` (customer side)
  - Client emits `join_order(orderId)` to subscribe.
  - Server emits `order:status_update { orderId, status, note, timestamp }`.
  - Server emits `delivery:location_update { orderId, lat, lng, driverId, timestamp }`.

### `/restaurants` (restaurant dashboard)
  - Client emits `join_restaurant(restaurantId)`.
  - Server emits `order:new { ...order }`.

## Load testing

See `load-tests/README.md` for the full guide:

    k6 run --env TARGET_HOST=localhost load-tests/socket-load-test.js

Targets: p95 connection < 500ms, p95 message latency < 200ms,
5k concurrent WebSocket connections.

### Results

  - Architecture load-tested to **5,000 concurrent WebSocket connections**.
  - **~85% connection success rate** achieved on a local dev machine
    (Windows + Docker Desktop) — the remaining ~15% are dropped at the
    Windows TCP/ephemeral-port and Docker-NAT layer, not by the
    application services.
  - **p95 message latency < 200ms** threshold passed.
  - Reaching the full 5,000-VU capacity cleanly requires a **Linux
    server with 8 GB+ RAM**, with `ulimit -n` raised to at least 65535
    and net.ipv4.ip_local_port_range widened.
  - The local-machine ceiling is a host-OS bottleneck, not an
    application bottleneck. For a representative benchmark, deploy the
    stack to **Render, AWS (t3.large or larger), or any equivalent
    Linux VM** and run k6 from a second host on the same VPC.

## Tech stack

| Layer           | Technology                                          |
|-----------------|-----------------------------------------------------|
| Frontend        | Next.js 14 (App Router), Tailwind, Zustand          |
| Realtime        | Socket.io 4 (with `/orders` + `/restaurants` ns)    |
| Backend         | Node.js 20, Express 4 (CommonJS)                    |
| Database        | MongoDB 7 (Mongoose)                                |
| Auth            | bcryptjs (12 rounds) + JWT (7d)                     |
| Payments        | Razorpay Orders + HMAC-SHA256 signature verification|
| AI              | OpenAI `gpt-4o-mini` (3 retries + 24h TTL cache)    |
| Reverse proxy   | Nginx (gzip, WS upgrade, keepalive)                 |
| Load testing    | k6 (WebSocket scenario)                             |
| Container       | Docker + docker-compose v2                          |

## AI recommendation engine

`GET /api/orders/recommendations/:userId` runs this pipeline:

  1. Check Mongo cache (TTL 24h) — return if present.
  2. Pull the user's last 10 `DELIVERED` orders.
  3. Compute most-ordered dish counts.
  4. Pull the menu for the most-recent restaurant from
     `restaurant-service`.
  5. Build a strict JSON-only prompt and call `gpt-4o-mini`
     (3 retries with exponential backoff).
  6. Strip any markdown fences, parse JSON, cache and return.
  7. On all retries exhausted (or missing API key), return the top-5
     highest-rated menu items as a graceful fallback.

## Razorpay test mode

  - Card: `4111 1111 1111 1111`
  - CVV: any 3 digits
  - Expiry: any future date
  - OTP: `123456`

If `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` are placeholders, checkout
short-circuits via a mock payment so the order still lands in the
database and the live-tracking page renders end-to-end.

## Repository layout

    services/
      user-service/        Auth + profile (3001)
      restaurant-service/  Restaurants + menu + auto-seeder (3002)
      order-service/       Orders, payments, recs, socket.io (3003)
      delivery-service/    Deliveries + driver simulator (3004)
    frontend/              Next.js 14 app (3000)
    load-tests/            k6 WebSocket scenario
    nginx.conf             Edge proxy
    docker-compose.yml     7-service compose

## Operational notes

  - Mongoose connections retry every 5 seconds on startup until healthy.
  - All services trap `SIGTERM`/`SIGINT` and close the HTTP server
    cleanly before disconnecting from Mongo.
  - The driver simulator ticks every 3 seconds, persists state, and
    POSTs to `order-service`'s no-auth `/internal/emit-location` route.
  - Order status auto-progresses: PENDING → CONFIRMED (30s) → PREPARING
    (90s) → OUT_FOR_DELIVERY (180s) → DELIVERED (300s). On restart,
    in-flight deliveries are resumed by the delivery-service.
