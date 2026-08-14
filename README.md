# BDShop Server

BDShop Server is the backend API for a full-stack e-commerce platform built with Express, TypeScript, MongoDB, and Stripe. It powers the BDShop frontend with product catalog APIs, authentication, checkout, payments, order tracking, admin operations, uploads, email workflows, and security middleware.

This repository contains only the backend API. The frontend application lives in the separate `bdshop-client` repository.

## Project Summary

BDShop is a production-style e-commerce project for selling products such as electronics, vehicles, and accessories. The server is responsible for the trusted business logic: product data, user accounts, checkout totals, coupons, inventory reservation, order creation, payment integration, order tracking, and admin management.

The backend supports guest checkout as well as authenticated checkout. Every order receives a public `BDS-...` order number so customers can track an order without logging in.

## Main Features

### Commerce APIs

- Product catalog with search, category filtering, price filtering, sorting, and pagination.
- Admin product CRUD.
- Inventory fields and stock update support.
- Cart APIs.
- Review APIs and review statistics.
- Address book APIs.
- Order creation, listing, status updates, deletion, and statistics.
- Public order tracking by `BDS-...` order number or Mongo order ID.

### Checkout and Payments

- Server-side checkout quote calculation.
- Trusted subtotal, shipping fee, tax, discount, and final total.
- Coupon support.
- Guest checkout using email.
- Authenticated checkout using logged-in user email.
- Inventory reservation during order creation.
- Stripe PaymentIntent support.
- Stripe webhook endpoint for payment status updates.
- Cash on Delivery support.

### Auth and User Management

- Email/password registration and login.
- JWT access token and refresh token support.
- HttpOnly cookie support.
- Google and Facebook OAuth routes.
- Password reset request and reset flow.
- User profile and password change.
- Admin role management.
- User activation and deactivation.

### Public Workflows

- Newsletter subscription.
- Return request submission.
- Public content routes.
- Customer-safe error messages.
- Email service for password reset, order confirmation, and return notifications.

### Uploads and Inventory Notifications

- Admin image upload route.
- Cloudinary upload support.
- Local upload fallback.
- Pending upload tracking and cleanup.
- Pending upload quota enforcement.
- Back-in-stock notification service.

### Security and Reliability

- Helmet security headers.
- CORS configuration.
- Rate limiting.
- CSRF protection for unsafe API methods.
- Request logging.
- Centralized error handling.
- Production-safe public error responses.
- Environment validation for production.
- Docker-ready build setup.

## Tech Stack

- Node.js
- Express
- TypeScript
- MongoDB
- Mongoose
- Stripe
- Nodemailer
- Cloudinary
- JWT
- Jest
- Supertest
- MongoDB Memory Server

## Repository Structure

```text
bdshop-server/
  src/
    config/                 # Database, environment, logger, Cloudinary
    constants/              # App constants, messages, status codes
    controllers/            # HTTP request handlers
    middleware/             # Auth, validation, CSRF, rate limiting, errors
    models/                 # Mongoose schemas
    routes/                 # Express routes
    services/               # Business logic
    types/                  # TypeScript interfaces
    utils/                  # Response, JWT, logging, async helpers
    app.ts                  # Express app
    seed.ts                 # Seed script
  tests/
    integration/            # API integration tests
    unit/                   # Unit tests
    setup.js                # Test database setup
  server.ts                 # Server entry point
  Dockerfile
  docker-compose.yml
  env.example
  package.json
```

## Requirements

- Node.js 20 or newer recommended.
- npm.
- MongoDB for local development.
- Stripe account for card payments.
- SMTP provider for real email delivery.
- Cloudinary account for persistent image hosting.

Tests use MongoDB Memory Server, so a local MongoDB instance is not required for the Jest test suite.

## Environment Variables

Create `.env` from `env.example`:

```bash
cp env.example .env
```

Core local example:

```env
NODE_ENV=development
PORT=5000
API_PREFIX=/api
MONGODB_URI=mongodb://localhost:27017/bdshop

JWT_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-another-long-random-secret

CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173

STRIPE_SECRET_KEY=sk_test_replace_me
STRIPE_WEBHOOK_SECRET=whsec_replace_me

CLOUDINARY_CLOUD_NAME=replace_me
CLOUDINARY_API_KEY=replace_me
CLOUDINARY_API_SECRET=replace_me

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=replace_me
SMTP_PASS=replace_me
EMAIL_FROM="BDShop <no-reply@bdshop.local>"
```

### Environment Notes

- Do not commit real secrets.
- Production requires strong JWT secrets.
- Stripe card payment requires a real Stripe secret key and matching frontend publishable key.
- Stripe webhook processing requires `STRIPE_WEBHOOK_SECRET`.
- Gmail SMTP usually requires an app password, not the normal account password.
- If SMTP delivery fails, the server logs the failure and keeps critical flows usable where possible.

## Installation

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

Default API:

```text
http://localhost:5000/api
```

Health check:

```text
http://localhost:5000/health
```

Root endpoint:

```text
http://localhost:5000/
```

## Build and Start

Build TypeScript:

```bash
npm run build
```

Start compiled server:

```bash
npm start
```

Run directly with TypeScript:

```bash
npm run start:ts
```

## Seed Data

```bash
npm run seed
```

Fresh seed:

```bash
npm run seed:fresh
```

## Available Scripts

```bash
npm run dev                         # Start development server with nodemon
npm run start:ts                    # Start using ts-node
npm run build                       # Compile TypeScript
npm start                           # Start compiled dist/server.js
npm test                            # Run all Jest tests
npm run test:watch                  # Run tests in watch mode
npm run test:coverage               # Run tests with coverage
npm run test:integration            # Run integration tests
npm run seed                        # Seed database
npm run seed:fresh                  # Clear and seed database
npm run lint                        # Run ESLint
npm run format                      # Format files
```

## Important API Areas

### Products

```text
GET    /api/services
GET    /api/services/:id
POST   /api/services
PUT    /api/services/:id
DELETE /api/services/:id
```

Admin authentication is required for create, update, and delete.

### Checkout and Orders

```text
POST /api/orders/quote
POST /api/orders
GET  /api/orders/my-orders
GET  /api/orders/my-stats
GET  /api/orders/track/:id?email=customer@example.com
GET  /api/orders
PUT  /api/orders/:id
```

Guest checkout uses the email provided in the request body. Authenticated checkout uses the logged-in user's email.

### Stripe Webhook

```text
POST /api/orders/stripe/webhook
```

The webhook route is registered before JSON body parsing so Stripe signature verification can use the raw request body.

Handled events:

- `payment_intent.succeeded`
- `payment_intent.payment_failed`

### Public Order Tracking

Every new order gets a public order number:

```text
BDS-MPXWIHDH-QHUJ
```

Track an order with:

```text
GET /api/orders/track/BDS-MPXWIHDH-QHUJ?email=customer@example.com
```

The `:id` parameter can also be a Mongo order ID. Invalid public IDs return a friendly not-found response instead of a database cast error.

### Public Routes

```text
POST /api/public/newsletter
POST /api/public/returns
```

### Uploads

```text
POST   /api/upload
DELETE /api/upload/pending/expired
```

Upload routes require admin access.

## Checkout Rules

The server is the source of truth for checkout totals.

The frontend sends item IDs, quantities, address, coupon code, and payment method information. The backend:

1. Loads product prices from the database.
2. Validates stock.
3. Calculates subtotal.
4. Applies coupon discounts.
5. Adds shipping fee and tax.
6. Reserves stock during order creation.
7. Creates the order.
8. Sends confirmation email if SMTP is configured.

The frontend should never be trusted for final totals.

## Error Handling Policy

The API avoids exposing raw internal errors in customer-facing responses.

Examples of hidden details:

- Database cast errors.
- Stack traces.
- SMTP credential failures.
- Stripe secret/provider errors.
- Internal server messages.

For server errors, the public response is generic:

```json
{
    "success": false,
    "error": "Something went wrong. Please try again."
}
```

Validation errors remain actionable where safe.

## Tests

Run all tests:

```bash
npm test
```

Run focused suites:

```bash
npm run test:integration:orders
npm run test:integration:users
npm run test:integration:services
npm run test:integration:carts
npm run test:integration:reviews
npm run test:integration:addresses
npm run test:integration:auth
npm run test:integration:upload
```

Coverage:

```bash
npm run test:coverage
```

Test stack:

- Jest
- Supertest
- MongoDB Memory Server
- ts-jest

Important tested flows include:

- Auth and authorization.
- Product catalog.
- Cart.
- Orders and guest checkout.
- Public order tracking by `BDS-...` order number.
- Reviews.
- Addresses.
- Upload permissions.
- Safe public error responses.

## Docker

Build and run:

```bash
docker compose up --build
```

The Dockerfile uses a build stage and starts the compiled server from `dist/server.js`.

Make sure required environment variables are provided before running production-like containers.

## Production Checklist

- Set `NODE_ENV=production`.
- Use strong `JWT_SECRET` and `JWT_REFRESH_SECRET`.
- Set exact `CORS_ORIGIN` and `FRONTEND_URL`.
- Configure MongoDB connection string.
- Configure Stripe secret and webhook secret.
- Configure frontend Stripe publishable key in the client repository.
- Configure SMTP credentials.
- Configure Cloudinary credentials.
- Run `npm run build`.
- Run `npm test`.
- Run `npm audit --omit=dev`.
- Verify guest checkout, card payment, Cash on Delivery, order tracking, and admin order updates.

## Related Repository

Frontend client:

```text
bdshop-client
```

The frontend should use this server's `/api` URL as `VITE_API_BASE_URL`.

## Current Limitations

- Full payment reliability depends on production Stripe webhook configuration.
- Real email delivery depends on valid SMTP credentials.
- Full E2E browser tests are not included yet.
- Advanced inventory reporting can be expanded further.

## Roadmap

- Server-synced wishlist and cart merge.
- More detailed admin inventory analytics.
- More email templates and notification events.
- End-to-end tests for checkout, payment, and auth.
- Structured logging with request correlation across frontend and backend.
