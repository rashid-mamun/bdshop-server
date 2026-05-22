# BdShop Server

TypeScript/Express REST API for **BdShop**, an ecommerce backend for Bangladesh. It handles users, OAuth login, products, carts, orders with optional Stripe PaymentIntent support, reviews, shipping addresses, public content, and admin media uploads.

| Item        | Value                       |
| ----------- | --------------------------- |
| Version     | 2.1.0                       |
| License     | ISC                         |
| Author      | rashid-mamun                |
| Default API | `http://localhost:5000/api` |

## Features

| Module    | What it does                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------- |
| Users     | Register, login, logout, refresh token, profile, password change, admin CRUD, activate/deactivate |
| OAuth     | Google and Facebook login; auto-creates users and links provider IDs                              |
| Products  | Catalog CRUD for admins, text search, filtering, sorting, categories, admin stats                 |
| Cart      | Authenticated per-user cart with duplicate product merge                                          |
| Orders    | Server-side product price calculation, optional Stripe payment, status workflow                   |
| Reviews   | One review per user per product, public review list, rating statistics                            |
| Addresses | Multiple user shipping addresses with default address logic                                       |
| Public    | Blogs and team members                                                                            |
| Upload    | Admin-only Cloudinary upload using Multer memory storage                                          |
| Security  | Helmet, CORS, rate limits, JWT, HTTP-only cookies, role checks                                    |

## Architecture

The app uses a layered structure:

```text
Request -> Routes -> Middleware -> Controller -> Service -> Model -> MongoDB
        -> Response helpers
```

Entry point: `server.ts`

App setup: `src/app.ts`

Database connection: `src/config/database.ts`

MongoDB connection failure stops the server by default. Tests use `mongodb-memory-server`; local fallback can be enabled explicitly with `MONGODB_MEMORY_FALLBACK=true`.

## Tech Stack

| Category | Packages                                        |
| -------- | ----------------------------------------------- |
| Runtime  | Node.js 18+, TypeScript                         |
| Server   | Express 4, ts-node, nodemon                     |
| Database | MongoDB, Mongoose 6                             |
| Auth     | jsonwebtoken, bcryptjs, cookie-parser           |
| Payments | Stripe PaymentIntents, currency `bdt`           |
| Media    | Cloudinary, Multer                              |
| Security | Helmet, CORS, express-rate-limit                |
| Logging  | Winston, Morgan                                 |
| Testing  | Jest, Supertest, ts-jest, mongodb-memory-server |
| Quality  | ESLint, Prettier                                |

## Project Structure

```text
bdshop-server/
  server.ts
  src/
    app.ts
    seed.ts
    config/
    constants/
    controllers/
    middleware/
    models/
    routes/
    services/
    types/
    utils/
  tests/
    integration/
    unit/
    setup.js
  env.example
  docker-compose.yml
  Dockerfile
  tsconfig.json
  package.json
  BdShopServer.postman_collection.json
```

## Quick Start

```bash
npm install
cp env.example .env
npm run dev
```

Useful local URLs:

| URL            | Purpose       |
| -------------- | ------------- |
| `GET /health`  | Health check  |
| `GET /`        | API info      |
| `GET /api/...` | Main REST API |

Port note: `environment.ts` defaults to `5000` when `PORT` is unset.

## Environment Variables

| Variable                  | Description                                    | Default                                 |
| ------------------------- | ---------------------------------------------- | --------------------------------------- |
| `NODE_ENV`                | `development`, `test`, or `production`         | `development`                           |
| `PORT`                    | HTTP port                                      | `5000`                                  |
| `HOST`                    | Bind host                                      | `localhost`                             |
| `MONGODB_URI`             | Main MongoDB URI                               | `mongodb://127.0.0.1:27017/bdshop`      |
| `MONGODB_URI_TEST`        | Test DB URI                                    | `mongodb://localhost:27017/bdshop_test` |
| `MONGODB_MEMORY_FALLBACK` | Allow in-memory Mongo fallback outside tests   | `false`                                 |
| `JWT_SECRET`              | Access token secret                            | fallback in non-production              |
| `JWT_REFRESH_SECRET`      | Refresh token secret                           | fallback in non-production              |
| `JWT_EXPIRES_IN`          | Access token TTL                               | `1h`                                    |
| `JWT_REFRESH_EXPIRES_IN`  | Refresh token TTL                              | `7d`                                    |
| `API_PREFIX`              | API route prefix                               | `/api`                                  |
| `API_VERSION`             | Reported API version                           | `v1`                                    |
| `CORS_ORIGIN`             | Allowed frontend origin                        | `http://localhost:5173`                 |
| `FRONTEND_URL`            | Frontend URL used for payment return redirects | `http://localhost:5173`                 |
| `LOG_LEVEL`               | Logger level                                   | `info`                                  |
| `LOG_FILE_PATH`           | Log file path                                  | `logs/app.log`                          |
| `RATE_LIMIT_WINDOW_MS`    | Global rate-limit window                       | `900000`                                |
| `RATE_LIMIT_MAX_REQUESTS` | Global max requests                            | `100`                                   |
| `CLOUDINARY_CLOUD_NAME`   | Cloudinary cloud name                          | required for upload                     |
| `CLOUDINARY_API_KEY`      | Cloudinary API key                             | required for upload                     |
| `CLOUDINARY_API_SECRET`   | Cloudinary secret                              | required for upload                     |
| `STRIPE_SECRET_KEY`       | Stripe secret key                              | required for card payment               |
| `MAX_FILE_SIZE`           | Upload limit in bytes                          | `10485760`                              |

## Scripts

| Command                    | Description                               |
| -------------------------- | ----------------------------------------- |
| `npm start`                | Run `ts-node server.ts`                   |
| `npm run dev`              | Run nodemon with ts-node                  |
| `npm run start-dev`        | Run ts-node-dev                           |
| `npm run build`            | Compile with `tsc`                        |
| `npm test`                 | Run all Jest tests                        |
| `npm run test:integration` | Run integration tests                     |
| `npm run test:coverage`    | Run coverage                              |
| `npm run lint`             | Run ESLint                                |
| `npm run lint:fix`         | Run ESLint autofix                        |
| `npm run format`           | Run Prettier                              |
| `npm run seed`             | Seed sample users and products            |
| `npm run seed:fresh`       | Clear User/Service collections, then seed |

## Authentication

Tokens are issued on register, login, refresh, and OAuth success.

| Method       | How                                                |
| ------------ | -------------------------------------------------- |
| Bearer token | `Authorization: Bearer <accessToken>`              |
| Cookies      | `accessToken` and `refreshToken` HTTP-only cookies |

Refresh endpoint: `POST /api/users/refresh`

Roles currently used by middleware: `user`, `admin`, `superadmin`.

## API Reference

Base API prefix: `/api`

### Users

| Method   | Path                           | Auth                        |
| -------- | ------------------------------ | --------------------------- |
| `POST`   | `/api/users/register`          | No                          |
| `POST`   | `/api/users/login`             | No                          |
| `POST`   | `/api/users/logout`            | No                          |
| `POST`   | `/api/users/refresh`           | No, requires refresh cookie |
| `GET`    | `/api/users/:email`            | Owner/admin                 |
| `GET`    | `/api/users`                   | Admin                       |
| `PUT`    | `/api/users`                   | Authenticated               |
| `PUT`    | `/api/users/admin`             | Admin                       |
| `DELETE` | `/api/users/:email`            | Admin                       |
| `GET`    | `/api/users/profile/me`        | Authenticated               |
| `PUT`    | `/api/users/profile/me`        | Authenticated               |
| `PUT`    | `/api/users/change-password`   | Authenticated               |
| `PUT`    | `/api/users/:email/deactivate` | Admin                       |
| `PUT`    | `/api/users/:email/reactivate` | Admin                       |

### OAuth

| Method | Path                 | Body                                        |
| ------ | -------------------- | ------------------------------------------- |
| `POST` | `/api/auth/google`   | `{ "token": "<google_access_token>" }`      |
| `POST` | `/api/auth/facebook` | `{ "accessToken": "...", "userID": "..." }` |

### Products

| Method   | Path                           | Auth  |
| -------- | ------------------------------ | ----- |
| `GET`    | `/api/services`                | No    |
| `GET`    | `/api/services/search?q=...`   | No    |
| `GET`    | `/api/services/categories/all` | No    |
| `GET`    | `/api/services/stats/overview` | Admin |
| `GET`    | `/api/services/:id`            | No    |
| `POST`   | `/api/services`                | Admin |
| `PUT`    | `/api/services/:id`            | Admin |
| `DELETE` | `/api/services/:id`            | Admin |

Supported list filters include `page`, `limit`, `category`, `minPrice`, `maxPrice`, `search`, `featured`, `flashDeal`, `newArrival`, `rating`, and `sort`.

### Cart

| Method   | Path                        | Auth          |
| -------- | --------------------------- | ------------- |
| `POST`   | `/api/carts`                | Authenticated |
| `GET`    | `/api/carts/:email`         | Owner/admin   |
| `GET`    | `/api/carts/summary/:email` | Owner/admin   |
| `PUT`    | `/api/carts/:id`            | Owner/admin   |
| `DELETE` | `/api/carts/:id`            | Owner/admin   |
| `DELETE` | `/api/carts/clear/:email`   | Owner/admin   |

### Orders

| Method   | Path                        | Auth          |
| -------- | --------------------------- | ------------- |
| `POST`   | `/api/orders`               | Authenticated |
| `GET`    | `/api/orders`               | Admin         |
| `GET`    | `/api/orders/my-orders`     | Authenticated |
| `GET`    | `/api/orders/my-stats`      | Authenticated |
| `GET`    | `/api/orders/stats/summary` | Admin         |
| `GET`    | `/api/orders/:id`           | Owner/admin   |
| `PUT`    | `/api/orders/:id`           | Admin         |
| `DELETE` | `/api/orders/:id`           | Admin         |

Order totals are recomputed from `Service` documents on create. Client totals are ignored, stock is checked and reserved atomically, and failed payment setup restores reserved stock.

### Reviews

| Method   | Path                            | Auth          |
| -------- | ------------------------------- | ------------- |
| `GET`    | `/api/reviews`                  | No            |
| `GET`    | `/api/reviews/stats/:serviceId` | No            |
| `GET`    | `/api/reviews/my-reviews`       | Authenticated |
| `GET`    | `/api/reviews/:id`              | No            |
| `POST`   | `/api/reviews`                  | Authenticated |
| `PUT`    | `/api/reviews/:id`              | Owner/admin   |
| `DELETE` | `/api/reviews/:id`              | Owner/admin   |

### Addresses

| Method   | Path                             | Auth          |
| -------- | -------------------------------- | ------------- |
| `GET`    | `/api/addresses`                 | Authenticated |
| `POST`   | `/api/addresses`                 | Authenticated |
| `PUT`    | `/api/addresses/:id`             | Authenticated |
| `DELETE` | `/api/addresses/:id`             | Authenticated |
| `PATCH`  | `/api/addresses/:id/set-default` | Authenticated |

### Upload

| Method | Path          | Auth                                        |
| ------ | ------------- | ------------------------------------------- |
| `POST` | `/api/upload` | Admin, `multipart/form-data`, field `image` |

### Public Routes

| Method | Path         | Auth |
| ------ | ------------ | ---- |
| `GET`  | `/blogs`     | No   |
| `GET`  | `/blogs/:id` | No   |
| `GET`  | `/team`      | No   |
| `GET`  | `/team/:id`  | No   |

## Data Models

Main models:

- `User`: email, displayName, password, role, status, profile fields, OAuth IDs.
- `Service`: product catalog data, stock, price, rating, merchandising flags.
- `Cart`: product snapshot, email, quantity.
- `Order`: email, items, total, shipping address, payment and order status.
- `Review`: name, email, serviceId, title, description, star.
- `Address`: userId, phone, addressLine, district, division, postalCode, default flag.
- `Blog` and `OurTeam`: public content.

## Database & Seeding

```bash
npm run seed
npm run seed:fresh
```

Seed accounts:

| Role  | Email              | Password     |
| ----- | ------------------ | ------------ |
| Admin | `admin@bdshop.com` | `Admin1234!` |
| User  | `rahim@gmail.com`  | `Test1234!`  |
| User  | `karim@gmail.com`  | `Test1234!`  |

## Docker

```bash
docker-compose up --build
docker-compose down
```

Docker starts MongoDB and the app on port `5000`.

## Testing

```bash
npm run build
npm test
```

Latest local verification on 2026-05-22:

| Command         | Result                             |
| --------------- | ---------------------------------- |
| `npm run build` | Passed                             |
| `npm test`      | 27 suites passed, 313 tests passed |

## Postman

Import `BdShopServer.postman_collection.json` for prepared requests.

## Notes From Review

- User lookup is protected by owner/admin authorization.
- Public review responses do not expose reviewer email addresses.
- Cart and order flows use server-side product data for pricing and stock validation.
- Uploads are image-only and rate-limited.
