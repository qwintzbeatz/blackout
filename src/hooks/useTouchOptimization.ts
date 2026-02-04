'use client';

import { useEffect, useRef } from 'react';

// Touch optimization hook with enhanced gesture support
const useTouchOptimization = () => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [lastTap, setLastTap] = useState<number>(0);
  const [swipeGesture, setSwipeGesture] = useState<'none' | 'left' | 'right' | 'up' | 'down'>(null);

  // Configure optimal touch targets for mobile
  const configureTouchTargets = (element: HTMLElement) => {
    element.style.touchAction = 'manipulation';
    element.style.userSelect = 'none';
    element.style.webkitUserSelect = 'none';
    element.style.webkitTapHighlightColor = 'transparent';
  };

  useEffect(() => {
    const element = document.querySelector('.navigation-container');
    if (element) {
      configureTouchTargets(element);
      
      const handleTouchStart = (e: TouchEvent) => {
        const touch = e.touches[0];
        if (touch) {
          setTouchStart({ x: touch.clientX, y: touch.clientY });
        }
      };

      const handleTouchEnd = (e: TouchEvent) => {
        if (!touchStart || !touch) return;
        
        const deltaX = touch.clientX - touchStart.x;
        const deltaY = touch.clientY - touchStart.y;
        const deltaTime = Date.now() - lastTap;
        
        // Detect swipe gestures
        if (Math.abs(deltaX) > 50) {
          setSwipeGesture(deltaX > 0 ? 'right' : 'left');
        } else if (Math.abs(deltaY) > 50) {
          setSwipeGesture(deltaY > 0 ? 'down' : 'up');
        }
        
        // Detect taps
        if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 200) {
          setLastTap(Date.now());
          console.log('Tap detected');
        }
        
        // Double tap detection
        if (deltaTime < 300 && lastTap > 0) {
          setLastTap(Date.now());
          console.log('Double tap detected');
        }
        
        setTouchStart(null);
        setSwipeGesture('none');
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (!touchStart) return;
        
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        
        // Visual feedback for swipe gestures
        if (swipeGesture === 'left' && currentX < touchStart.x - 20) {
          setSwipeGesture('left');
        } else if (swipeGesture === 'right' && currentX > touchStart.x + 20) {
          setSwipeGesture('right');
        }
      };

      element.addEventListener('touchstart', handleTouchStart, { passive: true, capture: false });
      element.addEventListener('touchmove', handleTouchMove, { passive: true, capture: false });
      element.addEventListener('touchend', handleTouchEnd, { passive: true, capture: false });
    }
  }, []);

  return { touchStart, lastTap, swipeGesture };
};