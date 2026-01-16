import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Star, ThumbsUp, Camera, X } from 'lucide-react';

const ProductReviews = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [ratingDistribution, setRatingDistribution] = useState({});
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('helpful');

  useEffect(() => {
    fetchReviews();
  }, [productId, filter, sortBy]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        sortBy,
        ...(filter && { rating: filter })
      });
      const response = await api.get(`/ecommerce/products/${productId}/reviews?${params}`);
      setReviews(response.data.data);
      setRatingDistribution(response.data.ratingDistribution);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalReviews = Object.values(ratingDistribution).reduce((sum, count) => sum + count, 0);
  const averageRating = totalReviews > 0
    ? Object.entries(ratingDistribution).reduce((sum, [rating, count]) => sum + (rating * count), 0) / totalReviews
    : 0;

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
        <button
          onClick={() => setShowReviewForm(true)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Write a Review
        </button>
      </div>

      {/* Rating Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pb-8 border-b">
        <div className="text-center">
          <div className="text-5xl font-bold text-gray-900 mb-2">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-6 h-6 ${
                  star <= averageRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="text-gray-600">{totalReviews} ratings</p>
        </div>

        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = ratingDistribution[rating] || 0;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <button
                key={rating}
                onClick={() => setFilter(filter === rating.toString() ? '' : rating.toString())}
                className={`w-full flex items-center gap-3 hover:bg-gray-50 p-2 rounded ${
                  filter === rating.toString() ? 'bg-blue-50' : ''
                }`}
              >
                <span className="text-sm font-medium w-8">{rating} ★</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-sm font-medium text-gray-700">Sort by:</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="helpful">Most Helpful</option>
          <option value="recent">Most Recent</option>
          <option value="rating-high">Highest Rating</option>
          <option value="rating-low">Lowest Rating</option>
        </select>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <ReviewCard key={review._id} review={review} onUpdate={fetchReviews} />
          ))}
        </div>
      )}

      {/* Review Form Modal */}
      {showReviewForm && (
        <ReviewForm
          productId={productId}
          onClose={() => setShowReviewForm(false)}
          onSubmit={() => {
            setShowReviewForm(false);
            fetchReviews();
          }}
        />
      )}
    </div>
  );
};

// Review Card Component
const ReviewCard = ({ review, onUpdate }) => {
  const [showFullComment, setShowFullComment] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleMarkHelpful = async () => {
    try {
      await api.post(`/ecommerce/reviews/${review._id}/helpful`);
      onUpdate();
    } catch (error) {
      console.error('Error marking helpful:', error);
    }
  };

  return (
    <div className="border-b border-gray-200 pb-6">
      <div className="flex items-start gap-4">
        <img
          src={review.user?.profileImage || '/default-avatar.png'}
          alt={review.user?.name}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-gray-900">{review.user?.name}</span>
            {review.isVerifiedPurchase && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                Verified Purchase
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">
              {new Date(review.createdAt).toLocaleDateString()}
            </span>
          </div>

          <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
          
          <p className="text-gray-700 mb-3">
            {showFullComment || review.comment.length <= 200
              ? review.comment
              : `${review.comment.substring(0, 200)}...`}
            {review.comment.length > 200 && (
              <button
                onClick={() => setShowFullComment(!showFullComment)}
                className="text-blue-600 hover:text-blue-700 ml-2"
              >
                {showFullComment ? 'Show less' : 'Read more'}
              </button>
            )}
          </p>

          {/* Review Images */}
          {review.images && review.images.length > 0 && (
            <div className="flex gap-2 mb-3">
              {review.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(image.url)}
                  className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500"
                >
                  <img
                    src={image.url}
                    alt={`Review ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          <button
            onClick={handleMarkHelpful}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
          >
            <ThumbsUp className="w-4 h-4" />
            Helpful ({review.helpfulCount})
          </button>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Review"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
};

// Review Form Component
const ReviewForm = ({ productId, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }
    setImages([...images, ...files]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('productId', productId);
      formData.append('rating', rating);
      formData.append('title', title);
      formData.append('comment', comment);
      
      images.forEach(image => {
        formData.append('images', image);
      });

      await api.post('/ecommerce/reviews', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('Review submitted successfully!');
      onSubmit();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Write a Review</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Summarize your experience"
              required
              maxLength={200}
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review <span className="text-red-500">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Share your experience with this product"
              required
              maxLength={2000}
            />
            <p className="text-sm text-gray-500 mt-1">{comment.length}/2000 characters</p>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Photos (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <input
                type="file"
                id="review-images"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                disabled={images.length >= 5}
              />
              <label htmlFor="review-images" className="cursor-pointer">
                <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Upload up to 5 photos ({images.length}/5)
                </p>
              </label>
            </div>

            {images.length > 0 && (
              <div className="flex gap-2 mt-3">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {uploading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductReviews;
