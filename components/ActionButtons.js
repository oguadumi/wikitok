import { useState, useEffect } from 'react';
import { FaHeart, FaRegHeart, FaShare } from 'react-icons/fa';
import { isPageLiked, togglePageLike } from '../lib/storage';

export default function ActionButtons({ pageId, title, isLiked, onLikeChange }) {
  // Use the prop value if provided, otherwise manage state locally
  const [liked, setLiked] = useState(isLiked || false);
  const [showAnimation, setShowAnimation] = useState(false);
  // New state for showing the "Link Copied" popup
  const [showCopied, setShowCopied] = useState(false);

  // Update local state when prop changes
  useEffect(() => {
    if (isLiked !== undefined) {
      setLiked(isLiked);
    }
  }, [isLiked]);
  
  // If not using props, load from localStorage
  useEffect(() => {
    if (isLiked === undefined) {
      setLiked(isPageLiked(pageId));
    }
  }, [pageId, isLiked]);
  
  const handleLike = (e) => {
    // Prevent event propagation
    e.stopPropagation();
    
    // Toggle like in localStorage and update state
    const newLikedStatus = togglePageLike(pageId);
    setLiked(newLikedStatus);
    
    // Notify parent if callback provided
    if (onLikeChange) {
      onLikeChange(newLikedStatus);
    }
    
    // Only show animation when liking, not when unliking
    if (newLikedStatus) {
      setShowAnimation(true);
      // Hide animation after it completes
      setTimeout(() => setShowAnimation(false), 1200);
    }
  };
  
  const handleShare = async (e) => {
    // Prevent event propagation
    e.stopPropagation();
    let shareSuccess = false;
    
    try {
      const shareUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;
      if (navigator.share) {
        await navigator.share({
          title: `Check out this WikiTok about ${title}!`,
          text: `Learn about ${title} on WikiTok`,
          url: shareUrl,
        });
        shareSuccess = true;
      } else {
        // Fallback for browsers that don't support the Web Share API:
        await navigator.clipboard.writeText(shareUrl);
        shareSuccess = true;
      }
    } catch (error) {
      console.error('Error sharing content:', error);
    }
    
    if (shareSuccess) {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };
  
  return (
    <div className="flex items-center space-x-3">
      <button 
        onClick={handleLike}
        className="bg-transparent p-1 rounded-full"
      >
        {liked ? (
          <FaHeart className="text-red-500 text-xl" />
        ) : (
          <FaRegHeart className="text-white text-xl" />
        )}
      </button>
      
      {/* Wrap the share button in a relative container */}
      <div className="relative">
        <button 
          onClick={handleShare}
          className="bg-transparent p-1 rounded-full"
        >
          <FaShare className="text-white text-xl" />
        </button>
        {/* Popup message above the share button */}
        {showCopied && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow">
            Link Copied
          </div>
        )}
      </div>
    </div>
  );
}
