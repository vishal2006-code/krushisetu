const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
{
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  vegetable: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vegetable",
    required: true
  },

  quantity: {
    type: Number,
    required: true
  },

  assignedFarmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  totalAmount: {
    type: Number
  },

  status: {
    type: String,
    enum: ["placed", "accepted", "delivered", "cancelled"],
    default: "placed"
  },

  paymentStatus: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending"
  },

  cancelReason: String,
  cancellationReason: String,
  cancelledAt: Date,
  refundAmount: Number,
  refundStatus: {
    type: String,
    enum: ["pending", "processed"],
    default: "pending"
  },
  
  trackingTimeline: [
    {
      status: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      notes: String
    }
  ],
  
  estimatedDelivery: Date,
  actualDelivery: Date,
  deliveryAddress: String,
  notes: String

},
{ timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
