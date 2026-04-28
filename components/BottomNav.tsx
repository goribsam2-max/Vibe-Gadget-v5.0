
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Icon from './Icon';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const links = [
    { to: '/', icon: 'home', label: 'Home' },
    { to: '/wishlist', icon: 'heart', label: 'Saved' },
    { to: '/cart', icon: 'shopping-bag', label: 'Cart' },
    { to: '/profile', icon: 'user', label: 'Profile' }
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 w-full flex justify-center z-[100] pointer-events-none px-4 md:hidden">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="bg-zinc-50 dark:bg-zinc-800 px-2 py-2 flex justify-between items-center rounded-full shadow-2xl pointer-events-auto w-full max-w-xs border border-zinc-100 dark:border-zinc-800"
      >
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <NavLink 
              key={link.to} 
              to={link.to} 
              className={`relative flex flex-col items-center justify-center flex-1 w-12 h-12 rounded-full transition-all duration-300 ${isActive ? 'text-white' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300'}`}
            >
              {isActive && (
                <motion.div 
                  layoutId="active-nav-bg"
                  className="absolute inset-0 bg-[#06331e] dark:bg-emerald-600 rounded-full z-0 shadow-md"
                  transition={{ type: "spring", bounce: 0.1, duration: 0.5 }}
                />
              )}
              <Icon name={link.icon} className={`text-xl relative z-10 transition-transform ${isActive ? 'scale-100' : 'hover:scale-110'}`} />
            </NavLink>
          );
        })}
      </motion.div>
    </div>
  );
};

export default BottomNav;
