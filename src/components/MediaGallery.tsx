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
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {media.map((item, index) => (
          <div
            key={item.id}
            className="relative group cursor-pointer"
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
                className="w-full h-48 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="relative">
                <video
                  src={item.url}
                  className="w-full h-48 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-105"
                  muted
                  preload="metadata"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg group-hover:bg-opacity-40 transition-all duration-200">
                  <Play className="w-12 h-12 text-white opacity-80" />
                </div>
              </div>
            )}
            
            {/* Overlay with media count */}
            <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
              {index + 1}/{media.length}
            </div>
            
            {item.caption && (
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">{item.caption}</p>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedIndex !== null && selectedMedia && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
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
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            aria-label="Close media viewer"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Navigation Buttons */}
          {media.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
                aria-label="Previous media"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
                aria-label="Next media"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Media Content */}
          <div
            className="max-w-4xl max-h-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedMedia.type === 'image' ? (
              <img
                src={selectedMedia.url}
                alt={selectedMedia.alt || `Event image ${selectedIndex + 1}`}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            ) : (
              <div className="relative">
                <video
                  src={selectedMedia.url}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                  controls
                  autoPlay={isVideoPlaying}
                  onPlay={() => setIsVideoPlaying(true)}
                  onPause={() => setIsVideoPlaying(false)}
                />
              </div>
            )}
            
            {/* Media Info */}
            <div className="mt-4 text-center text-white max-w-2xl">
              <div className="text-sm opacity-75 mb-2">
                {selectedIndex + 1} of {media.length}
              </div>
              {selectedMedia.caption && (
                <p className="text-lg">{selectedMedia.caption}</p>
              )}
              {selectedMedia.alt && selectedMedia.alt !== selectedMedia.caption && (
                <p className="text-sm opacity-75 mt-1">{selectedMedia.alt}</p>
              )}
            </div>
          </div>

          {/* Thumbnail Navigation */}
          {media.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4">
              {media.map((item, index) => (
                <button
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndex(index);
                    setIsVideoPlaying(false);
                  }}
                  className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all ${
                    index === selectedIndex
                      ? 'border-white scale-110'
                      : 'border-transparent opacity-60 hover:opacity-80'
                  }`}
                  aria-label={`Go to ${item.type} ${index + 1}`}
                >
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="relative w-full h-full bg-gray-800">
                      <video
                        src={item.url}
                        className="w-full h-full object-cover"
                        muted
                        preload="metadata"
                      />
                      <Play className="absolute inset-0 w-4 h-4 text-white m-auto" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
} 