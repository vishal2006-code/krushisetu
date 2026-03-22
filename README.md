# KrushiSetu - Farmer to Customer Vegetable Marketplace

A full-stack MERN application that directly connects village farmers with city customers, eliminating middlemen.

## 🚀 Features

- **Authentication System**: JWT-based login/registration for farmers and customers
- **Role-based Access**: Separate dashboards for farmers and customers
- **Order Management**: Place orders, track status, payment processing
- **Real-time Updates**: Live order status and farmer assignment
- **Modern UI**: Responsive design with Tailwind CSS
- **Profile Management**: Update personal information
- **Rate Limiting**: API protection against abuse
- **Input Validation**: Secure data handling

## 🛠️ Tech Stack

### Frontend
- React 19.2.4 + Vite 8.0.0
- Tailwind CSS 3.4.19
- Axios 1.13.6
- React Router DOM 7.13.1

### Backend
- Node.js + Express 5.2.1
- MongoDB + Mongoose 9.2.3
- JWT Authentication
- Bcryptjs 3.0.3

## 📁 Project Structure

```
krushiSetu/
├── config/
│   └── db.js                    # Database connection
├── controllers/
│   ├── authController.js        # Authentication logic
│   ├── orderController.js       # Order management
│   ├── vegetableController.js   # Vegetable CRUD
│   └── farmerController.js      # Farmer profile management
├── models/
│   ├── User.js                  # User schema
│   ├── Order.js                 # Order schema
│   ├── Vegetable.js             # Vegetable schema
│   └── FarmerProfile.js         # Farmer profile schema
├── routes/
│   ├── authRoutes.js            # Auth endpoints
│   ├── orderRoutes.js           # Order endpoints
│   ├── vegetableRoutes.js       # Vegetable endpoints
│   └── farmerRoutes.js          # Farmer endpoints
├── middlewares/
│   ├── authMiddleware.js        # JWT verification
│   └── roleMiddleware.js        # Role-based access
├── utils/
│   └── generateToken.js         # JWT token generation
├── server.js                    # Main server file
└── .env                         # Environment variables

krushisetu-frontend/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx           # Navigation bar
│   │   ├── Login.jsx            # Login/Register form
│   │   ├── CustomerDashboard.jsx # Customer vegetable browsing
│   │   ├── CustomerOrders.jsx   # Customer order history
│   │   ├── FarmerDashboard.jsx  # Farmer order management
│   │   ├── FarmerProfile.jsx    # Farmer profile setup
│   │   └── Profile.jsx          # User profile management
│   ├── context/
│   │   └── AuthContext.jsx      # Authentication state
│   ├── utils/
│   │   └── logout.js            # Logout utility
│   ├── App.jsx                  # Main app component
│   ├── main.jsx                 # App entry point
│   └── index.css                # Global styles
├── public/                      # Static assets
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd krushiSetu
   ```

2. **Backend Setup**
   ```bash
   # Install dependencies
   npm install

   # Copy environment file
   cp .env.example .env

   # Update .env with your values
   # MONGO_URI=mongodb://localhost:27017/krushisetu
   # JWT_SECRET=your_super_secret_jwt_key_here

   # Start MongoDB (if using local)
   mongod

   # Start backend server
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd krushisetu-frontend

   # Install dependencies
   npm install

   # Start development server
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/me` - Update user profile

### Vegetables
- `GET /api/vegetables` - Get all vegetables
- `POST /api/vegetables` - Add new vegetable (Admin)

### Orders
- `POST /api/orders` - Place new order (Customer)
- `GET /api/orders/customer` - Get customer orders
- `GET /api/orders/farmer` - Get farmer orders
- `PUT /api/orders/:id/status` - Update order status (Farmer)
- `PUT /api/orders/:id/pay` - Process payment (Customer)

## 🔐 User Roles

### Customer
- Browse vegetables
- Add to cart and place orders
- View order history
- Make payments
- Update profile

### Farmer
- View assigned orders
- Accept/reject orders
- Update profile with location and crops
- Manage farm information

## 🛡️ Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting (100 requests/15min)
- Input validation and sanitization
- CORS protection
- Role-based access control

## 🚀 Deployment

### Backend Deployment
```bash
# Production build
npm start

# Environment variables for production
NODE_ENV=production
MONGO_URI=your_production_mongo_uri
JWT_SECRET=your_production_jwt_secret
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Serve static files
# Copy dist/ to your web server
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 📞 Support

For support, email support@krushisetu.com or create an issue in the repository.

---

**Built with ❤️ for Indian farmers and customers**