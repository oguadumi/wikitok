import { useState, useEffect, useCallback, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import WikiCard from './WikiCard';
import LoadingSpinner from './LoadingSpinner';
import { fetchRandomWikiPages } from '../lib/wikiapi';

export default function WikiBrowser() {
  const [wikiPages, setWikiPages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('en');
  const [swipePosition, setSwipePosition] = useState(0);
  const swipingRef = useRef(false);
  const startTouchRef = useRef(0);
  
  // Listen for language changes from the Layout component
  useEffect(() => {
    const handleLanguageChange = (event) => {
      if (event.detail && event.detail.language) {
        setLanguage(event.detail.language);
        // Reset and load new pages in the selected language
        setWikiPages([]);
        setCurrentIndex(0);
        loadWikiPages(event.detail.language);
      }
    };
    
    window.addEventListener('languageChange', handleLanguageChange);
    return () => window.removeEventListener('languageChange', handleLanguageChange);
  }, []);
  
  // Load initial pages on component mount
  useEffect(() => {
    initialLoadWikiPages();
  }, []);
  
  // Add a second effect to load more pages when we're getting low
  useEffect(() => {
    // If we're within 2 pages of the end, load more
    if (wikiPages.length > 0 && currentIndex >= wikiPages.length - 2) {
      loadWikiPages(language);
    }
  }, [currentIndex, wikiPages.length, language]);
  
  const initialLoadWikiPages = async (lang = language) => {
    try {
      setLoading(true);
      const pages = await fetchRandomWikiPages(5, lang);
      if (pages && pages.length > 0) {
        setWikiPages(pages);
      }
    } catch (error) {
      console.error('Error loading initial wiki pages:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadWikiPages = async (lang = language) => {
    if (loading) return; // Prevent multiple simultaneous loads
    
    setLoading(true);
    try {
      const pages = await fetchRandomWikiPages(5, lang);
      setWikiPages(prevPages => [...prevPages, ...pages]);
    } catch (error) {
      console.error('Error loading wiki pages:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Track touch position manually to ensure correct direction
  const handleTouchStart = (e) => {
    startTouchRef.current = e.touches[0].clientY;
  };
  
  const handleTouchMove = (e) => {
    if (!swipingRef.current) swipingRef.current = true;
    
    const touchY = e.touches[0].clientY;
    const deltaY = startTouchRef.current - touchY; // Positive when swiping UP
    
    // Convert to percentage of screen height (positive = swiping up)
    const movePercent = (deltaY / window.innerHeight) * 100;
    setSwipePosition(movePercent);
  };
  
  const handleTouchEnd = () => {
    const threshold = 15;
    
    if (Math.abs(swipePosition) > threshold) {
      if (swipePosition > 0) {
        // Swiped UP = next card
        if (currentIndex < wikiPages.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          // Load more at the end
          loadWikiPages();
        }
      } else {
        // Swiped DOWN = previous card
        if (currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
        }
      }
    }
    
    // Reset position
    setSwipePosition(0);
    setTimeout(() => {
      swipingRef.current = false;
    }, 400);
  };

  return (
    <div className="h-screen w-screen bg-black overflow-hidden">
      <div 
        className="relative h-full w-full touch-none" 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {loading && wikiPages.length === 0 ? (
          <LoadingSpinner />
        ) : (
          wikiPages.map((page, index) => {
            // Calculate position - positive swipePosition = swiping up
            const position = (index - currentIndex) * 100 - swipePosition;
            
            return (
              <WikiCard 
                key={page.pageid} 
                page={page} 
                isActive={index === currentIndex}
                preload={index >= currentIndex - 1 && index <= currentIndex + 2}
                style={{
                  transform: `translateY(${position}vh)`,
                  transition: swipingRef.current 
                    ? 'none' // No transition during active swipe for responsive feel
                    : 'transform 0.4s cubic-bezier(0.19, 1, 0.22, 1)',
                  opacity: position > -120 && position < 120 ? 1 : 0,
                }}
              />
            );
          })
        )}
        
        {/* Loading indicator for when more content is being fetched */}
        {loading && wikiPages.length > 0 && (
          <div className="absolute bottom-4 right-4 z-40">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
          </div>
        )}
      </div>
    </div>
  );
} 