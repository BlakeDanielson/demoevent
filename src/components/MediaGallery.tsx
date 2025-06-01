'use client';

import { useState } from 'react';
import { EventMedia } from '@/lib/types/event';
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';

interface MediaGalleryProps {
  media: EventMedia[];
  className?: string;
}

export default function MediaGallery({ media, className = '' }: MediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  if (media.length === 0) {
    return null;
  }

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    setIsVideoPlaying(false);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
    setIsVideoPlaying(false);
  };

  const goToPrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : media.length - 1);
      setIsVideoPlaying(false);
    }
  };

  const goToNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex < media.length - 1 ? selectedIndex + 1 : 0);
      setIsVideoPlaying(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (selectedIndex === null) return;
    
    switch (e.key) {
      case 'Escape':
        closeLightbox();
        break;
      case 'ArrowLeft':
        goToPrevious();
        break;
      case 'ArrowRight':
        goToNext();
        break;
      case ' ':
        e.preventDefault();
        if (media[selectedIndex].type === 'video') {
          setIsVideoPlaying(!isVideoPlaying);
        }
        break;
    }
  };

  const selectedMedia = selectedIndex !== null ? media[selectedIndex] : null;

  return (
    <>
      {/* Gallery Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 ${className}`}>
        {media.map((item, index) => (
          <div
            key={item.id}
            className="relative group cursor-pointer touch-target"
            onClick={() => openLightbox(index)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openLightbox(index);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={`View ${item.type} ${index + 1} of ${media.length}${item.alt ? `: ${item.alt}` : ''}`}
          >
            {item.type === 'image' ? (
              <img
                src={item.url}
                alt={item.alt || `Event image ${index + 1}`}
                className="w-full h-32 sm:h-40 md:h-48 lg:h-56 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="relative">
                <video
                  src={item.url}
                  className="w-full h-32 sm:h-40 md:h-48 lg:h-56 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-105"
                  muted
                  preload="metadata"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg group-hover:bg-opacity-40 transition-all duration-200">
                  <Play className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white opacity-80" />
                </div>
              </div>
            )}
            
            {/* Overlay with media count */}
            <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
              {index + 1}/{media.length}
            </div>
            
            {item.caption && (
              <p className="mt-2 text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed">{item.caption}</p>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedIndex !== null && selectedMedia && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-2 sm:p-4"
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="Media viewer"
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white hover:text-gray-300 transition-colors z-10 touch-target"
            aria-label="Close media viewer"
          >
            <X className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>

          {/* Navigation Buttons */}
          {media.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 touch-target p-2"
                aria-label="Previous media"
              >
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 touch-target p-2"
                aria-label="Next media"
              >
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            </>
          )}

          {/* Media Content */}
          <div
            className="max-w-full max-h-full flex flex-col items-center px-8 sm:px-12 md:px-16"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedMedia.type === 'image' ? (
              <img
                src={selectedMedia.url}
                alt={selectedMedia.alt || `Event image ${selectedIndex + 1}`}
                className="max-w-full max-h-[70vh] sm:max-h-[75vh] md:max-h-[80vh] object-contain rounded-lg"
              />
            ) : (
              <div className="relative w-full max-w-4xl">
                <video
                  src={selectedMedia.url}
                  className="w-full max-h-[70vh] sm:max-h-[75vh] md:max-h-[80vh] object-contain rounded-lg"
                  controls
                  autoPlay={isVideoPlaying}
                  onPlay={() => setIsVideoPlaying(true)}
                  onPause={() => setIsVideoPlaying(false)}
                />
              </div>
            )}
            
            {/* Media Info */}
            <div className="mt-3 sm:mt-4 text-center text-white max-w-2xl px-2">
              <div className="text-xs sm:text-sm opacity-75 mb-1 sm:mb-2">
                {selectedIndex + 1} of {media.length}
              </div>
              {selectedMedia.caption && (
                <p className="text-sm sm:text-base md:text-lg leading-relaxed">{selectedMedia.caption}</p>
              )}
              {selectedMedia.alt && selectedMedia.alt !== selectedMedia.caption && (
                <p className="text-xs sm:text-sm opacity-75 mt-1">{selectedMedia.alt}</p>
              )}
            </div>
          </div>

          {/* Mobile swipe indicators */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 sm:hidden">
            {media.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === selectedIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
} 