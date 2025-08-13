import { useState, useEffect } from 'react';

// Custom hook to detect scroll direction for auto-hiding navigation
export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;

    const updateScrollDirection = () => {
      const scrollY = window.pageYOffset;
      const scrollThreshold = 10; // Only trigger on significant scroll
      
      if (Math.abs(scrollY - lastScrollY) < scrollThreshold) {
        ticking = false;
        return;
      }

      const direction = scrollY > lastScrollY ? 'down' : 'up';
      
      // Don't hide header when near top of page
      if (scrollY < 50) {
        setScrollDirection('up');
      } else {
        setScrollDirection(direction);
      }
      
      setLastScrollY(scrollY);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollDirection);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [lastScrollY]);

  return scrollDirection;
}