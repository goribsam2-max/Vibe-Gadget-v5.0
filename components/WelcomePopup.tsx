import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';

interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  link?: string;
  bannerType?: 'hero' | 'popup' | 'gif';
}

const WelcomePopup: React.FC<{ banners: Banner[] }> = ({ banners }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [doNotShow, setDoNotShow] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (banners.length === 0) return;
    
    // Check local storage for 1-day expiration
    const storedData = localStorage.getItem('hide_welcome_popup');
    if (storedData) {
      try {
        const { timestamp } = JSON.parse(storedData);
        if (timestamp && Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          return; // Still within 1 day
        } else {
          localStorage.removeItem('hide_welcome_popup');
        }
      } catch (e) {
        // Fallback for older true/false format
        if (storedData === 'true') {
           localStorage.setItem('hide_welcome_popup', JSON.stringify({ timestamp: Date.now() }));
           return;
        }
      }
    }

    // Small delay for better UX
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [banners]);

  useEffect(() => {
    if (!isOpen || banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4000); // Auto slide every 4 seconds

    return () => clearInterval(interval);
  }, [isOpen, banners]);

  const handleClose = () => {
    if (doNotShow) {
      localStorage.setItem('hide_welcome_popup', JSON.stringify({ timestamp: Date.now() }));
    }
    setIsOpen(false);
  };

  const handleBannerClick = () => {
    const link = banners[currentIndex]?.link;
    if (link) {
      navigate(link);
      handleClose();
    }
  };

  if (banners.length === 0) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 sm:p-10">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm bg-zinc-50 dark:bg-zinc-800 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col"
          >
            <button 
              onClick={handleClose}
              className="absolute text-white shadow-lg top-4 right-4 z-20 w-8 h-8 bg-zinc-900/40 hover:bg-zinc-900 backdrop-blur-md rounded-full flex items-center justify-center transition-colors"
            >
              <Icon name="times" />
            </button>

            <div 
              className="relative w-full cursor-pointer bg-zinc-100 dark:bg-zinc-800 flex-1 flex items-center justify-center overflow-hidden" 
              onClick={handleBannerClick}
            >
               {/* Auto-size aspect ratio, limiting max height so it doesn't take up entire screen */}
               <AnimatePresence mode="popLayout" initial={false}>
                 <motion.img
                   key={currentIndex}
                   src={banners[currentIndex].imageUrl}
                   initial={{ opacity: 0, x: 50 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -50 }}
                   transition={{ duration: 0.5, ease: 'easeInOut' }}
                   className="w-full h-auto max-h-[60vh] object-contain block bg-zinc-900"
                   alt={banners[currentIndex].title}
                 />
               </AnimatePresence>
               <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                  <h3 className="text-white font-black text-xl tracking-tight leading-none mb-1 shadow-sm">{banners[currentIndex].title}</h3>
                  <p className="text-zinc-200 text-[10px] font-bold uppercase tracking-widest leading-loose">{banners[currentIndex].description}</p>
               </div>
            </div>

            {banners.length > 1 && (
               <div className="absolute top-4 left-1/2 -translate-x-1/2 flex space-x-1.5 z-20">
                  {banners.map((_, idx) => (
                    <div 
                       key={idx} 
                       className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${currentIndex === idx ? 'bg-zinc-50 dark:bg-zinc-800 w-4' : 'bg-zinc-50 dark:bg-zinc-900/50'}`} 
                    />
                  ))}
               </div>
            )}

            <div className="p-4 bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
               <label className="flex items-center space-x-2 cursor-pointer group ml-2 py-1">
                  <input 
                     type="checkbox" 
                     className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-zinc-300 transition-colors"
                     checked={doNotShow}
                     onChange={(e) => setDoNotShow(e.target.checked)}
                  />
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest group-hover:text-black dark:text-white transition-colors">Do not show again</span>
               </label>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WelcomePopup;
