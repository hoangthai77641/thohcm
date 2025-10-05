const StarDisplay = ({ rating, reviewCount, showCount = true }) => {
  const numRating = parseFloat(rating) || 0;
  const fullStars = Math.floor(numRating);
  const hasHalfStar = numRating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="star-display">
      <div className="stars">
        {/* Full stars */}
        {[...Array(fullStars)].map((_, i) => (
          <span key={i} className="star filled">★</span>
        ))}
        
        {/* Half star */}
        {hasHalfStar && (
          <span className="star half">★</span>
        )}
        
        {/* Empty stars */}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={i} className="star empty">☆</span>
        ))}
      </div>
      
      <span className="rating-text">
        {numRating > 0 ? numRating : 'Chưa có đánh giá'}
        {showCount && reviewCount > 0 && (
          <span className="review-count"> ({reviewCount} đánh giá)</span>
        )}
      </span>
    </div>
  );
};

export default StarDisplay;