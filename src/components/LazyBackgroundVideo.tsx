import React, { useEffect, useRef, useState } from 'react';

interface LazyBackgroundVideoProps {
  src: string;
  className?: string;
  opacity?: number;
  overlayClass?: string;
  fallbackColor?: string;
}

export const LazyBackgroundVideo: React.FC<LazyBackgroundVideoProps> = ({
  src,
  className = '',
  opacity = 0.7,
  overlayClass = 'bg-black/30 backdrop-blur-[1px]',
  fallbackColor = 'bg-[#0a0508]'
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // We use IntersectionObserver to detect when the video is in or near the viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        rootMargin: '200px', // Load and play slightly before it scrolls into view
        threshold: 0.01
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  // Trigger loading when visible
  useEffect(() => {
    if (isVisible && !isLoaded) {
      setIsLoaded(true);
    }
  }, [isVisible, isLoaded]);

  // Handle play/pause once loaded and visibility changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isLoaded) return;

    if (isVisible) {
      if (!hasLoadedRef.current) {
        video.load(); // Tell the browser to load the dynamically injected source
        hasLoadedRef.current = true;
      }
      
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('LazyBackgroundVideo: play failed:', err);
        });
      }
    } else {
      // Pause video when offscreen to completely eliminate GPU decoding overhead
      video.pause();
    }
  }, [isVisible, isLoaded]);

  return (
    <div ref={containerRef} className={`absolute inset-0 z-0 overflow-hidden ${fallbackColor}`}>
      <video
        ref={videoRef}
        loop
        muted
        playsInline
        preload="none"
        style={{ opacity: isLoaded ? opacity : 0 }}
        className={`w-full h-full object-cover transition-opacity duration-1000 ${className}`}
      >
        {isLoaded && <source src={src} type="video/mp4" />}
      </video>
      <div className={`absolute inset-0 ${overlayClass}`} />
    </div>
  );
};
