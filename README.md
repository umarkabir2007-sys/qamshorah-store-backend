# 🛍️ QAMSHORAH STORE - Backend API

Complete e-commerce backend API built with Node.js, Express, and PostgreSQL.

## 🚀 Features

- 🔐 **Authentication**: JWT-based authentication with refresh tokens
- 🛒 **Shopping Cart**: Full cart management
- 📦 **Orders**: Order processing with status tracking
- ⭐ **Reviews**: Product reviews and ratings
- ❤️ **Wishlist**: User wishlist management
- 📍 **Addresses**: Multiple address management
- 🛡️ **Security**: Rate limiting, input validation, Helmet.js
- 📊 **Dashboard**: Admin dashboard with analytics
- 💳 **Payments**: Stripe/PayPal integration ready
- 📧 **Email**: Automated emails (welcome, order confirmation, etc.)
- 🚀 **Caching**: Redis caching for improved performance

## 📁 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh-token` - Refresh JWT token

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Cart
- `GET /api/cart` - Get cart
- `POST /api/cart/add` - Add to cart
- `PUT /api/cart/update/:productId` - Update cart
- `DELETE /api/cart/remove/:productId` - Remove from cart
- `DELETE /api/cart/clear` - Clear cart

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/my-orders` - Get user orders
- `GET /api/orders/:id` - Get single order
- `PUT /api/orders/:id/cancel` - Cancel order

### Users
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/change-password` - Change password
- `GET /api/users/addresses` - Get addresses
- `POST /api/users/addresses` - Add address

### Reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/product/:productId` - Get product reviews
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Admin
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/users` - All users
- `GET /api/admin/orders` - All orders
- `GET /api/admin/reports/sales` - Sales report

## 🛠️ Tech Stack

- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Cache**: Redis
- **Authentication**: JWT
- **File Upload**: Multer + Cloudinary
- **Email**: Nodemailer
- **Security**: Helmet, CORS, Express Rate Limit
- **Validation**: Validator.js

## ⚙️ Installation

```bash
# Clone repository
git clone https://github.com/yourusername/qamshorah-store-backend.git

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your values

# Start development server
npm run dev

# Start production server
npm start