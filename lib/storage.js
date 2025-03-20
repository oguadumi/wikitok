// Local storage helpers for WikiTok

// Key for storing likes in localStorage
const LIKES_STORAGE_KEY = 'wikitok_liked_pages';

/**
 * Get all liked page IDs from local storage
 * @returns {Array} Array of page IDs
 */
export function getAllLikes() {
  if (typeof window === 'undefined') return [];
  
  try {
    const likes = localStorage.getItem('wikiTokLikes') || '[]';
    return JSON.parse(likes);
  } catch (error) {
    console.error('Error retrieving likes from local storage:', error);
    return [];
  }
}

/**
 * Check if a page is liked
 * @param {number} pageId - The Wikipedia page ID to check
 * @returns {boolean} True if the page is liked
 */
export function isPageLiked(pageId) {
  if (typeof window === 'undefined') return false;
  
  const likes = getAllLikes();
  return likes.includes(pageId.toString());
}

/**
 * Toggle like status for a page
 * @param {number} pageId - The Wikipedia page ID to toggle
 * @returns {boolean} The new like status
 */
export function togglePageLike(pageId) {
  if (typeof window === 'undefined') return false;
  
  const likes = getAllLikes();
  const pageIdStr = pageId.toString();
  
  const isLiked = likes.includes(pageIdStr);
  
  let newLikes;
  if (isLiked) {
    // Remove from likes
    newLikes = likes.filter(id => id !== pageIdStr);
  } else {
    // Add to likes
    newLikes = [...likes, pageIdStr];
  }
  
  localStorage.setItem('wikiTokLikes', JSON.stringify(newLikes));
  
  // Dispatch event to notify components
  const event = new CustomEvent('likeStatusChanged', { 
    detail: { pageId, liked: !isLiked } 
  });
  window.dispatchEvent(event);
  
  return !isLiked;
}

/**
 * Remove a page from likes
 * @param {number} pageId - The Wikipedia page ID to remove
 */
export function removeLike(pageId) {
  if (typeof window === 'undefined') return;
  
  const likes = getAllLikes();
  const pageIdStr = pageId.toString();
  
  const newLikes = likes.filter(id => id !== pageIdStr);
  localStorage.setItem('wikiTokLikes', JSON.stringify(newLikes));
  
  // Dispatch event to notify components
  const event = new CustomEvent('likeStatusChanged', { 
    detail: { pageId, liked: false } 
  });
  window.dispatchEvent(event);
}

/**
 * Get all liked pages data
 * This could be used for a "Liked Pages" section
 * @returns {Array} Array of liked page IDs
 */
// export function getAllLikes() {
//   return getAllLikes();
// }

/**
 * Clear all likes
 * Utility function for resetting user preferences
 */
export function clearAllLikes() {
  if (typeof window === 'undefined') return; // Server-side rendering check
  
  try {
    localStorage.removeItem(LIKES_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing likes:', error);
  }
}
