# KrushiSetu AI Project Context

This document explains the current state of the `krushiSetu` project so another AI or developer can quickly understand the codebase, file structure, feature coverage, and the safest places to extend it.

## 1. Project Summary

KrushiSetu is a full-stack MERN-style marketplace that connects farmers and customers for vegetable ordering.

Current stack:

- Backend: Node.js, Express, MongoDB, Mongoose, JWT auth
- Frontend: React + Vite + Tailwind CSS
- API style: REST
- Authentication: JWT stored in `localStorage`
- Roles: `customer`, `farmer`

Core user flows already present:

- User registration and login
- Role-based routing
- Customer vegetable browsing and order placement
- Customer order tracking and payment marking
- Farmer order viewing and status updates
- Farmer profile setup with available crops
- Favorites
- Notifications
- Reviews and ratings
- AI chatbot via OpenRouter with fallback replies
- Farmer analytics

## 2. Current Architecture

The project is split into two main parts:

1. Root backend API
2. `krushisetu-frontend/` React frontend

Backend responsibilities:

- Connect to MongoDB
- Authenticate users
- Authorize by role
- Expose business APIs for vegetables, orders, farmer profiles, reviews, favorites, notifications, and chat
- Store marketplace state in MongoDB

Frontend responsibilities:

- Handle login and registration
- Persist session in browser storage
- Render role-based dashboard pages
- Call backend APIs
- Provide ordering, profile, favorites, notifications, analytics, and chatbot UI

## 3. High-Level Flow

### Authentication flow

- User registers or logs in from frontend
- Backend returns JWT token + basic user object
- Frontend stores token and user in `localStorage`
- Token is attached to future API requests
- Protected routes check auth state and role

### Customer flow

- Customer logs in
- Customer opens dashboard
- Dashboard shows `OrderForm` and chatbot
- Customer fetches vegetables from backend
- Customer adds items to cart
- Customer places one API request per cart item
- Orders appear in customer order history
- Customer can pay or cancel
- Customer can save favorites, view notifications, and leave reviews

### Farmer flow

- Farmer logs in
- Farmer can update farm profile and choose crops
- Orders assigned to that farmer appear on farmer dashboard
- Farmer can accept/update order status
- Farmer can view analytics
- Farmer can view profile and crop list

## 4. Full File Structure

This structure reflects the main project files currently present in the repo and excludes bulky dependency folders like `node_modules`.

```text
krushiSetu/
├── .env
├── .env.example
├── .gitignore
├── AI_PROJECT_CONTEXT.md
├── DEBUG_REPORT.md
├── FIXES_APPLIED.md
├── FULL_FILE_STRUCTURE.txt
├── package-lock.json
├── package.json
├── PROBLEMS_AND_FIXES.md
├── QUICK_START.md
├── README.md
├── README_FIXES.md
├── SENIOR_DEVELOPER_ANALYSIS.md
├── server.js
├── VERIFICATION_CHECKLIST.md
├── config/
│   ├── db.js
│   └── defaultVegetables.js
├── controllers/
│   ├── authController.js
│   ├── favoriteController.js
│   ├── farmerController.js
│   ├── notificationController.js
│   ├── orderController.js
│   ├── reviewController.js
│   └── vegetableController.js
├── middlewares/
│   ├── authMiddleware.js
│   └── roleMiddleware.js
├── models/
│   ├── Favorite.js
│   ├── FarmerProfile.js
│   ├── Notification.js
│   ├── Order.js
│   ├── Review.js
│   ├── User.js
│   └── Vegetable.js
├── routes/
│   ├── authRoutes.js
│   ├── chatRoutes.js
│   ├── favoriteRoutes.js
│   ├── farmerRoutes.js
│   ├── notificationRoutes.js
│   ├── orderRoutes.js
│   ├── reviewRoutes.js
│   └── vegetableRoutes.js
├── utils/
│   ├── generateToken.js
│   └── getVegetableEmoji.js
└── krushisetu-frontend/
    ├── eslint.config.js
    ├── index.html
    ├── package-lock.json
    ├── package.json
    ├── postcss.config.js
    ├── README.md
    ├── tailwind.config.js
    ├── vercel.json
    ├── vite.config.js
    ├── public/
    │   ├── favicon.svg
    │   └── icons.svg
    └── src/
        ├── App.jsx
        ├── CustomerDashboard.jsx
        ├── CustomerOrders.jsx
        ├── FarmerAnalytics.jsx
        ├── FarmerDashboard.jsx
        ├── FarmerProfile.jsx
        ├── Favorites.jsx
        ├── index.css
        ├── Login.jsx
        ├── main.jsx
        ├── Navbar.jsx
        ├── Notifications.jsx
        ├── Profile.jsx
        ├── Reviews.jsx
        ├── assets/
        │   ├── hero.png
        │   ├── react.svg
        │   └── vite.svg
        ├── components/
        │   ├── Chatbot.jsx
        │   ├── OrderForm.jsx
        │   ├── PageState.jsx
        │   └── SearchFilter.jsx
        ├── context/
        │   ├── AuthContext.jsx
        │   ├── authContextValue.js
        │   ├── ThemeContext.jsx
        │   ├── themeContextValue.js
        │   ├── useAuth.js
        │   └── useTheme.js
        ├── lib/
        │   └── api.js
        └── utils/
            ├── formatters.js
            ├── logout.js
            └── vegetableIcons.js
```

## 5. Backend Breakdown

### `server.js`

Main backend entry point.

Responsibilities:

- Loads env variables
- Connects MongoDB
- Registers common middleware
- Mounts all route modules
- Adds 404 and generic error handler
- Starts Express server

Main mounted API groups:

- `/api/auth`
- `/api/farmers`
- `/api/vegetables`
- `/api/orders`
- `/api/reviews`
- `/api/favorites`
- `/api/notifications`
- `/api/chat`

### `config/db.js`

- Connects to MongoDB using `process.env.MONGO_URI`

### `config/defaultVegetables.js`

- Defines default vegetable seed data
- Used automatically when vegetable data is missing

### `middlewares/authMiddleware.js`

- Reads Bearer token
- Verifies JWT
- Loads user from DB
- Attaches `req.user`

### `middlewares/roleMiddleware.js`

- Checks whether logged-in user has one of the allowed roles

### Models

#### `models/User.js`

Stores:

- `name`
- `email`
- `phone`
- `password`
- `role`
- `city`
- `village`
- `latitude`
- `longitude`
- `verificationStatus`

#### `models/Vegetable.js`

Stores:

- `name`
- `category`
- `price`
- `image`
- `emoji`
- `season`
- `isActive`

#### `models/Order.js`

Stores:

- `customer`
- `vegetable`
- `assignedFarmer`
- `quantity`
- `totalAmount`
- `status`
- `paymentStatus`
- cancel/refund/tracking-related fields

Important note:

- The schema is more advanced than the current controller logic. Some fields exist for future use but are not yet fully used by the UI or API flow.

#### `models/FarmerProfile.js`

Stores:

- `farmer`
- `cropsAvailable`
- `location` as GeoJSON point
- `village`

#### `models/Review.js`

Stores:

- `order`
- `reviewer`
- `reviewee`
- `rating`
- `title`
- `comment`
- `category`
- `helpful`
- `isVerified`

Includes compound unique index:

- One review per `order + reviewer`

#### `models/Favorite.js`

Stores:

- `customer`
- `vegetable`
- optional `farmer`
- `notes`
- `lastOrdered`
- `orderCount`

#### `models/Notification.js`

Stores:

- `user`
- `type`
- `title`
- `message`
- `data`
- `read`
- `readAt`
- `actionUrl`

## 6. Backend Controllers by Feature

### Auth: `controllers/authController.js`

Implemented:

- `registerUser`
- `loginUser`
- `updateProfile`

Behavior:

- Registers users with hashed password
- Validates duplicate email and phone
- Returns JWT token
- Supports profile editing for name, phone, city, village

### Vegetables: `controllers/vegetableController.js`

Implemented:

- `addVegetable`
- `getVegetables`
- `searchVegetables`
- `getByCategory`
- `getSeasonalVegetables`

Behavior:

- Auto-inserts default vegetables if DB is empty/incomplete
- Supports search, category filter, price range, season, sorting

### Orders: `controllers/orderController.js`

Implemented:

- `placeOrder`
- `getCustomerOrders`
- `getFarmerOrders`
- `updateOrderStatus`
- `makePayment`
- `cancelOrder`
- `getFarmerAnalytics`

Behavior:

- Customer places order by vegetable ID + quantity
- Farmer is assigned by matching `FarmerProfile.cropsAvailable`
- Customer can view own orders
- Farmer can view assigned orders
- Farmer can update order status
- Customer can mark payment as paid
- Customer can cancel only if status is `placed`
- Farmer analytics are calculated from assigned orders

### Farmer profile: `controllers/farmerController.js`

Implemented:

- `updateFarmerProfile`
- `getMyFarmerProfile`

Behavior:

- Stores selected crops
- Stores village and coordinates
- Returns populated crop and farmer data

### Reviews: `controllers/reviewController.js`

Implemented:

- `createReview`
- `getFarmerReviews`
- `getFarmerStats`
- `deleteReview`

Behavior:

- Customer can review eligible orders
- Reviews are tied to assigned farmer
- Farmer rating stats are calculated from review data

### Favorites: `controllers/favoriteController.js`

Implemented:

- `addFavorite`
- `removeFavorite`
- `getCustomerFavorites`
- `isFavorited`
- `updateFavoriteNotes`

### Notifications: `controllers/notificationController.js`

Implemented:

- `getUserNotifications`
- `markAsRead`
- `markAllAsRead`
- `deleteNotification`
- `getUnreadCount`
- helper `createNotification`

Important note:

- Notification CRUD exists, but there is not yet strong automatic integration from order/review/payment flows. The helper exists, but it is not wired deeply into all business actions.

### Chat: `routes/chatRoutes.js`

Behavior:

- Accepts user message
- Loads active vegetables and order count
- Sends prompt to OpenRouter if `OPENROUTER_API_KEY` exists
- Returns fallback local replies if AI provider is unavailable

Important note:

- Chat route contains controller logic directly in the route file instead of a dedicated controller module.

## 7. Route Map

### Auth routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/me`
- `GET /api/auth/farmer-dashboard`

### Vegetable routes

- `POST /api/vegetables`
- `GET /api/vegetables`
- `GET /api/vegetables/search`
- `GET /api/vegetables/category/:category`
- `GET /api/vegetables/seasonal`

### Order routes

- `POST /api/orders`
- `GET /api/orders/customer`
- `PUT /api/orders/:orderId/cancel`
- `PUT /api/orders/:orderId/pay`
- `GET /api/orders/farmer`
- `GET /api/orders/farmer/analytics`
- `PUT /api/orders/:orderId/status`

### Farmer profile routes

- `GET /api/farmers/profile/me`
- `POST /api/farmers/profile`

### Review routes

- `POST /api/reviews`
- `DELETE /api/reviews/:reviewId`
- `GET /api/reviews/farmer/:farmerId`
- `GET /api/reviews/stats/my-stats`

### Favorite routes

- `GET /api/favorites/check/:vegetableId`
- `PUT /api/favorites/:vegetableId/notes`
- `DELETE /api/favorites/:vegetableId`
- `POST /api/favorites`
- `GET /api/favorites`

### Notification routes

- `GET /api/notifications/unread`
- `PUT /api/notifications/read-all`
- `PUT /api/notifications/:notificationId/read`
- `DELETE /api/notifications/:notificationId`
- `GET /api/notifications`

### Chat routes

- `POST /api/chat`
- `GET /api/chat/test`

## 8. Frontend Breakdown

### Entry and app shell

#### `src/main.jsx`

- Wraps app with `ThemeProvider`

#### `src/App.jsx`

- Wraps app with `AuthProvider`
- Defines protected routes
- Redirects users based on authentication and role

#### `src/context/AuthContext.jsx`

- Stores `user`, `token`, `loading`, and `error`
- Handles `register`, `login`, `logout`
- Persists session to `localStorage`
- Applies token to shared API client

#### `src/lib/api.js`

- Shared Axios instance
- Reads `VITE_API_URL`
- Clears session on `401`

### Main frontend pages

#### `src/Login.jsx`

- Combined login + registration page
- Registration supports role selection

#### `src/CustomerDashboard.jsx`

- Thin page wrapper
- Renders `OrderForm` and `Chatbot`

#### `src/components/OrderForm.jsx`

- Fetches vegetable list
- Supports search
- Builds local cart in React state
- Places one backend order request per cart item

#### `src/CustomerOrders.jsx`

- Shows customer orders
- Displays payment and order status
- Allows payment trigger

#### `src/FarmerDashboard.jsx`

- Loads farmer-assigned orders
- Allows accept/update status
- Includes chatbot

Important note:

- This page is functional but less polished than some of the newer customer-facing screens.

#### `src/FarmerProfile.jsx`

- Lets farmer choose crops and village
- Saves profile to backend

#### `src/FarmerAnalytics.jsx`

- Fetches analytics from backend
- Shows totals, revenue, payment rate, status distribution

#### `src/Favorites.jsx`

- Shows favorited vegetables
- Supports removal

#### `src/Notifications.jsx`

- Fetches notifications
- Polls every 30 seconds
- Supports read and delete actions

#### `src/Reviews.jsx`

- Displays farmer reviews
- Allows customer to submit review by order ID

#### `src/Profile.jsx`

- Loads current user profile
- Allows profile edit
- If farmer, also loads farmer crop profile

#### `src/Navbar.jsx`

- Role-based sidebar/mobile navigation
- Includes theme toggle

### Shared frontend UI/utilities

#### `src/components/Chatbot.jsx`

- Reusable assistant UI
- Sends chat messages to backend
- Has quick prompts

#### `src/components/PageState.jsx`

- Shared loading, empty, error, skeleton UI states

#### `src/utils/formatters.js`

- Number safety helper
- INR currency formatting helper

#### `src/utils/vegetableIcons.js`

- Maps vegetables to user-friendly emoji/icons

#### `src/index.css`

- Global design system styles
- Light/dark mode tokens
- Reusable visual utility classes

## 9. Current Project Maturity

The project is beyond starter level. It already has:

- Separate backend and frontend
- Working auth
- Role-based protected routes
- DB models for multiple business entities
- Multiple dashboards
- Real user flows across ordering, favorites, reviews, notifications, and analytics
- A cleaner UI layer with reusable state components

At the same time, it is still in an expansion phase rather than a fully production-hardened phase.

## 10. Current Gaps / Incomplete Areas

These are important for future feature work.

### 1. Business logic is only partially integrated

Examples:

- Notifications exist but are not deeply triggered from all order/payment/review actions
- Favorites model includes `farmer`, `lastOrdered`, `orderCount`, but controller usage is minimal
- Order schema includes tracking/refund/delivery fields, but most are not actively used

### 2. No dedicated service layer

Current pattern is:

- Routes -> controllers -> models

This is okay now, but feature growth will become easier if business logic moves into services such as:

- `services/orderService.js`
- `services/notificationService.js`
- `services/reviewService.js`

### 3. Some UI pages are more modern than others

The customer-facing pages and shared UI system are more polished, while some farmer pages still use older direct Axios + alert-based flows.

### 4. Chat route is not modularized

The chatbot logic is inside `routes/chatRoutes.js`. If chat grows, move it into:

- `controllers/chatController.js`
- `services/aiService.js`

### 5. API consistency can improve

Examples:

- Some files use shared `api` instance, others use raw `axios`
- Some server messages are in English, others in Marathi
- Some endpoints return object wrappers, others return arrays directly

### 6. No centralized validation strategy

Only some routes use `express-validator`.

### 7. No automated tests found

There are documentation files and checklists, but no visible backend or frontend test suite in the current structure.

## 11. Best Places to Add New Features

If adding features, these areas are safest and most natural:

### For backend features

- Add new schema fields in `models/`
- Add new controller logic in `controllers/`
- Add new endpoints in `routes/`
- Reuse `protect` and `authorizeRoles`
- Prefer shared helpers/services instead of making route files too large

### For frontend features

- Add new page in `krushisetu-frontend/src/`
- Add reusable UI in `krushisetu-frontend/src/components/`
- Add API helpers to `krushisetu-frontend/src/lib/api.js` or a dedicated feature API module
- Reuse `PageState.jsx` for loading/empty/error states

## 12. Recommended Next Features

These would fit the current architecture well:

- Cart persistence in localStorage
- Real payment gateway integration
- Farmer inventory quantity management
- Customer address management
- Delivery timeline updates
- Auto-notifications for order placed/accepted/delivered/payment
- Review eligibility UI based on actual customer orders
- Admin panel for managing vegetables and users
- Farmer discovery by location
- Better analytics charts
- Real-time notifications with sockets instead of polling
- Image upload for vegetables and farmer profiles

## 13. Recommended Refactor Direction

If continuing this project seriously, the next clean-up path should be:

1. Standardize API response shape
2. Introduce service layer for orders, notifications, reviews, and chat
3. Move chat logic out of route file
4. Replace remaining raw `axios` calls with shared API utilities
5. Add validation middleware across all write endpoints
6. Add automated tests
7. Normalize language and error messaging

## 14. Important Files to Read First

If a new AI should understand the project quickly, read these first in order:

1. `server.js`
2. `routes/orderRoutes.js`
3. `controllers/orderController.js`
4. `models/Order.js`
5. `krushisetu-frontend/src/App.jsx`
6. `krushisetu-frontend/src/context/AuthContext.jsx`
7. `krushisetu-frontend/src/components/OrderForm.jsx`
8. `krushisetu-frontend/src/CustomerOrders.jsx`
9. `krushisetu-frontend/src/FarmerDashboard.jsx`
10. `krushisetu-frontend/src/Profile.jsx`

## 15. Short AI Handoff Prompt

You can give another AI this prompt:

```text
This project is KrushiSetu, a full-stack React + Express + MongoDB farmer-to-customer vegetable marketplace.

Backend is in the repo root and frontend is inside `krushisetu-frontend/`.
Main implemented features: JWT auth, role-based routing, vegetable catalog, order placement, customer orders, farmer orders, farmer profile, favorites, notifications, reviews, chatbot, and farmer analytics.

Please read `AI_PROJECT_CONTEXT.md` first, then inspect:
- server.js
- controllers/orderController.js
- routes/orderRoutes.js
- models/Order.js
- krushisetu-frontend/src/App.jsx
- krushisetu-frontend/src/context/AuthContext.jsx
- krushisetu-frontend/src/components/OrderForm.jsx

While making changes, preserve the current customer/farmer role separation and existing API route style.
```

