import { useState, useEffect, useRef } from 'react';
import { FaArrowRight } from 'react-icons/fa';
import ImageCarousel from './ImageCarousel';
import ActionButtons from './ActionButtons';
import LikeAnimation from './LikeAnimation';
import { extractImages, getThumbnailImages } from '../lib/wikiapi';
import { isPageLiked, togglePageLike } from '../lib/storage';

// Global cache for images
const imageCache = new Map();

export default function WikiCard({ page, isActive, style, preload = false }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imagesFetched, setImagesFetched] = useState(false);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [liked, setLiked] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const imagesRef = useRef([]);
  const [tapPosition, setTapPosition] = useState({ x: null, y: null });
  
  // Preload images when this card is active OR when it's the next card (preload=true)
  useEffect(() => {
    if (!imagesFetched && (isActive || preload)) {
      loadImages();
    }
  }, [isActive, preload, page, imagesFetched]);
  
  useEffect(() => {
    // Check if this page is liked
    if (page && page.pageid) {
      setLiked(isPageLiked(page.pageid));
    }
  }, [page]);
  
  // Preload actual image files
  useEffect(() => {
    if (images.length > 0) {
      // Start preloading the actual image files
      imagesRef.current = images.map(image => {
        // Use window.Image instead of Image
        const img = new window.Image();
        img.src = image.url;
        return img;
      });
    }
    
    // Cleanup
    return () => {
      imagesRef.current.forEach(img => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [images]);
  

const loadImages = async () => {
  setLoading(true);
  try {
    if (!page || !page.pageid) {
      throw new Error('Invalid page data');
    }
    
    const cacheKey = `images_${page.pageid}`;
    if (imageCache.has(cacheKey)) {
      setImages(imageCache.get(cacheKey));
      setLoading(false);
      setImagesFetched(true);
      return;
    }
    
    // Try fetching images via the API
    let fetchedImages = await extractImages(page.pageid);
    // If no images are returned, fall back to the thumbnail image
    if (!fetchedImages || fetchedImages.length === 0) {
      fetchedImages = getThumbnailImages(page);
    }
    
    const optimizedImages = fetchedImages.slice(0, 3); // Take up to 3 images
    // Store in cache
    imageCache.set(cacheKey, optimizedImages);
    setImages(optimizedImages);
  } catch (error) {
    console.error('Error loading images:', error);
    setImages([]);
  } finally {
    setLoading(false);
    setImagesFetched(true);
  }
};

  
  const handleDoubleTap = (e) => {
    // Prevent the tap from triggering links or buttons
    e.preventDefault();
    e.stopPropagation();
    
    // Only trigger like on double tap if not already liked
    if (page && page.pageid) {
      const newLikedStatus = togglePageLike(page.pageid);
      setLiked(newLikedStatus);
      
      if (newLikedStatus) {
        // Set the tap position for the animation
        setTapPosition({ x: e.clientX, y: e.clientY });
        setShowLikeAnimation(true);
        setTimeout(() => setShowLikeAnimation(false), 1200);
      }
    }
  };
  useEffect(() => {
    const handleLikeStatusChanged = (event) => {
      // Update only if the event is for this page
      if (page && event.detail.pageId === page.pageid) {
        setLiked(isPageLiked(page.pageid));
      }
    };
    
    window.addEventListener("likeStatusChanged", handleLikeStatusChanged);
    return () => {
      window.removeEventListener("likeStatusChanged", handleLikeStatusChanged);
    };
  }, [page]);
  


  
  const handleTap = (e) => {
    // Don't process taps on buttons or links
    if (e.target.tagName.toLowerCase() === 'button' || 
        e.target.tagName.toLowerCase() === 'a' ||
        e.target.closest('button') || 
        e.target.closest('a')) {
      return;
    }
    
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // ms
    
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // Double tap detected
      handleDoubleTap(e);
    }
    
    setLastTap(now);
  };
  
  const wikiLink = `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`;
  
  return (
    <div 
      className={`absolute h-full w-full ${isActive ? 'z-10' : 'z-0'}`}
      style={style}
    >
      <div className="relative h-full w-full" onClick={handleTap}>
        {/* Background images */}
        <ImageCarousel images={images} loading={loading} thumbnailUrl={page.thumbnail?.source} />
        
        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-20 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold mr-2 flex-1">
              <a href={wikiLink} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {page.title}
              </a>
            </h2>
            <ActionButtons 
              pageId={page.pageid} 
              title={page.title} 
              isLiked={liked}
              onLikeChange={setLiked}
            />
          </div>
          
          <p className="text-sm mt-1 max-w-md">
            {page.extract ? `${page.extract.substring(0, 150)}...` : 'No description available'}
          </p>
          
          <a 
            href={wikiLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center mt-2 text-sm text-blue-300 hover:text-blue-200"
          >
            Read more <FaArrowRight className="ml-1" />
          </a>
        </div>
        
        {/* TikTok-style like animation at tap position */}
        {showLikeAnimation && <LikeAnimation x={tapPosition.x} y={tapPosition.y} />}
      </div>
    </div>
  );
}