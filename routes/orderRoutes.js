const express = require("express");
const router = express.Router();

// १. सर्व फंक्शन्स नीट इंपोर्ट झाली आहेत का तपासा
const { 
    placeOrder, 
    getFarmerOrders, 
    getCustomerOrders, 
    updateOrderItemStatus, 
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
router.put("/:orderId/items/:itemId/status", protect, authorizeRoles("farmer"), updateOrderItemStatus);

// router.put("/:orderId/collect", collectAtHub);
// router.put("/:orderId/out-for-delivery", outForDelivery);
// router.put("/:orderId/deliver", deliverOrder);

module.exports = router;