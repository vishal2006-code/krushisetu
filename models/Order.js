const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
{
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // 🔹 Legacy fields (keep for compatibility)
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

  // 🔥 Multi-item order
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
        enum: [
          "assigned",
          "accepted",
          "picked_from_farmer",
          "arrived_at_hub"
        ],
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

  // 🔥 MAIN DELIVERY STATUS (UPDATED)
  status: {
    type: String,
    enum: [
      "placed",
      "pending_farmer_acceptance",
      "accepted_by_farmer",
      "pickup_assigned",
      "picked_from_farmer",
      "arrived_at_hub",
      "packaged",
      "delivery_assigned",
      "out_for_delivery",
      "delivered",
      "cancelled"
    ],
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

  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number]
    }
  },

  // 🔥 DELIVERY SYSTEM FIELDS
  hub: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hub"
  },

  pickupBoy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DeliveryBoy"
  },

  batchId: {
    type: String,
    index: true
  },

  deliveryBatchId: {
    type: String,
    index: true
  },

  batchMeta: {
    groupedPickup: {
      type: Boolean,
      default: false
    },
    pickupTaskStatus: {
      type: String,
      enum: ["not_sent", "requested", "accepted"],
      default: "not_sent"
    },
    pickupAcceptedAt: Date,
    totalBatchQuantity: {
      type: Number,
      default: 0
    },
    farmerHandoverQuantity: {
      type: Number,
      default: 0
    },
    nearbyPickupNote: {
      type: String,
      default: ""
    },
    deliveryAreaLabel: {
      type: String,
      default: ""
    }
  },

  deliveryBoy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DeliveryBoy"
  },

  estimatedDelivery: Date,
  actualDelivery: Date,

  // 📊 Tracking system
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

  rating: {
    type: Number,
    min: 1,
    max: 5
  },

  review: {
    type: String,
    trim: true,
    maxlength: 500
  },

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
