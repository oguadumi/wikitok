import { useState, useEffect, useCallback, useRef } from 'react';
import WikiCard from '../components/WikiCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchRandomWikiPages } from '../lib/wikiapi';

export default function Home() {
  const [wikiPages, setWikiPages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const [loadError, setLoadError] = useState(null);
  
  // Mouse/touch dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  
  // Preload status tracking
  const preloadedPages = useRef(new Set());
  
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
  
  // Load more pages when we're getting low
  useEffect(() => {
    // If we're getting close to the end of our loaded pages, fetch more
    if (wikiPages.length - currentIndex < 3 && !loading) {
      loadWikiPages();
    }
  }, [currentIndex, wikiPages.length]);
  
  // Fetch wiki pages with better error handling
  const loadWikiPages = useCallback(async () => {
    if (loading) return;
  
    setLoading(true);
    setLoadError(null);
  
    try {
      // Fetch more pages than we need in case some don't have images
      const newPages = await fetchRandomWikiPages(language, 5);
  
      // Filter pages to include only those with a valid thumbnail image
      const pagesWithImages = newPages.filter(
        (page) => page.thumbnail && page.thumbnail.source
      );
  
      if (pagesWithImages.length === 0) {
        throw new Error("Failed to load new pages with images");
      }
  
      setWikiPages((currentPages) => [...currentPages, ...pagesWithImages]);
    } catch (error) {
      console.error("Error loading wiki pages:", error);
      setLoadError(error.message);
  
      // Try again after a delay
      setTimeout(() => {
        setLoading(false);
        loadWikiPages();
      }, 3000);
    } finally {
      setLoading(false);
    }
  }, [loading, language]);
  
  
  // Initial load
  useEffect(() => {
    if (wikiPages.length === 0) {
      loadWikiPages();
    }
  }, [loadWikiPages, wikiPages.length]);
  
  // Handle touch events
  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
  };
  
  const handleTouchMove = (e) => {
    if (!isDragging) return;
    
    const deltaY = startY - e.touches[0].clientY;
    const newOffset = (deltaY / window.innerHeight) * 100;
    setDragOffset(newOffset);
  };
  
  // Handle mouse events for the container
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setStartY(e.clientY);
  };
  
  // Complete a swipe/drag action
  const finishSwipe = () => {
    if (!isDragging) return;
    
    // Determine if we should change pages
    const threshold = 15;
    
    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0) {
        // Swiped UP, go to NEXT page
        if (currentIndex < wikiPages.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          // At the end, load more
          loadWikiPages();
        }
      } else {
        // Swiped DOWN, go to PREVIOUS page
        if (currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
        }
      }
    }
    
    // Reset drag state
    setDragOffset(0);
    setIsDragging(false);
  };
  
  // Add global mouse event listeners
  useEffect(() => {
    // Handle mouse move anywhere on screen while dragging
    const handleGlobalMouseMove = (e) => {
      if (isDragging) {
        const deltaY = startY - e.clientY;
        const newOffset = (deltaY / window.innerHeight) * 100;
        setDragOffset(newOffset);
      }
    };
    
    // Handle mouse up anywhere on screen
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        finishSwipe();
      }
    };
    
    // Add the event listeners
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    
    // Clean up
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, startY, finishSwipe]);
  
  return (
    <div className="h-screen w-screen bg-black overflow-hidden">
      <div 
        className="relative h-full w-full cursor-grab active:cursor-grabbing select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={finishSwipe}
        onMouseDown={handleMouseDown}
      >
        {wikiPages.length === 0 ? (
          <LoadingSpinner />
        ) : (
          wikiPages.map((page, index) => {
            // Position of this card (100vh = full screen height)
            const position = (index - currentIndex) * 100 - dragOffset;
            
            // Determine if this card should be visible and preloaded
            const isVisible = Math.abs(position) < 200;
            const shouldPreload = Math.abs(index - currentIndex) <= 3;
            
            // Track which pages have been preloaded
            if (shouldPreload && !preloadedPages.current.has(page.pageid)) {
              preloadedPages.current.add(page.pageid);
            }
            
            // Only render visible cards
            return isVisible ? (
              <WikiCard 
                key={page.pageid} 
                page={page} 
                isActive={index === currentIndex && !isDragging}
                preload={shouldPreload}
                style={{
                  transform: `translateY(${position}vh)`,
                  transition: isDragging ? 'none' : 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
                  zIndex: 100 - Math.abs(index - currentIndex),
                }}
              />
            ) : null;
          })
        )}
        
        {/* Loading indicator for when more content is being fetched */}
        {loading && wikiPages.length > 0 && (
          <div className="absolute bottom-4 right-4 z-40">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
          </div>
        )}
        
        {/* Error message */}
        {loadError && (
          <div className="absolute bottom-4 left-4 right-4 bg-red-500 text-white p-2 rounded-lg z-50 text-center">
            Error: {loadError}. Retrying...
          </div>
        )}
      </div>
    </div>
  );
}