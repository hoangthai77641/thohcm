import React, { useState, useEffect } from 'react';
import api from '../api';

const StarRating = ({ rating, onRatingChange, readOnly = false }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${
            star <= (hoverRating || rating) ? 'filled' : 'empty'
          } ${!readOnly ? 'interactive' : ''}`}
          onClick={() => !readOnly && onRatingChange(star)}
          onMouseEnter={() => !readOnly && setHoverRating(star)}
          onMouseLeave={() => !readOnly && setHoverRating(0)}
        >
          ★
        </span>
      ))}
    </div>
  );
};

const ReviewForm = ({ serviceId, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      alert('Vui lòng chọn số sao đánh giá');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Submitting review:', { serviceId, rating, comment });
      const response = await api.post(`/api/reviews/${serviceId}`, { rating, comment });
      console.log('Review submitted successfully:', response.data);
      setRating(0);
      setComment('');
      onReviewSubmitted();
      alert('Đánh giá của bạn đã được gửi thành công!');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="review-form">
      <h3>Đánh giá dịch vụ</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Đánh giá:</label>
          <StarRating rating={rating} onRatingChange={setRating} />
        </div>
        
        <div className="form-group">
          <label htmlFor="comment">Nhận xét:</label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ này..."
            rows="4"
          />
        </div>
        
        <button type="submit" disabled={isSubmitting || !rating}>
          {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
        </button>
      </form>
    </div>
  );
};

const ReviewList = ({ reviews }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="review-list">
      <h3>Đánh giá từ khách hàng ({reviews.length})</h3>
      {reviews.length === 0 ? (
        <p className="no-reviews">Chưa có đánh giá nào cho dịch vụ này.</p>
      ) : (
        reviews.map((review) => (
          <div key={review._id} className="review-item">
            <div className="review-header">
              <span className="reviewer-name">{review.customer?.name || 'Khách hàng'}</span>
              <StarRating rating={review.rating} readOnly />
              <span className="review-date">{formatDate(review.createdAt)}</span>
            </div>
            {review.comment && (
              <p className="review-comment">{review.comment}</p>
            )}
          </div>
        ))
      )}
    </div>
  );
};

const ReviewSection = ({ serviceId, user }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      console.log('Fetching reviews for serviceId:', serviceId);
      const response = await api.get(`/api/reviews/service/${serviceId}`);
      console.log('Reviews response:', response.data);
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [serviceId]);

  const handleReviewSubmitted = () => {
    fetchReviews();
  };

  if (loading) {
    return <div className="loading">Đang tải đánh giá...</div>;
  }

  return (
    <div className="review-section">
      <ReviewList reviews={reviews} />
      
      {user && user.role === 'customer' && (
        <ReviewForm 
          serviceId={serviceId} 
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
      
      {!user && (
        <div className="login-prompt">
          <p>Vui lòng <a href="/login">đăng nhập</a> để đánh giá dịch vụ này.</p>
        </div>
      )}
    </div>
  );
};

export default ReviewSection;