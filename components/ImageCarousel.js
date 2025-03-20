import { useState, useEffect } from 'react';

export default function ImageCarousel({ images, loading }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState([]);

  // Preload images
  useEffect(() => {
    if (!images || images.length === 0) return;

    setImagesLoaded(new Array(images.length).fill(false));

    const imageObjects = images.map((item, index) => {
      const src = typeof item === 'object' && item.url ? item.url : item;
      const img = new Image();

      img.onload = () => {
        setImagesLoaded(prev => {
          const newState = [...prev];
          newState[index] = true;
          return newState;
        });
      };

      img.onerror = () => {
        setImagesLoaded(prev => {
          const newState = [...prev];
          newState[index] = true;
          return newState;
        });
        console.error(`Failed to load image: ${src}`);
      };

      img.src = src;
      return img;
    });

    return () => {
      imageObjects.forEach(img => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [images]);

  if (!images || images.length === 0) {
    return (
      <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500 text-xl">No images available</div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      {/* Main image */}
      {images.map((item, index) => {
        const src = typeof item === 'object' && item.url ? item.url : item;
        const alt = typeof item === 'object' && item.alt ? item.alt : '';
        return (
          <img
            key={src}
            src={src}
            alt={alt}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ filter: 'brightness(0.7)' }} // Darkens the image slightly
            loading="lazy"
          />
        );
      })}

      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
}
