# BdShopServer

A robust Node.js/Express.js REST API for an e-commerce platform with comprehensive user management, product services, shopping cart functionality, order processing, and review system.

## Description

BdShopServer is a full-featured backend API designed for e-commerce applications. It provides a complete solution for managing users, services/products, shopping carts, orders, and customer reviews. The application follows RESTful API principles and implements industry-standard security practices including JWT authentication, role-based authorization, and rate limiting.

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication system
- Role-based access control (User, Admin)
- Protected routes with middleware
- Password hashing with bcryptjs

### 👥 User Management
- User registration and profile management
- Email-based user lookup
- User deactivation/reactivation
- Profile updates with validation

### 🛍️ Service/Product Management
- CRUD operations for services/products
- Category-based filtering
- Search functionality
- Service statistics and analytics
- Image and description management

### 🛒 Shopping Cart System
- Add/remove items from cart
- Update item quantities
- Cart summary with total calculations
- Clear entire cart
- User-specific cart management

### 📦 Order Management
- Create and manage orders
- Order status tracking (pending, confirmed, shipped, delivered, cancelled)
- Payment status management (pending, paid, failed)
- Order filtering by status and email
- Order statistics and analytics
- Structured order items with service references

### ⭐ Review System
- Customer reviews with ratings (1-5 stars)
- Review statistics per service
- Duplicate review prevention
- Service average rating updates
- Review filtering and pagination

### 🛡️ Security Features
- Rate limiting to prevent abuse
- CORS configuration for cross-origin requests
- Security headers with Helmet
- Input validation and sanitization
- Error handling and logging

### 📊 API Features
- RESTful API design
- Consistent response formatting
- Comprehensive error handling
- Request/response logging
- API versioning support

## Technologies Used

### Backend Framework
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework

### Database
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling tool

### Authentication & Security
- **JWT (JSON Web Tokens)** - Authentication
- **bcryptjs** - Password hashing
- **helmet** - Security headers
- **express-rate-limit** - Rate limiting

### Development & Testing
- **Jest** - Testing framework
- **Supertest** - HTTP assertion library
- **mongodb-memory-server** - In-memory MongoDB for testing

### Utilities
- **Winston** - Logging library
- **Morgan** - HTTP request logger
- **compression** - Response compression
- **cors** - Cross-origin resource sharing

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager
- MongoDB (local installation or MongoDB Atlas)

### Step-by-step Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/rashid-mamun/bdshop-server.git
   cd bdshop-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables**
   Edit the `.env` file with your configuration (see Environment Variables section)

5. **Start the server**
   ```bash
   npm start
   ```

## Docker Usage

### Build and Run with Docker Compose

```bash
docker-compose up --build
```

- The API will be available at [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
- MongoDB will be available at `mongodb://localhost:27017/bdshop`

### Stopping the Containers

```bash
docker-compose down
```

### Notes

- You can override environment variables in `docker-compose.yml` as needed.
- For production, set strong secrets and configure CORS appropriately.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/bdshop
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/bdshop

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# API Configuration
API_PREFIX=/api/v1

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## Running the Project

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### With Nodemon (Auto-restart on changes)
```bash
npm run dev:watch
```

## API Endpoints

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication Endpoints

#### Register User
```http
POST /users
Content-Type: application/json

{
  "email": "user@example.com",
  "displayName": "John Doe",
  "password": "password123",
  "district": "Dhaka",
  "division": "Dhaka"
}
```

#### Get User by Email
```http
GET /users/:email
Authorization: Bearer <jwt-token>
```

#### Update User Profile
```http
PUT /users/profile/me
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "displayName": "John Smith",
  "district": "Chittagong",
  "division": "Chittagong"
}
```

### Service Endpoints

#### Get All Services
```http
GET /services?page=1&limit=10&category=electronics&search=laptop
```

#### Get Service by ID
```http
GET /services/:id
```

#### Create Service (Admin Only)
```http
POST /services
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "name": "Gaming Laptop",
  "description": "High-performance gaming laptop",
  "price": 150000,
  "category": "electronics",
  "img": "https://example.com/laptop.jpg",
  "model": "GL-2024",
  "config": "RTX 4070, 32GB RAM"
}
```

#### Update Service (Admin Only)
```http
PUT /services/:id
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "price": 140000,
  "description": "Updated description"
}
```

### Cart Endpoints

#### Add Item to Cart
```http
POST /carts
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "id": "product-123",
  "email": "user@example.com",
  "img": "https://example.com/product.jpg",
  "description": "Product description",
  "model": "Model-X",
  "price": 50000,
  "quantity": 2
}
```

#### Get User Cart
```http
GET /carts/:email
Authorization: Bearer <jwt-token>
```

#### Update Cart Item Quantity
```http
PUT /carts/:id
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "quantity": 3
}
```

#### Remove Item from Cart
```http
DELETE /carts/:id
Authorization: Bearer <jwt-token>
```

#### Clear User Cart
```http
DELETE /carts/clear/:email
Authorization: Bearer <jwt-token>
```

#### Get Cart Summary
```http
GET /carts/summary/:email
Authorization: Bearer <jwt-token>
```

### Order Endpoints

#### Create Order
```http
POST /orders
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "email": "user@example.com",
  "items": [
    {
      "serviceId": "service-id-123",
      "name": "Gaming Laptop",
      "price": 150000,
      "quantity": 1
    }
  ],
  "total": 150000,
  "shippingAddress": {
    "street": "123 Main Street",
    "city": "Dhaka",
    "postalCode": "1200",
    "country": "Bangladesh"
  },
  "paymentStatus": "pending",
  "status": "pending"
}
```

#### Get All Orders
```http
GET /orders?page=1&limit=10&status=pending&email=user@example.com
Authorization: Bearer <jwt-token>
```

#### Get Order by ID
```http
GET /orders/:id
Authorization: Bearer <jwt-token>
```

#### Update Order Status
```http
PUT /orders/:id
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "status": "confirmed",
  "paymentStatus": "paid"
}
```

#### Get Order Statistics (Admin Only)
```http
GET /orders/stats/summary
Authorization: Bearer <admin-jwt-token>
```

### Review Endpoints

#### Get All Reviews
```http
GET /reviews?page=1&limit=10&rating=5
```

#### Get Review by ID
```http
GET /reviews/:id
```

#### Create Review
```http
POST /reviews
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "title": "Great Product!",
  "img": "https://example.com/review.jpg",
  "description": "Excellent quality and fast delivery",
  "star": 5,
  "serviceId": "service-id-123"
}
```

#### Update Review
```http
PUT /reviews/:id
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "star": 4,
  "description": "Updated review"
}
```

#### Get Review Statistics
```http
GET /reviews/stats/:serviceId
```

### Public Endpoints

#### Get All Blogs
```http
GET /blogs
```

#### Get Blog by ID
```http
GET /blogs/:id
```

#### Get All Team Members
```http
GET /teams
```

#### Get Team Member by ID
```http
GET /teams/:id
```

## Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Integration tests
npm run test:integration

# Individual endpoint tests
npm run test:integration:users
npm run test:integration:services
npm run test:integration:orders
npm run test:integration:carts
npm run test:integration:reviews
npm run test:integration:public

# Route testing
npm run test:integration:endpoints

# Health check
npm run test:integration:health
```

### Test Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```


## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the GitHub repository or contact the development team. 