
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../components/Icon';

const OrderSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowStatus(true);
    }, 2500); // Wait for the initial animation to finish
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-800 flex flex-col items-center justify-center px-10 text-center relative overflow-hidden font-inter">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none z-0"></div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        <motion.div 
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.2, 1], opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative mb-10 w-32 h-32 flex items-center justify-center"
        >
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-[3px] border-dashed border-emerald-500/30 rounded-full"
          />
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            transition={{ delay: 0.5, type: "spring" }} 
            className="w-24 h-24 bg-[#06331e] rounded-full flex items-center justify-center text-emerald-400 shadow-[0_0_40px_rgba(6,51,30,0.4)]"
          >
            <Icon name="check-circle" className="text-lg" />
          </motion.div>
        </motion.div>

        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-xl font-semibold mb-3 tracking-tight text-zinc-900 dark:text-zinc-100"
        >
          Success!
        </motion.h1>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 w-full mb-10 shadow-inner"
        >
           <div className="flex items-center space-x-3 text-emerald-800">
             <Icon name="spinner-third" className="animate-spin text-lg shrink-0" />
             <p className="text-sm font-bold leading-relaxed text-left">Your order is currently under review by our team.</p>
           </div>
        </motion.div>

        <AnimatePresence>
          {showStatus && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="space-y-4 w-full"
            >
              <Link to={`/e-receipt/${orderId}`} className="block w-full py-4 bg-[#06331e] text-white rounded-full font-bold shadow-xl shadow-emerald-900/20 text-[11px] uppercase tracking-normal hover:bg-zinc-900 transition-all active:scale-95">
                View Digital Receipt
              </Link>
              <Link to="/" className="block w-full py-4 border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full font-bold text-[11px] uppercase tracking-normal hover:border-zinc-300 hover:text-black dark:text-white transition-all active:scale-95 shadow-sm">
                Continue Exploring
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OrderSuccess;
