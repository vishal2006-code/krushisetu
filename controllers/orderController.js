const crypto = require("crypto");
const Hub = require("../models/Hub");
const DeliveryBoy = require("../models/DeliveryBoy");
const FarmerProfile = require("../models/FarmerProfile");
const Order = require("../models/Order");
const Vegetable = require("../models/Vegetable");

const ACTIVE_PICKUP_STATUSES = ["pickup_assigned", "picked_from_farmer"];
const ACTIVE_DELIVERY_STATUSES = ["out_for_delivery"];

function isValidPoint(location) {
  return (
    location &&
    location.type === "Point" &&
    Array.isArray(location.coordinates) &&
    location.coordinates.length === 2 &&
    location.coordinates.every((value) => Number.isFinite(Number(value)))
  );
}

function generateBatchId(prefix) {
  return `${prefix}-${crypto.randomUUID().split("-")[0]}-${Date.now().toString(36)}`;
}

function pushTimeline(order, status, notes) {
  order.trackingTimeline.push({
    status,
    notes,
    timestamp: new Date()
  });
}

function getFarmerItems(order, farmerId) {
  return (order.orderItems || []).filter(
    (item) => item.farmer && item.farmer.toString() === farmerId.toString()
  );
}

async function findNearestHub(location) {
  if (!isValidPoint(location)) {
    return null;
  }

  return Hub.findOne({
    location: {
      $near: {
        $geometry: location,
        $maxDistance: 10000
      }
    }
  });
}

async function findNearbyGroupedPickup(farmerProfile, hubId) {
  const nearbyProfiles = await FarmerProfile.find({
    location: {
      $near: {
        $geometry: farmerProfile.location,
        $maxDistance: 2000
      }
    }
  }).select("farmer");

  const nearbyFarmerIds = nearbyProfiles.map((profile) => profile.farmer);
  if (!nearbyFarmerIds.length) {
    return null;
  }

  return Order.findOne({
    batchId: { $exists: true, $ne: null },
    pickupBoy: { $exists: true, $ne: null },
    hub: hubId,
    status: { $in: ACTIVE_PICKUP_STATUSES },
    $or: [
      { assignedFarmer: { $in: nearbyFarmerIds } },
      { "orderItems.farmer": { $in: nearbyFarmerIds } }
    ]
  }).sort({ createdAt: -1 });
}

async function resolveDeliveryBoyFromUser(userId, type) {
  return DeliveryBoy.findOne({
    user: userId,
    type
  });
}

async function updateBatchQuantities(batchId, farmerId) {
  const orders = await Order.find({ batchId });

  const totalBatchQuantity = orders.reduce((sum, order) => {
    const orderQuantity = (order.orderItems || []).reduce(
      (itemSum, item) => itemSum + (Number(item.quantity) || 0),
      0
    );
    return sum + orderQuantity;
  }, 0);

  const farmerHandoverQuantity = orders.reduce((sum, order) => {
    const farmerQuantity = getFarmerItems(order, farmerId).reduce(
      (itemSum, item) => itemSum + (Number(item.quantity) || 0),
      0
    );
    return sum + farmerQuantity;
  }, 0);

  await Order.updateMany(
    { batchId },
    {
      $set: {
        "batchMeta.totalBatchQuantity": totalBatchQuantity
      }
    }
  );

  await Order.updateMany(
    { batchId, $or: [{ assignedFarmer: farmerId }, { "orderItems.farmer": farmerId }] },
    {
      $set: {
        "batchMeta.farmerHandoverQuantity": farmerHandoverQuantity
      }
    }
  );

  return {
    totalBatchQuantity,
    farmerHandoverQuantity
  };
}

async function maybeReleasePickupBoy(batchId) {
  const batchOrders = await Order.find({ batchId }).select("status pickupBoy");
  if (!batchOrders.length || !batchOrders[0].pickupBoy) {
    return;
  }

  const hasActivePickup = batchOrders.some((order) => ACTIVE_PICKUP_STATUSES.includes(order.status));

  if (!hasActivePickup) {
    await DeliveryBoy.findByIdAndUpdate(batchOrders[0].pickupBoy, { isAvailable: true });
  }
}

async function maybeReleaseDeliveryBoy(deliveryBatchId, deliveryBoyId) {
  if (!deliveryBoyId) {
    return;
  }

  if (!deliveryBatchId) {
    await DeliveryBoy.findByIdAndUpdate(deliveryBoyId, { isAvailable: true });
    return;
  }

  const activeOrders = await Order.countDocuments({
    deliveryBatchId,
    status: { $in: ACTIVE_DELIVERY_STATUSES }
  });

  if (activeOrders === 0) {
    await DeliveryBoy.findByIdAndUpdate(deliveryBoyId, { isAvailable: true });
  }
}

async function startBatchDeliveryInternal({ orderIds, areaLabel, deliveryBoyId }) {
  const orders = await Order.find({ _id: { $in: orderIds } });
  if (!orders.length) {
    return { error: { code: 404, message: "Orders not found" } };
  }

  const invalidOrder = orders.find((order) => !["arrived_at_hub", "packaged"].includes(order.status));
  if (invalidOrder) {
    return {
      error: {
        code: 400,
        message: `Order ${invalidOrder._id} must reach hub before delivery assignment`
      }
    };
  }

  const referenceOrder = orders[0];
  let deliveryBoy = null;

  if (deliveryBoyId) {
    deliveryBoy = await DeliveryBoy.findOne({
      _id: deliveryBoyId,
      type: "delivery"
    });
  } else if (isValidPoint(referenceOrder.location)) {
    deliveryBoy = await DeliveryBoy.findOne({
      type: "delivery",
      isAvailable: true,
      location: {
        $near: {
          $geometry: referenceOrder.location,
          $maxDistance: 10000
        }
      }
    });
  }

  if (!deliveryBoy) {
    return {
      error: {
        code: 400,
        message: "No delivery boy available for this batch"
      }
    };
  }

  const deliveryBatchId = generateBatchId("DEL");

  for (const order of orders) {
    order.deliveryBoy = deliveryBoy._id;
    order.deliveryBatchId = deliveryBatchId;
    order.status = "out_for_delivery";
    order.batchMeta = {
      ...order.batchMeta,
      deliveryAreaLabel: areaLabel || order.batchMeta?.deliveryAreaLabel || ""
    };
    pushTimeline(
      order,
      "out_for_delivery",
      areaLabel ? `Out for delivery in ${areaLabel}` : "Out for delivery"
    );
    await order.save();
  }

  await DeliveryBoy.findByIdAndUpdate(deliveryBoy._id, { isAvailable: false });

  return {
    orders,
    deliveryBoy,
    deliveryBatchId
  };
}

exports.placeOrder = async (req, res) => {
  try {
    const { orderItems, deliveryAddress, notes, location } = req.body;

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({ message: "किमान एक भाजी निवडा!" });
    }

    if (!location || !isValidPoint(location)) {
      return res.status(400).json({
        message: "Customer location required"
      });
    }

    let totalAmount = 0;
    const processedItems = [];

    for (const item of orderItems) {
      const { vegetableId, quantity } = item;
      const vegetable = await Vegetable.findById(vegetableId);

      if (!vegetable) {
        return res.status(404).json({
          message: `भाजी ${vegetableId} सापडली नाही!`
        });
      }

      const price = Number(vegetable.price) || 0;
      const qty = Number(quantity) || 0;
      totalAmount += price * qty;

      const farmerProfile = await FarmerProfile.findOne({
        cropsAvailable: vegetableId,
        location: {
          $near: {
            $geometry: location,
            $maxDistance: 10000
          }
        }
      });

      if (!farmerProfile) {
        return res.status(404).json({
          message: "या भाजीसाठी 10km मध्ये कोणताही शेतकरी उपलब्ध नाही!"
        });
      }

      processedItems.push({
        vegetable: vegetableId,
        farmer: farmerProfile.farmer,
        quantity: qty,
        price,
        status: "assigned"
      });
    }

    if (totalAmount < 100) {
      return res.status(400).json({
        message: "किमान ऑर्डर मूल्य ₹100 असावे!"
      });
    }

    const deliveryCharge = 10;
    totalAmount += deliveryCharge;

    const order = await Order.create({
      customer: req.user._id,
      orderItems: processedItems,
      totalAmount,
      deliveryCharge,
      deliveryAddress,
      location,
      notes,
      status: "pending_farmer_acceptance",
      paymentStatus: "pending",
      trackingTimeline: [{ status: "placed", notes: "Order placed successfully" }]
    });

    res.status(201).json({
      message: "ऑर्डर यशस्वी! 🚜",
      order
    });
  } catch (error) {
    console.error("Order Error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getCustomerOrders = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const orders = await Order.find({ customer: req.user._id })
      .populate("customer", "name email phone")
      .populate("vegetable", "name emoji category price unit")
      .populate("assignedFarmer", "name email phone city village")
      .populate("orderItems.vegetable", "name emoji category price unit")
      .populate("orderItems.farmer", "name email phone city village")
      .populate("pickupBoy", "name phone type")
      .populate("deliveryBoy", "name phone type")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.getFarmerOrders = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const farmerId = req.user._id;

    const orders = await Order.find({
      $or: [{ assignedFarmer: farmerId }, { "orderItems.farmer": farmerId }]
    })
      .populate("customer", "name email phone city village")
      .populate("vegetable", "name emoji category price unit")
      .populate("assignedFarmer", "name email phone city village")
      .populate("orderItems.vegetable", "name emoji category price unit")
      .populate("orderItems.farmer", "name email phone city village")
      .populate("pickupBoy", "name phone type")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.updateOrderItemStatus = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { status } = req.body;
    const allowedItemStatuses = ["assigned", "accepted", "picked_from_farmer", "arrived_at_hub"];

    if (!allowedItemStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid item status" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "ऑर्डर सापडली नाही!" });
    }

    const item = order.orderItems.id(itemId);
    if (!item) {
      return res.status(404).json({ message: "आयटम सापडला नाही!" });
    }

    if (item.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "या आयटमला तुम्ही नियुक्त नाही!" });
    }

    item.status = status;
    pushTimeline(order, `item_${status}`, `Item ${itemId} status updated to ${status}`);

    const allItemsStatus = order.orderItems.map((currentItem) => currentItem.status);
    if (allItemsStatus.every((value) => value === "arrived_at_hub")) {
      order.status = "arrived_at_hub";
      pushTimeline(order, "arrived_at_hub", "All items reached hub");
    } else if (allItemsStatus.some((value) => value === "picked_from_farmer")) {
      order.status = "picked_from_farmer";
    } else if (allItemsStatus.some((value) => value === "accepted")) {
      order.status = "accepted_by_farmer";
    }

    await order.save();

    res.status(200).json({ message: "स्टेटस अपडेट झाले! ✅", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.makePayment = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findByIdAndUpdate(
      orderId,
      { paymentStatus: "paid" },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "ऑर्डर सापडली नाही!" });
    }

    res.status(200).json({ message: "पेमेंट यशस्वी! 💳", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// orderController.js मधील submitRating चा सुधारित भाग
exports.submitRating = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rating, review } = req.body;

    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: "Rating 1 ते 5 च्या दरम्यान असावे!" });
    }

    const order = await Order.findById(orderId);
    if (!order || order.status !== "delivered") {
      return res.status(400).json({ message: "ऑर्डर डिलीव्हर झाल्याशिवाय रेटिंग देता येणार नाही!" });
    }

    // शेतकरी शोधण्याचे लॉजिक (दोन्ही प्रकारच्या ऑर्डर्ससाठी)
    const farmerId = order.assignedFarmer || order.orderItems?.[0]?.farmer;

    order.rating = numericRating;
    order.review = review || "";
    order.trackingTimeline.push({ status: "rated", notes: `Customer rated ${numericRating} stars`, timestamp: new Date() });
    await order.save();

    // Aggregation pipeline ने अचूक ॲव्हरेज काढणे
    const stats = await Order.aggregate([
      { $match: { 
          $or: [{ assignedFarmer: farmerId }, { "orderItems.farmer": farmerId }],
          rating: { $exists: true, $gt: 0 } 
      }},
      { $group: { 
          _id: null, 
          avg: { $avg: "$rating" }, 
          count: { $sum: 1 } 
      }}
    ]);

    if (stats.length > 0) {
      await FarmerProfile.findOneAndUpdate(
        { farmer: farmerId },
        { 
          averageRating: parseFloat(stats[0].avg.toFixed(1)), 
          totalRatings: stats[0].count 
        }
      );
    }

    res.status(200).json({ message: "Rating सबमिट झाले! ⭐", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getHubManagerDashboard = async (req, res) => {
  try {
    const [hubPipelineOrders, packaged, outForDelivery] = await Promise.all([
      Order.find({ status: { $in: ["picked_from_farmer", "arrived_at_hub"] } })
        .populate("customer", "name phone")
        .populate("pickupBoy", "name phone")
        .sort({ updatedAt: -1 }),
      Order.find({ status: "packaged" })
        .populate("customer", "name phone")
        .populate("deliveryBoy", "name phone")
        .sort({ updatedAt: -1 }),
      Order.find({ status: "out_for_delivery" })
        .populate("customer", "name phone")
        .populate("deliveryBoy", "name phone")
        .sort({ updatedAt: -1 })
    ]);

    res.json({
      stats: {
        awaitingHub: hubPipelineOrders.filter((order) => order.status === "picked_from_farmer").length,
        atHub: hubPipelineOrders.filter((order) => order.status === "arrived_at_hub").length,
        packaged: packaged.length,
        outForDelivery: outForDelivery.length
      },
      awaitingHub: hubPipelineOrders,
      packaged,
      outForDelivery
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDeliveryDashboard = async (req, res) => {
  try {
    const deliveryProfile = await DeliveryBoy.findOne({ user: req.user._id });
    if (!deliveryProfile) {
      return res.status(404).json({ message: "Delivery boy profile not found" });
    }

    const [pickupRuns, deliveryRuns] = await Promise.all([
      Order.find({
        pickupBoy: deliveryProfile._id,
        status: { $in: ACTIVE_PICKUP_STATUSES }
      })
        .populate("customer", "name phone")
        .populate("assignedFarmer", "name phone city village")
        .sort({ updatedAt: -1 }),
      Order.find({
        deliveryBoy: deliveryProfile._id,
        status: { $in: ["out_for_delivery", "delivered"] }
      })
        .populate("customer", "name phone city village")
        .sort({ updatedAt: -1 })
    ]);

    res.json({
      deliveryProfile,
      pickupRuns,
      deliveryRuns
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.acceptOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const farmerProfile = await FarmerProfile.findOne({ farmer: req.user._id });
    if (!farmerProfile || !isValidPoint(farmerProfile.location)) {
      return res.status(404).json({
        message: "Farmer profile with valid location not found"
      });
    }

    const farmerItems = getFarmerItems(order, req.user._id);
    if (!farmerItems.length) {
      return res.status(403).json({
        message: "This order is not assigned to the current farmer"
      });
    }

    const hub = await findNearestHub(farmerProfile.location);
    if (!hub) {
      return res.status(400).json({
        message: "No nearby hub found within 10 km"
      });
    }

    const existingGroupedOrder = await findNearbyGroupedPickup(farmerProfile, hub._id);
    let pickupBoy = null;
    let batchId = null;
    let groupedPickup = false;

    if (existingGroupedOrder?.pickupBoy && existingGroupedOrder?.batchId) {
      pickupBoy = await DeliveryBoy.findById(existingGroupedOrder.pickupBoy);
      batchId = existingGroupedOrder.batchId;
      groupedPickup = true;
    } else {
      pickupBoy = await DeliveryBoy.findOne({
        type: "pickup",
        isAvailable: true,
        location: {
          $near: {
            $geometry: farmerProfile.location,
            $maxDistance: 10000
          }
        }
      });

      if (!pickupBoy) {
        return res.status(400).json({
          message: "No available pickup boy found within 10 km"
        });
      }

      batchId = generateBatchId("PICK");
      await DeliveryBoy.findByIdAndUpdate(pickupBoy._id, { isAvailable: false });
    }

    farmerItems.forEach((item) => {
      item.status = "accepted";
    });

    order.assignedFarmer = req.user._id;
    order.hub = hub._id;
    order.pickupBoy = pickupBoy._id;
    order.batchId = batchId;
    order.status = "pickup_assigned";
    order.batchMeta = {
      ...order.batchMeta,
      pickupTaskStatus: "requested",
      pickupAcceptedAt: null,
      groupedPickup,
      nearbyPickupNote: groupedPickup ? "Courier is picking up nearby orders" : ""
    };

    pushTimeline(
      order,
      "pickup_assigned",
      groupedPickup
        ? "Pickup boy joined an active milk-run batch"
        : "Pickup boy assigned"
    );

    await order.save();

    const quantities = await updateBatchQuantities(batchId, req.user._id);
    const updatedOrder = await Order.findById(order._id)
      .populate("pickupBoy", "name phone type")
      .populate("hub", "name");

    res.json({
      message: groupedPickup
        ? "Order accepted and attached to grouped pickup batch"
        : "Order accepted and pickup assigned",
      order: updatedOrder,
      batchSummary: {
        batchId,
        groupedPickup,
        totalBatchQuantity: quantities.totalBatchQuantity,
        farmerHandoverQuantity: quantities.farmerHandoverQuantity,
        pickupBoy: updatedOrder.pickupBoy,
        hub: updatedOrder.hub
      }
    });
  } catch (error) {
    console.error("Accept Error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.pickupComplete = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const deliveryProfile = await resolveDeliveryBoyFromUser(req.user._id, "pickup");
    if (!deliveryProfile) {
      return res.status(404).json({ message: "Pickup delivery profile not found" });
    }

    if (!order.pickupBoy || order.pickupBoy.toString() !== deliveryProfile._id.toString()) {
      return res.status(403).json({ message: "This pickup is not assigned to you" });
    }

    if (order.status !== "pickup_assigned") {
      return res.status(400).json({ message: "Pickup is not assigned for this order" });
    }

    if (order.batchMeta?.pickupTaskStatus !== "accepted") {
      return res.status(400).json({ message: "Pickup task must be accepted before completion" });
    }

    order.status = "picked_from_farmer";
    order.orderItems.forEach((item) => {
      if (item.status === "accepted") {
        item.status = "picked_from_farmer";
      }
    });
    pushTimeline(order, "picked_from_farmer", "Pickup completed at farmer location");

    await order.save();

    res.json({ message: "Pickup completed successfully", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.acceptPickupTask = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const deliveryProfile = await resolveDeliveryBoyFromUser(req.user._id, "pickup");
    if (!deliveryProfile) {
      return res.status(404).json({ message: "Pickup delivery profile not found" });
    }

    if (!order.pickupBoy || order.pickupBoy.toString() !== deliveryProfile._id.toString()) {
      return res.status(403).json({ message: "This pickup request is not assigned to you" });
    }

    if (order.status !== "pickup_assigned") {
      return res.status(400).json({ message: "Pickup request is not active for this order" });
    }

    order.batchMeta = {
      ...order.batchMeta,
      pickupTaskStatus: "accepted",
      pickupAcceptedAt: new Date()
    };

    pushTimeline(order, "pickup_task_accepted", "Pickup boy accepted the assigned task");
    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate("pickupBoy", "name phone type")
      .populate("assignedFarmer", "name phone city village");

    res.json({
      message: "Pickup task accepted successfully",
      order: updatedOrder
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.receiveBatchAtHub = async (req, res) => {
  try {
    const { batchId } = req.params;
    const orders = await Order.find({ batchId });

    if (!orders.length) {
      return res.status(404).json({ message: "Batch not found" });
    }

    for (const order of orders) {
      order.status = "arrived_at_hub";
      order.orderItems.forEach((item) => {
        if (["accepted", "picked_from_farmer"].includes(item.status)) {
          item.status = "arrived_at_hub";
        }
      });
      pushTimeline(order, "arrived_at_hub", "Reached Hub");
      await order.save();
    }

    await maybeReleasePickupBoy(batchId);

    res.json({
      message: "Batch received at hub",
      batchId,
      orders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAsPackaged = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "arrived_at_hub") {
      return res.status(400).json({ message: "Order has not yet arrived at hub" });
    }

    order.status = "packaged";
    pushTimeline(order, "packaged", "Order sorted, labeled, and packaged at hub");
    await order.save();

    res.json({
      message: "Order marked as packaged",
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.startBatchDelivery = async (req, res) => {
  try {
    const { orderIds, areaLabel, deliveryBoyId } = req.body;

    if (!Array.isArray(orderIds) || !orderIds.length) {
      return res.status(400).json({ message: "Please provide orderIds for the delivery batch" });
    }

    const result = await startBatchDeliveryInternal({ orderIds, areaLabel, deliveryBoyId });
    if (result.error) {
      return res.status(result.error.code).json({ message: result.error.message });
    }

    res.json({
      message: "Delivery batch started",
      deliveryBatchId: result.deliveryBatchId,
      deliveryBoy: result.deliveryBoy,
      orders: result.orders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.confirmDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const deliveryProfile = await resolveDeliveryBoyFromUser(req.user._id, "delivery");
    if (!deliveryProfile) {
      return res.status(404).json({ message: "Delivery profile not found" });
    }

    if (!order.deliveryBoy || order.deliveryBoy.toString() !== deliveryProfile._id.toString()) {
      return res.status(403).json({ message: "This order is not assigned to you" });
    }

    if (order.status !== "out_for_delivery") {
      return res.status(400).json({ message: "Order is not out for delivery" });
    }

    order.status = "delivered";
    order.actualDelivery = new Date();
    pushTimeline(order, "delivered", "Order delivered to customer");
    await order.save();

    await maybeReleaseDeliveryBoy(order.deliveryBatchId, deliveryProfile._id);

    res.json({
      message: "Delivery confirmed",
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.collectAtHub = async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await startBatchDeliveryInternal({
      orderIds: [orderId],
      areaLabel: req.body?.areaLabel,
      deliveryBoyId: req.body?.deliveryBoyId
    });

    if (result.error) {
      return res.status(result.error.code).json({ message: result.error.message });
    }

    res.json({
      message: "Single order moved to delivery flow",
      deliveryBatchId: result.deliveryBatchId,
      deliveryBoy: result.deliveryBoy,
      order: result.orders[0]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.outForDelivery = exports.collectAtHub;
exports.deliverOrder = exports.confirmDelivery;

exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const customerId = req.user._id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.customer.toString() !== customerId.toString()) {
      return res.status(403).json({ message: "Not authorized to cancel this order" });
    }

    if (!["placed", "pending_farmer_acceptance"].includes(order.status)) {
      return res.status(400).json({ message: "Can only cancel fresh orders before pickup assignment" });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        status: "cancelled",
        cancelReason: reason || "Customer requested cancellation",
        cancelledAt: new Date()
      },
      { new: true }
    );

    res.json({
      message: "Order cancelled successfully",
      order: updatedOrder
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFarmerAnalytics = async (req, res) => {
  try {
    const farmerId = req.user._id;
    const orders = await Order.find({
      $or: [{ assignedFarmer: farmerId }, { "orderItems.farmer": farmerId }]
    });

    const acceptedOrders = orders.filter((order) => {
      if (Array.isArray(order.orderItems) && order.orderItems.length > 0) {
        return order.orderItems.some(
          (item) =>
            item?.farmer?.toString() === farmerId.toString() && item.status === "accepted"
        );
      }

      return order.status === "accepted";
    }).length;

    const analytics = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      paidOrders: orders.filter((order) => order.paymentStatus === "paid").length,
      acceptedOrders,
      placedOrders: orders.filter((order) => order.status === "placed").length,
      cancelledOrders: orders.filter((order) => order.status === "cancelled").length,
      averageOrderValue:
        orders.length > 0
          ? (
              orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) / orders.length
            ).toFixed(2)
          : 0
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
