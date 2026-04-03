const express = require("express");
const router = express.Router();

const {
  placeOrder,
  getFarmerOrders,
  getCustomerOrders,
  updateOrderItemStatus,
  makePayment,
  submitRating,
  cancelOrder,
  getFarmerAnalytics,
  acceptOrder,
  pickupComplete,
  acceptPickupTask,
  collectAtHub,
  deliverOrder,
  receiveBatchAtHub,
  markAsPackaged,
  startBatchDelivery,
  confirmDelivery,
  getHubManagerDashboard,
  getDeliveryDashboard
} = require("../controllers/orderController");

const { protect } = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");

router.post("/", protect, authorizeRoles("customer"), placeOrder);
router.get("/customer", protect, authorizeRoles("customer"), getCustomerOrders);
router.put("/:orderId/cancel", protect, authorizeRoles("customer"), cancelOrder);
router.put("/:orderId/pay", protect, authorizeRoles("customer"), makePayment);
router.put("/:orderId/rating", protect, authorizeRoles("customer"), submitRating);

router.get("/farmer", protect, authorizeRoles("farmer"), getFarmerOrders);
router.get("/farmer/analytics", protect, authorizeRoles("farmer"), getFarmerAnalytics);
router.put("/:orderId/items/:itemId/status", protect, authorizeRoles("farmer"), updateOrderItemStatus);
router.put("/:orderId/accept", protect, authorizeRoles("farmer"), acceptOrder);

router.get("/hub/dashboard", protect, authorizeRoles("hub_manager"), getHubManagerDashboard);
router.put("/hub/batches/:batchId/receive", protect, authorizeRoles("hub_manager"), receiveBatchAtHub);
router.put("/hub/orders/:orderId/package", protect, authorizeRoles("hub_manager"), markAsPackaged);
router.post("/hub/delivery-batches", protect, authorizeRoles("hub_manager"), startBatchDelivery);
router.put("/:orderId/hub", protect, authorizeRoles("hub_manager"), collectAtHub);

router.get("/delivery/dashboard", protect, authorizeRoles("delivery_boy"), getDeliveryDashboard);
router.put("/:orderId/pickup/accept", protect, authorizeRoles("delivery_boy"), acceptPickupTask);
router.put("/:orderId/pickup", protect, authorizeRoles("delivery_boy"), pickupComplete);
router.put("/:orderId/deliver", protect, authorizeRoles("delivery_boy"), confirmDelivery);
router.put("/:orderId/confirm-delivery", protect, authorizeRoles("delivery_boy"), deliverOrder);

module.exports = router;
