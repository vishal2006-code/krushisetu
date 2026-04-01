const Order = require("../models/Order");
const Vegetable = require("../models/Vegetable");
const FarmerProfile = require("../models/FarmerProfile");

// १. नवीन ऑर्डर प्लेस करणे (Customer)
exports.placeOrder = async (req, res) => {
  try {
    const { orderItems, deliveryAddress, notes, location } = req.body;

    // 🔥 CHECKS
    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({ message: "किमान एक भाजी निवडा!" });
    }

    if (!location) {
      return res.status(400).json({
        message: "Customer location required"
      });
    }

    let totalAmount = 0;
    const processedItems = [];

    // 🔥 LOOP THROUGH ITEMS
    for (const item of orderItems) {
      const { vegetableId, quantity } = item;

      // Get vegetable
      const vegetable = await Vegetable.findById(vegetableId);
      if (!vegetable) {
        return res.status(404).json({
          message: `भाजी ${vegetableId} सापडली नाही!`
        });
      }

      const price = Number(vegetable.price) || 0;
      const qty = Number(quantity) || 0;
      const itemTotal = price * qty;
      totalAmount += itemTotal;

      // 🔥🔥 NEAREST FARMER FIND
      const farmerProfile = await FarmerProfile.findOne({
        cropsAvailable: vegetableId,
        location: {
          $near: {
            $geometry: location,
            $maxDistance: 10000 // ✅ 10 km
          }
        }
      });

      if (!farmerProfile) {
        return res.status(404).json({
          message: "या भाजीसाठी 10km मध्ये कोणताही शेतकरी उपलब्ध नाही!"
        });
      }

      const assignedFarmer = farmerProfile.farmer;

      processedItems.push({
        vegetable: vegetableId,
        farmer: assignedFarmer,
        quantity: qty,
        price: price,
        status: "assigned"
      });
    }

    // 🔥 MINIMUM ORDER CHECK
    if (totalAmount < 100) {
      return res.status(400).json({
        message: "किमान ऑर्डर मूल्य ₹100 असावे!"
      });
    }

    // 🔥 DELIVERY CHARGE
    const deliveryCharge = 10;
    totalAmount += deliveryCharge;

    // 🔥 CREATE ORDER
    const order = await Order.create({
      customer: req.user._id,
      orderItems: processedItems,
      totalAmount,
      deliveryCharge,
      deliveryAddress,
      notes,
      status: "placed",
      paymentStatus: "pending",
      trackingTimeline: [
        { status: "placed", notes: "Order placed successfully" }
      ]
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
// २. ग्राहकाच्या ऑर्डर्स पाहणे (Customer Dashboard)
exports.getCustomerOrders = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // ✅ SAFE (NO populate)
    const orders = await Order.find({
      customer: req.user._id
    })
      .populate("customer", "name email phone")
      .populate("vegetable", "name emoji category price")
      .populate("assignedFarmer", "name email phone city village")
      .populate("orderItems.vegetable", "name emoji category price")
      .populate("orderItems.farmer", "name email phone city village")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);

  } catch (error) {
    console.error("🔥 CUSTOMER ERROR:", error);

    res.status(500).json({
      message: error.message
    });
  }
};

// ३. शेतकऱ्याला आलेल्या ऑर्डर्स पाहणे (Farmer Dashboard)
exports.getFarmerOrders = async (req, res) => {
  try {
    console.log("🔥 API HIT /api/orders/farmer");

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const farmerId = req.user._id;

    // ✅ SAFE QUERY (NO populate)
    const orders = await Order.find({
      $or: [
        { assignedFarmer: farmerId },
        { "orderItems.farmer": farmerId }
      ]
    })
      .populate("customer", "name email phone city village")
      .populate("vegetable", "name emoji category price")
      .populate("assignedFarmer", "name email phone city village")
      .populate("orderItems.vegetable", "name emoji category price")
      .populate("orderItems.farmer", "name email phone city village")
      .sort({ createdAt: -1 });

    console.log("✅ Orders fetched:", orders.length);

    res.status(200).json(orders);

  } catch (error) {
    console.error("🔥 FINAL ERROR:", error);

    res.status(500).json({
      message: error.message
    });
  }
};
// ४. ऑर्डर आयटम स्टेटस अपडेट करणे (Farmer Action)
exports.updateOrderItemStatus = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "ऑर्डर सापडली नाही!" });

    const item = order.orderItems.id(itemId);
    if (!item) return res.status(404).json({ message: "आयटम सापडला नाही!" });

    // Check if farmer is assigned to this item
    if (item.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "या आयटमला तुम्ही नियुक्त नाही!" });
    }

    item.status = status;
    order.trackingTimeline.push({ status: `item_${status}`, notes: `Item ${itemId} status updated to ${status}` });

    // Update overall order status based on items
    const allItemsStatus = order.orderItems.map(i => i.status);
    if (allItemsStatus.every(s => s === "sent_to_hub")) {
      order.status = "sent_to_hub";
      order.trackingTimeline.push({ status: "sent_to_hub", notes: "All items sent to hub" });
    } else if (allItemsStatus.some(s => s === "accepted")) {
      order.status = "assigned_to_farmers";
    }

    await order.save();

    res.status(200).json({ message: "स्टेटस अपडेट झाले! ✅", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ५. पेमेंट पूर्ण करणे (Customer Action)
exports.makePayment = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findByIdAndUpdate(
      orderId, 
      { paymentStatus: "paid" }, 
      { new: true }
    );

    if (!order) return res.status(404).json({ message: "ऑर्डर सापडली नाही!" });
    res.status(200).json({ message: "पेमेंट यशस्वी! 💳", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ६. हबमध्ये ऑर्डर कलेक्ट करणे (Hub Operation)
exports.collectAtHub = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "ऑर्डर सापडली नाही!" });

    if (order.status !== "sent_to_hub") {
      return res.status(400).json({ message: "ऑर्डर हबमध्ये पाठवलेली नाही!" });
    }

    order.status = "collected_at_hub";
    order.trackingTimeline.push({ status: "collected_at_hub", notes: "Order collected at hub" });
    await order.save();

    res.status(200).json({ message: "हबमध्ये कलेक्ट झाले! ✅", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ७. डिलिव्हरीसाठी पाठवणे (Delivery Operation)
exports.outForDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "ऑर्डर सापडली नाही!" });

    if (order.status !== "collected_at_hub") {
      return res.status(400).json({ message: "ऑर्डर हबमध्ये कलेक्ट झालेली नाही!" });
    }

    order.status = "out_for_delivery";
    order.trackingTimeline.push({ status: "out_for_delivery", notes: "Order out for delivery" });
    await order.save();

    res.status(200).json({ message: "डिलिव्हरीसाठी पाठवले! 🚚", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ८. ऑर्डर डिलिव्हर करणे (Delivery Operation)
exports.deliverOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "ऑर्डर सापडली नाही!" });

    if (order.status !== "out_for_delivery") {
      return res.status(400).json({ message: "ऑर्डर डिलिव्हरीसाठी नाही!" });
    }

    order.status = "delivered";
    order.actualDelivery = new Date();
    order.trackingTimeline.push({ status: "delivered", notes: "Order delivered successfully" });
    await order.save();

    res.status(200).json({ message: "ऑर्डर डिलिव्हर झाली! 🎉", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel order (Customer can cancel only 'placed' orders)
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

    if (order.status !== "placed") {
      return res.status(400).json({ message: "Can only cancel orders in 'placed' status" });
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
      message: "Order cancelled successfully ❌",
      order: updatedOrder
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get order analytics for farmer
exports.getFarmerAnalytics = async (req, res) => {
  try {
    const farmerId = req.user._id;

    const orders = await Order.find({
      $or: [
        { assignedFarmer: farmerId },
        { "orderItems.farmer": farmerId }
      ]
    });

    const acceptedOrders = orders.filter((order) => {
      if (Array.isArray(order.orderItems) && order.orderItems.length > 0) {
        return order.orderItems.some((item) =>
          item?.farmer?.toString() === farmerId.toString() && item.status === "accepted"
        );
      }

      return order.status === "accepted";
    }).length;

    const analytics = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      paidOrders: orders.filter(o => o.paymentStatus === "paid").length,
      acceptedOrders,
      placedOrders: orders.filter(o => o.status === "placed").length,
      cancelledOrders: orders.filter(o => o.status === "cancelled").length,
      averageOrderValue: orders.length > 0 
        ? (orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) / orders.length).toFixed(2)
        : 0
    };

    res.json(analytics);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
