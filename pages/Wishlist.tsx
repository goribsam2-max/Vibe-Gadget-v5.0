
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotify } from '../components/Notifications';
import Icon from '../components/Icon';
import { CustomSectionEmbed } from '../components/CustomSectionEmbed';
import { useTheme } from '../components/ThemeContext';

const Wishlist: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const { isDark, toggleTheme } = useTheme();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }
    
    const q = query(
      collection(db, 'users', auth.currentUser.uid, 'wishlist'),
      orderBy('addedAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  const removeFromWishlist = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'wishlist', id));
      notify("Removed from wishlist", "info");
    } catch (err) {
      notify("Failed to remove item", "error");
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-800">
      <div className="w-10 h-10 border-4 border-[#06331e] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="px-6 md:px-12 py-10 pb-24 bg-zinc-50 dark:bg-zinc-800 max-w-7xl mx-auto min-h-screen">
      <div className="flex items-center justify-between mb-12 relative z-10">
        <div className="flex items-center space-x-6">
          <button onClick={() => navigate(-1)} className="p-3.5 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm hover:bg-zinc-900 hover:text-white transition-all active:scale-90 group hover-tilt">
            <Icon name="chevron-left" className="text-xs group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex flex-col">
             <h1 className="text-lg md:text-xl lg:text-base xl:text-sm font-semibold tracking-tight uppercase text-shine">Saved.</h1>
             <p className="text-[9px] font-bold text-emerald-600/70 uppercase tracking-normal mt-1 pl-1">Your Wishlist</p>
          </div>
        </div>

        <div className="flex bg-zinc-100 dark:bg-zinc-800/50 rounded-full p-1 border border-zinc-200 dark:border-zinc-700/50">
           <button onClick={toggleTheme} className="w-10 h-10 flex items-center justify-center rounded-full cursor-pointer relative active:scale-95 transition-transform hover:bg-white dark:hover:bg-zinc-700 shadow-sm group text-zinc-600 dark:text-zinc-400">
              <Icon name={isDark ? "sun" : "moon"} className="text-sm" />
           </button>
           <button onClick={() => navigate('/notifications')} className="w-10 h-10 flex items-center justify-center rounded-full relative active:scale-95 transition-transform hover:bg-white dark:hover:bg-zinc-700 shadow-sm group text-zinc-600 dark:text-zinc-400">
             <Icon name="bell" className="text-sm" />
             <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_0_2px_#f4f4f5] dark:shadow-[0_0_0_2px_#27272a] animate-pulse"></span>
           </button>
        </div>
      </div>

      {!auth.currentUser ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-24 h-24 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-8 border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <Icon name="lock" className="text-xl text-[#06331e]/20" />
          </div>
          <h2 className="text-xl font-bold mb-3 tracking-tight text-[#06331e]">Sign In Required</h2>
          <p className="text-sm text-zinc-400 mb-10 max-w-xs mx-auto">Please login to view and manage your saved tech essentials.</p>
          <button onClick={() => navigate('/auth-selector')} className="btn-primary bg-[#06331e] px-12 text-[10px] uppercase tracking-normal font-bold shadow-xl shadow-[#06331e]/20">Sign In Now</button>
        </div>
      ) : items.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-32 text-center"
        >
          <div className="w-24 h-24 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-8 border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <Icon name="heart" className="text-xl text-[#06331e]/20" />
          </div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-normal">Nothing saved yet</p>
          <button onClick={() => navigate('/')} className="mt-10 btn-primary bg-[#06331e] px-12 text-[10px] uppercase tracking-normal font-bold shadow-xl shadow-[#06331e]/20">Start Exploring</button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-10">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div 
                layout
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => navigate(`/product/${item.productId}`)}
                className="group cursor-pointer relative hover-tilt bg-zinc-100/50 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-700/50 p-2 md:p-3 rounded-3xl mb-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all hover:shadow-lg"
              >
                <div className="aspect-[4/5] flex items-center justify-center bg-white dark:bg-zinc-900 rounded-[1.5rem] mb-4 overflow-hidden relative shadow-sm border border-zinc-100 dark:border-zinc-800 transition-all duration-300">
                  <img src={item.image} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] mix-blend-multiply dark:mix-blend-normal" alt={item.name} />
                  <button 
                    onClick={(e) => removeFromWishlist(item.id, e)}
                    className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md text-red-500 rounded-full shadow-lg border border-red-100 dark:border-red-900/30 hover:bg-red-500 hover:text-white active:scale-90 transition-all z-10 opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0"
                  >
                    <Icon name="trash-alt" className="text-xs" />
                  </button>
                </div>
                <div className="px-2 pb-2">
                  <h4 className="font-bold text-xs md:text-sm truncate mb-1 tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{item.name}</h4>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">৳ {item.price}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      <CustomSectionEmbed location="wishlist_bottom" />
    </div>
  );
};

export default Wishlist;
