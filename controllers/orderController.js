const Order = require("../models/Order");
const Vegetable = require("../models/Vegetable");
const FarmerProfile = require("../models/FarmerProfile");

// १. नवीन ऑर्डर प्लेस करणे (Customer)
exports.placeOrder = async (req, res) => {
  try {
    const { vegetableId, quantity } = req.body;

    const vegetable = await Vegetable.findById(vegetableId);
    if (!vegetable) return res.status(404).json({ message: "भाजी सापडली नाही!" });

    // किंमत आणि प्रमाण Number असल्याची खात्री (NaN फिक्स)
    const price = Number(vegetable.price) || 0;
    const qty = Number(quantity) || 0;
    const totalAmount = price * qty;

    // जवळचा शेतकरी शोधणे
    const farmerProfile = await FarmerProfile.findOne({ cropsAvailable: vegetableId });
    const assignedFarmer = farmerProfile ? farmerProfile.farmer : null;

    const order = await Order.create({
      customer: req.user._id,
      vegetable: vegetableId,
      quantity: qty,
      totalAmount,
      assignedFarmer,
      status: "placed",
      paymentStatus: "pending"
    });

    res.status(201).json({ message: "ऑर्डर यशस्वी! 🚜", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// २. ग्राहकाच्या ऑर्डर्स पाहणे (Customer Dashboard)
exports.getCustomerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate("vegetable", "name price emoji category")
      .populate("assignedFarmer", "name phone email city")
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ३. शेतकऱ्याला आलेल्या ऑर्डर्स पाहणे (Farmer Dashboard)
exports.getFarmerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ assignedFarmer: req.user._id })
      .populate("customer", "name email phone city")
      .populate("vegetable", "name price emoji category")
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ४. ऑर्डर स्टेटस अपडेट करणे (Farmer Action)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      orderId, 
      { status }, 
      { new: true }
    );

    if (!order) return res.status(404).json({ message: "ऑर्डर सापडली नाही!" });
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

    const orders = await Order.find({ assignedFarmer: farmerId });

    const analytics = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      paidOrders: orders.filter(o => o.paymentStatus === "paid").length,
      acceptedOrders: orders.filter(o => o.status === "accepted").length,
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