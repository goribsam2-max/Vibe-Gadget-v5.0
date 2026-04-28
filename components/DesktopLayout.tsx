import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import Icon from './Icon';

import { useTheme } from './ThemeContext';

const DesktopLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const updateCart = () => {
      const cart = JSON.parse(localStorage.getItem('f_cart') || '[]');
      const count = cart.reduce((acc: number, item: any) => acc + item.quantity, 0);
      const total = cart.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
      setCartCount(count);
      setCartTotal(total);
    };
    updateCart();
    window.addEventListener('storage', updateCart);
    const interval = setInterval(updateCart, 1000); // Polling for fast local updates
    return () => {
      window.removeEventListener('storage', updateCart);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('f_cart');
    navigate('/auth-selector');
  };

  const menuLinks = [
    { to: '/', icon: 'home', label: 'Home' },
    { to: '/search', icon: 'search', label: 'Search' },
    { to: '/all-products', icon: 'layer-group', label: 'Catalog' },
    { to: '/blog', icon: 'newspaper', label: 'Blog' },
    { to: '/wishlist', icon: 'heart', label: 'Saved' },
    { to: '/orders', icon: 'shopping-bag', label: 'My Orders' },
    { to: '/notifications', icon: 'bell', label: 'Alerts' },
    { to: '/profile', icon: 'user', label: 'Profile' }
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-800 flex">
      {/* Desktop Left Sidebar */}
      <motion.div 
        animate={{ width: isSidebarOpen ? 256 : 80 }}
        className="hidden md:flex flex-col bg-zinc-50 dark:bg-zinc-800 border-r border-zinc-200 dark:border-zinc-700 h-screen sticky top-0 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-40 transition-all duration-300 overflow-hidden"
      >
        <div className="flex items-center space-x-3 mb-8 px-5 pt-6 pb-2">
           <button 
             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
             className="w-10 h-10 flex shrink-0 items-center justify-center rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:bg-zinc-800 transition-colors"
           >
             <Icon name={isSidebarOpen ? "bars-staggered" : "bars"} className="text-lg" />
           </button>
           <AnimatePresence>
             {isSidebarOpen && (
               <motion.div 
                 initial={{ opacity: 0, width: 0 }}
                 animate={{ opacity: 1, width: 'auto' }}
                 exit={{ opacity: 0, width: 0 }}
                 className="overflow-hidden whitespace-nowrap"
               >
                 <h1 className="text-base lg:text-sm xl:text-xs font-black tracking-tighter text-[#06331e]">VibeGadget.</h1>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        <nav className="flex-1 space-y-2 px-3 overflow-y-auto no-scrollbar pb-4">
          {menuLinks.map(link => {
            const isActive = location.pathname === link.to;
            return (
              <NavLink 
                key={link.to} 
                to={link.to}
                title={!isSidebarOpen ? link.label : undefined}
                className={`flex items-center px-4 py-3.5 rounded-2xl transition-all font-bold text-sm tracking-tight ${isActive ? 'bg-[#06331e] text-white shadow-md shadow-emerald-900/20' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800'} ${isSidebarOpen ? 'space-x-4' : 'justify-center'}`}
              >
                <Icon name={link.icon} className={`text-xl shrink-0 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                <AnimatePresence>
                  {isSidebarOpen && (
                    <motion.span 
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {link.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            );
          })}
          
          <button 
            onClick={toggleTheme} 
            title={!isSidebarOpen ? "Toggle Theme" : undefined}
            className={`flex items-center px-4 py-3.5 rounded-2xl text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-800 hover:text-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-white w-full font-bold text-sm transition-colors ${isSidebarOpen ? 'space-x-4' : 'justify-center'}`}
          >
            <Icon name={isDark ? "sun" : "moon"} className={`text-xl shrink-0 ${isDark ? "text-yellow-500" : "text-zinc-500"}`} />
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  {isDark ? 'Light Mode' : 'Dark Mode'}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </nav>

        <div className="mt-auto border-t border-zinc-100 dark:border-zinc-800 p-4">
           {auth.currentUser ? (
              <button 
                onClick={handleLogout} 
                title={!isSidebarOpen ? "Log out" : undefined}
                className={`flex items-center px-4 py-3.5 rounded-2xl text-red-600 hover:bg-red-50 hover:text-red-700 w-full font-bold text-sm transition-colors ${isSidebarOpen ? 'space-x-4' : 'justify-center'}`}
              >
                <Icon name="sign-out-alt" className="text-xl shrink-0" />
                <AnimatePresence>
                  {isSidebarOpen && (
                    <motion.span 
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      Log out
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
           ) : (
              <button 
                onClick={() => navigate('/signin')} 
                title={!isSidebarOpen ? "Sign in" : undefined}
                className={`flex items-center justify-center py-3.5 rounded-xl bg-[#06331e] text-white w-full font-bold text-xs uppercase tracking-widest hover:bg-zinc-900 transition-colors shadow-lg shadow-emerald-900/20 ${isSidebarOpen ? 'space-x-2 px-4' : 'px-0'}`}
              >
                <Icon name="lock" className="text-lg shrink-0" />
                <AnimatePresence>
                  {isSidebarOpen && (
                    <motion.span 
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      Sign in
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
           )}
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-full lg:max-w-[calc(100vw-80px)] xl:max-w-none overflow-x-hidden bg-zinc-50 dark:bg-zinc-800 md:bg-zinc-50 dark:bg-zinc-800/50">
        <div className="w-full max-w-[1920px] mx-auto pb-24 md:pb-0">
          {children}
        </div>
      </div>

      {/* Desktop Right Cart Sidebar */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div 
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className="hidden xl:flex flex-col w-80 bg-zinc-50 dark:bg-zinc-800 border-l border-zinc-200 dark:border-zinc-700 h-screen sticky top-0 shrink-0 p-6 shadow-[-4px_0_24px_rgba(0,0,0,0.02)] z-40"
          >
            <div className="mb-8 pt-4">
               <h2 className="text-xl font-black tracking-tight text-[#06331e]">Your Cart</h2>
               <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest mt-1">{cartCount} items</p>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
               {JSON.parse(localStorage.getItem('f_cart') || '[]').map((item: any) => (
                 <div key={item.id} className="flex items-center space-x-4 bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 transition-colors">
                    <div className="w-14 h-14 bg-zinc-50 dark:bg-zinc-800 rounded-xl p-1 shrink-0 border border-zinc-50 shadow-sm flex items-center justify-center">
                       <img src={item.image} className="max-w-full max-h-full object-contain mix-blend-multiply dark:mix-blend-normal" alt=""/>
                    </div>
                    <div className="flex-1 min-w-0">
                       <h4 className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate uppercase tracking-tighter" title={item.name}>{item.name}</h4>
                       <p className="text-xs font-black text-emerald-600 mt-0.5">৳{item.price * item.quantity}</p>
                    </div>
                    <div className="text-[10px] font-black text-zinc-400 px-2 bg-zinc-100 dark:bg-zinc-800 rounded-md py-1">x{item.quantity}</div>
                 </div>
               ))}
            </div>

            <div className="mt-6 border-t border-zinc-100 dark:border-zinc-800 pt-6">
               <div className="flex justify-between items-end mb-6">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest mb-1.5">Grand Total</span>
                  <span className="text-3xl font-black tracking-tighter text-[#06331e]">৳{cartTotal}</span>
               </div>
               <button onClick={() => navigate('/checkout')} className="w-full py-4 bg-[#06331e] text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-emerald-900/20 hover:bg-zinc-900 hover:scale-[1.02] transition-all active:scale-[0.98]">
                 Proceed to Checkout
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DesktopLayout;
