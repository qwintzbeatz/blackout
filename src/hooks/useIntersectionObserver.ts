'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef, memo } from 'react';

// Intersection Observer hook for lazy loading
const useIntersectionObserver = (
  targetRef: React.RefObject<HTMLElement>,
  onIntersect: () => void,
  options?: IntersectionObserverInit
) => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && onIntersect) {
            onIntersect();
          }
        });
      },
      {
        root: null,
        rootMargin: '50px',
        threshold: 0.1,
        ...options
      }
    );

    if (targetRef.current) {
      observer.observe(targetRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [targetRef, onIntersect, options]);
};

// Enhanced accessibility hook
const useAccessibility = () => {
  // Keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'Tab':
        // Focus navigation buttons
        const navButtons = document.querySelectorAll('[role="button"], [aria-label]');
        const currentIndex = Array.from(navButtons).findIndex(btn => 
          btn === document.activeElement
        );
        
        if (currentIndex !== -1) {
          const nextIndex = (currentIndex + 1) % navButtons.length;
          if (navButtons[nextIndex]) {
            (navButtons[nextIndex] as HTMLElement).focus();
          }
        }
        break;
        
      case 'Enter':
      case ' ': {
        const activeButton = document.activeElement as HTMLButtonElement;
        if (activeButton && activeButton.getAttribute('role') === 'button') {
          activeButton.click();
        }
        break;
      }
        
      case 'Escape':
        // Close any open panels or modals
        const closeButton = document.querySelector('[aria-label*="Close"]');
        if (closeButton) {
          (closeButton as HTMLElement).click();
        }
        break;
    }
  }, []);

  return { handleKeyDown };
};

// Touch optimization hook
const useTouchOptimization = () => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [lastTap, setLastTap] = useState<number>(0);

  useEffect(() => {
    const handleTouchStart = (e: Event) => {
      const touchEvent = e as TouchEvent;
      setTouchStart({ x: touchEvent.touches[0].clientX, y: touchEvent.touches[0].clientY });
    };

    const handleTouchEnd = (e: Event) => {
      const touchEvent = e as TouchEvent;
      if (touchStart && lastTap > 0 && Date.now() - lastTap < 300) {
        // Double tap detected
        console.log('Double tap detected');
      }
      setTouchStart(null);
      setLastTap(Date.now());
    };

    const element = document.querySelector('.navigation-container');
    if (element) {
      element.addEventListener('touchstart', handleTouchStart, { passive: true });
      element.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
  }, []);

  return { touchStart, lastTap };
};

export { useIntersectionObserver, useAccessibility, useTouchOptimization };