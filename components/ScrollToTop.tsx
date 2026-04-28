import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../components/Icon';

const ScrollToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Toggle visibility when scrolled down more than 300px
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, y: 30, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.8 }}
          onClick={scrollToTop}
          className="fixed bottom-28 md:bottom-10 right-6 z-50 w-12 h-12 bg-zinc-900 dark:bg-zinc-50 dark:text-black text-white rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95"
          aria-label="Scroll to top"
        >
          <Icon name="arrow-up" className="text-sm" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ScrollToTop;
