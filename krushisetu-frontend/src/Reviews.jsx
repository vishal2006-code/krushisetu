import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useAuth } from "./context/useAuth";

import { API_URL } from "./lib/api";

function Reviews({ farmerId, onReviewAdded }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [formData, setFormData] = useState({
    orderId: "",
    rating: 5,
    title: "",
    comment: "",
    category: "quality"
  });
  const { token, user } = useAuth();
  const params = useParams();
  const targetFarmerId = farmerId || params.farmerId;

  const fetchReviews = useCallback(async () => {
    if (!targetFarmerId) {
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/reviews/farmer/${targetFarmerId}`);
      setReviews(res.data.reviews || []);
    } catch {
      console.log("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [targetFarmerId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/reviews`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormData({
        orderId: "",
        rating: 5,
        title: "",
        comment: "",
        category: "quality"
      });
      setShowReviewForm(false);
      fetchReviews();
      onReviewAdded?.();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit review");
    }
  };

  const renderStars = (rating) => {
    return "*".repeat(rating) + "-".repeat(5 - rating);
  };

  if (loading) {
    return <div className="text-center py-8">Loading reviews...</div>;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 my-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Reviews and Ratings</h2>
        {user?.role === "customer" && (
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition"
          >
            {showReviewForm ? "Cancel" : "Write Review"}
          </button>
        )}
      </div>

      {showReviewForm && (
        <form onSubmit={handleSubmitReview} className="bg-gray-50 p-6 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Order ID *</label>
              <input
                type="text"
                required
                value={formData.orderId}
                onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                placeholder="Enter order ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Rating *</label>
              <select
                required
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {[1, 2, 3, 4, 5].map((r) => (
                  <option key={r} value={r}>{r} Stars</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief review title"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Comment *</label>
            <textarea
              required
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              placeholder="Share your experience..."
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition"
          >
            Submit Review
          </button>
        </form>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl font-bold text-gray-800">{review.title}</span>
                    <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
                      {review.category}
                    </span>
                  </div>
                  <p className="text-gray-600">by {review.reviewer?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl">{renderStars(review.rating)}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="text-gray-700 mb-3">{review.comment}</p>
              {review.isVerified && (
                <p className="text-sm text-green-600 font-semibold">Verified Purchase</p>
              )}
            </div>
          ))}
        </div>
      )}

      {reviews.length > 0 && (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-6 rounded-lg">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
            </p>
            <p className="text-gray-600">Average Rating</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{reviews.length}</p>
            <p className="text-gray-600">Total Reviews</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-600">
              {reviews.filter((r) => r.rating >= 4).length}
            </p>
            <p className="text-gray-600">Positive Reviews</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">
              {reviews.filter((r) => r.helpful > 0).length}
            </p>
            <p className="text-gray-600">Helpful Reviews</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reviews;
