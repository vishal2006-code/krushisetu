# 🚀 KrushiSetu - Quick Start Guide

## Prerequisites
- Node.js (v14+)
- MongoDB running locally or remote connection
- npm or yarn

## 📦 Setup Steps

### 1. Backend Setup
```bash
cd c:\Users\lenovo\Desktop\krushiSetu

# Install dependencies
npm install

# Make sure MongoDB is running
# Then start the server
npm run dev
```
**Expected Output:**
```
Server running on port 5000
✅ MongoDB Connected
```

### 2. Frontend Setup
```bash
cd krushisetu-frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
**Expected Output:**
```
VITE v5.0.0  ready in XXX ms

➜  Local:   http://localhost:5173/
```

## 🔓 Test Login Credentials

### Create New Account
1. Go to http://localhost:5173/
2. Click "Sign Up"
3. Select role: **Farmer** or **Customer**
4. Fill in all details
5. Create account

### Test Users
You can create test users through the signup form or use MongoDB directly.

## 🧭 User Flows

### 👨‍🌾 Farmer Flow
1. **Login** → `/login`
2. **Manage Farm** → `/farmer-profile` 
   - Update location (city, village)
   - Select available crops
   - Save profile
3. **View Orders** → `/farmer-dashboard`
   - See customer orders
   - Accept/manage orders

### 👥 Customer Flow
1. **Login** → `/login`
2. **Browse Vegetables** → `/customer-dashboard`
   - View all available vegetables
   - Add to cart
   - Adjust quantities
3. **Place Orders** → Click "Place Order"
4. **Track Orders** → `/customer-orders`
   - View order status
   - See farmer details

## ⚡ API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Vegetables
- `GET /api/vegetables` - Get all vegetables

### Orders
- `POST /api/orders` - Create new order (protected)
- `GET /api/orders/customer` - Get customer orders (protected)
- `GET /api/orders/farmer` - Get farmer orders (protected)
- `PUT /api/orders/:id/status` - Update order status (protected)

### Farmer Profile
- `POST /api/farmers/profile` - Update farmer profile (protected)

## 🐛 Troubleshooting

### "Cannot find module" Error
```bash
# Delete node_modules and reinstall
rm -r node_modules package-lock.json
npm install
```

### MongoDB Connection Failed
- Ensure MongoDB is running: `mongod`
- Check MONGO_URI in `.env` matches your setup
- Default: `mongodb://127.0.0.1:27017/krushisetu`

### Port Already in Use
```bash
# Change PORT in .env (backend)
PORT=5001

# Or kill process using the port
# Windows: netstat -ano | findstr :5000
# Then: taskkill /PID <PID> /F
```

### CORS Error
- Ensure backend is running on correct port
- Check that frontend .env has correct API_URL
- Frontend CORS is enabled in server.js

## 📝 Environment Files

### Backend (.env)
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/krushisetu
JWT_SECRET=supersecretkey
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## 🎯 Features Implemented

✅ User Authentication (Login/Register)
✅ Role-based Access (Farmer/Customer)
✅ Token-based Authorization
✅ Farmer profile management
✅ Vegetable browsing
✅ Shopping cart
✅ Order placement
✅ Order tracking
✅ Protected routes
✅ Error handling
✅ Loading states
✅ Responsive design

## 📱 Browser Compatibility
- Chrome ✅
- Firefox ✅
- Safari ✅
- Edge ✅

## 🔗 Useful Links
- Vite Docs: https://vitejs.dev/
- React Router: https://reactrouter.com/
- Tailwind CSS: https://tailwindcss.com/
- Axios: https://axios-http.com/
- JWT: https://jwt.io/

## 💡 Pro Tips
1. Use React DevTools to inspect components
2. Check Network tab in DevTools to see API calls
3. Use `localStorage.getItem('token')` in console to verify token
4. Check server logs for detailed error messages
5. Use Postman to test API endpoints directly

## 🆘 Need Help?
Check the detailed fixes in `FIXES_APPLIED.md`

---

Happy coding! 🎉
