const Review = require("../models/Review");
const Order = require("../models/Order");
const User = require("../models/User");

// Add review to farmer/vegetable
exports.createReview = async (req, res) => {
  try {
    const { orderId, rating, title, comment, category } = req.body;
    const reviewerId = req.user._id;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // Check if order exists and belongs to user
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.customer.toString() !== reviewerId.toString()) {
      return res.status(403).json({ message: "Not authorized to review this order" });
    }

    // Check if order is completed/delivered
    if (order.status !== "accepted" && order.status !== "delivered") {
      return res.status(400).json({ message: "Can only review completed orders" });
    }

    // Create review
    const review = await Review.create({
      order: orderId,
      reviewer: reviewerId,
      reviewee: order.assignedFarmer,
      rating,
      title,
      comment,
      category: category || "quality"
    });

    // Update farmer's average rating
    const farmerReviews = await Review.find({ reviewee: order.assignedFarmer });
    const avgRating = farmerReviews.reduce((sum, r) => sum + r.rating, 0) / farmerReviews.length;
    
    await User.findByIdAndUpdate(order.assignedFarmer, {
      averageRating: avgRating,
      totalReviews: farmerReviews.length
    });

    res.status(201).json({
      message: "Review added successfully ⭐",
      review
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get reviews for a farmer
exports.getFarmerReviews = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const { limit = 10, page = 1 } = req.query;

    const reviews = await Review.find({ reviewee: farmerId })
      .populate("reviewer", "name email")
      .populate("order", "createdAt vegetable quantity")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalCount = await Review.countDocuments({ reviewee: farmerId });

    res.json({
      reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalReviews: totalCount
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get farmer statistics
exports.getFarmerStats = async (req, res) => {
  try {
    const farmerId = req.user._id;

    const reviews = await Review.find({ reviewee: farmerId });
    const avgRating = reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2)
      : 0;

    const categoryBreakdown = {
      quality: reviews.filter(r => r.category === "quality").length,
      delivery: reviews.filter(r => r.category === "delivery").length,
      farmer: reviews.filter(r => r.category === "farmer").length,
      vegetable: reviews.filter(r => r.category === "vegetable").length
    };

    const ratingDistribution = {
      five: reviews.filter(r => r.rating === 5).length,
      four: reviews.filter(r => r.rating === 4).length,
      three: reviews.filter(r => r.rating === 3).length,
      two: reviews.filter(r => r.rating === 2).length,
      one: reviews.filter(r => r.rating === 1).length
    };

    res.json({
      averageRating: avgRating,
      totalReviews: reviews.length,
      categoryBreakdown,
      ratingDistribution
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete review (only own reviews)
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.reviewer.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this review" });
    }

    await Review.findByIdAndDelete(reviewId);

    res.json({ message: "Review deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
