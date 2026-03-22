const express = require("express");
const router = express.Router();

// १. सर्व फंक्शन्स नीट इंपोर्ट झाली आहेत का तपासा
const { 
    placeOrder, 
    getFarmerOrders, 
    getCustomerOrders, 
    updateOrderStatus, 
    makePayment,
    cancelOrder,
    getFarmerAnalytics
} = require("../controllers/orderController");

const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

// --- Customer Routes ---
router.post("/", protect, authorizeRoles("customer"), placeOrder);
router.get("/customer", protect, authorizeRoles("customer"), getCustomerOrders);
router.put("/:orderId/cancel", protect, authorizeRoles("customer"), cancelOrder);
router.put("/:orderId/pay", protect, authorizeRoles("customer"), makePayment);

// --- Farmer Routes ---
router.get("/farmer", protect, authorizeRoles("farmer"), getFarmerOrders);
router.get("/farmer/analytics", protect, authorizeRoles("farmer"), getFarmerAnalytics);
router.put("/:orderId/status", protect, authorizeRoles("farmer"), updateOrderStatus);

module.exports = router;