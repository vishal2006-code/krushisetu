const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
{
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // Legacy single-item order fields kept for backward compatibility with
  // older documents that predate the `orderItems` structure.
  vegetable: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vegetable"
  },

  quantity: {
    type: Number
  },

  assignedFarmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  orderItems: [
    {
      vegetable: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vegetable",
        required: true
      },
      farmer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      quantity: {
        type: Number,
        required: true
      },
      status: {
        type: String,
        enum: ["assigned", "accepted", "sent_to_hub", "collected_at_hub"],
        default: "assigned"
      },
      price: {
        type: Number,
        required: true
      }
    }
  ],

  totalAmount: {
    type: Number,
    required: true
  },

  deliveryCharge: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ["placed", "assigned_to_farmers", "sent_to_hub", "collected_at_hub", "out_for_delivery", "delivered", "cancelled"],
    default: "placed"
  },

  paymentStatus: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending"
  },

  deliveryAddress: {
    type: String,
    required: true
  },

  estimatedDelivery: Date,
  actualDelivery: Date,

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

  notes: String,
  cancelReason: String,
  cancelledAt: Date,
  refundAmount: Number,
  refundStatus: {
    type: String,
    enum: ["pending", "processed"],
    default: "pending"
  }

},
{ timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
