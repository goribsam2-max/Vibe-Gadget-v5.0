
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../components/Icon';
import { CustomSectionEmbed } from '../components/CustomSectionEmbed';

const Cart: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('f_cart') || '[]');
    setItems(cart);
  }, []);

  const total = items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

  const updateQuantity = (index: number, delta: number) => {
    const newItems = [...items];
    newItems[index].quantity = Math.max(1, newItems[index].quantity + delta);
    setItems(newItems);
    localStorage.setItem('f_cart', JSON.stringify(newItems));
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    localStorage.setItem('f_cart', JSON.stringify(newItems));
  };

  return (
    <div className="p-6 md:p-12 pb-24 animate-fade-in bg-zinc-50 dark:bg-zinc-800 max-w-7xl mx-auto min-h-screen relative overflow-hidden">
        <div className="absolute top-[-50%] right-[-10%] w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
        <div className="flex items-center space-x-6 mb-16 relative z-10 animate-stagger-1">
          <button onClick={() => navigate(-1)} className="p-3.5 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm hover:bg-zinc-900 hover:text-white transition-all active:scale-90 group hover-tilt">
             <Icon name="chevron-left" className="text-xs group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-xl lg:text-base xl:text-sm font-black tracking-tighter uppercase text-shine">Shopping Cart.</h1>
            <p className="text-[9px] font-bold text-emerald-600/70 uppercase tracking-[0.4em] mt-1 pl-1">Review Items</p>
          </div>
       </div>

       {items.length === 0 ? (
         <div className="flex flex-col items-center justify-center py-32 text-center relative z-10 animate-stagger-2">
            <div className="w-24 h-24 bg-zinc-50 dark:bg-zinc-800 rounded-[2.5rem] flex items-center justify-center mb-8 border border-zinc-100 dark:border-zinc-800 pulse-ring-active shadow-sm">
                <Icon name="shopping-cart" className="text-3xl text-zinc-300" />
            </div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Your cart is empty</p>
            <button onClick={() => navigate('/')} className="mt-10 btn-primary px-12 text-[10px] uppercase tracking-widest shadow-xl shadow-zinc-200 hover-tilt">Start Shopping</button>
         </div>
       ) : (
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10 animate-stagger-2">
           <div className="lg:col-span-8 space-y-4">
             <AnimatePresence mode="popLayout">
               {items.map((item, idx) => (
                 <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9, x: 20 }} key={idx} className="bg-zinc-100/50 dark:bg-zinc-800/40 p-4 md:p-6 rounded-3xl flex items-center space-x-6 border border-zinc-200 dark:border-zinc-700/50 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-600 group">
                    <div className="w-20 h-20 md:w-28 md:h-28 bg-white dark:bg-zinc-900 rounded-[1.5rem] p-2 md:p-3 shadow-sm shrink-0 border border-zinc-100 dark:border-zinc-800 group-hover:scale-105 transition-transform text-zinc-600 dark:text-zinc-300 overflow-hidden relative flex items-center justify-center">
                       <img src={item.image} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal hover:scale-110 transition-transform duration-500" alt="" />
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-sm md:text-lg truncate pr-4 tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 transition-colors">{item.name}</h4>
                          <button onClick={() => removeItem(idx)} className="text-zinc-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full active:scale-90">
                             <Icon name="trash" className="text-xs" />
                          </button>
                       </div>
                       <div className="flex justify-between items-center mt-4 md:mt-6">
                          <p className="font-black text-sm md:text-xl text-zinc-900 dark:text-zinc-100 tracking-tight">৳{item.price * item.quantity}</p>
                          <div className="flex items-center space-x-4 md:space-x-5 bg-white dark:bg-zinc-900 px-3 md:px-4 py-1.5 md:py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
                             <button onClick={() => updateQuantity(idx, -1)} className="font-black hover:text-emerald-500 transition-colors px-1 active:scale-90 text-zinc-400 hover:bg-zinc-50 dark:bg-zinc-800 rounded-full w-6 h-6 flex items-center justify-center">−</button>
                             <span className="text-[11px] font-black w-4 text-center text-zinc-900 dark:text-zinc-100">{item.quantity}</span>
                             <button onClick={() => updateQuantity(idx, 1)} className="font-black hover:text-emerald-500 transition-colors px-1 active:scale-90 text-zinc-400 hover:bg-zinc-50 dark:bg-zinc-800 rounded-full w-6 h-6 flex items-center justify-center">+</button>
                          </div>
                       </div>
                    </div>
                 </motion.div>
               ))}
             </AnimatePresence>
           </div>

            <div className="lg:col-span-4 animate-stagger-3">
             <div className="bg-zinc-900 dark:bg-emerald-900/10 text-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl sticky top-12 border border-zinc-800 dark:border-emerald-800/30 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-[60px] opacity-20 pointer-events-none"></div>
                <h3 className="text-lg font-black tracking-tight mb-8 relative z-10">Order Summary</h3>
                <div className="space-y-4 relative z-10 text-sm font-medium">
                   <div className="flex justify-between text-zinc-400">
                      <span>Subtotal</span>
                      <span className="text-white">৳{total}</span>
                   </div>
                   <div className="flex justify-between text-zinc-400">
                      <span>Shipping Fee</span>
                      <span className="text-white">৳150</span>
                   </div>
                   <div className="h-px bg-zinc-800/50 my-6"></div>
                   <div className="flex justify-between items-end">
                      <span className="text-xs uppercase text-zinc-400 font-bold tracking-widest">Total Amount</span>
                      <span className="text-3xl font-black tracking-tighter text-white drop-shadow-md">৳{total + 150}</span>
                   </div>
                </div>
                <button onClick={() => navigate('/checkout')} className="w-full mt-10 py-4 bg-emerald-500 text-white rounded-2xl font-bold text-sm shadow-[0_10px_20px_rgba(16,185,129,0.3)] hover:bg-emerald-400 active:scale-95 transition-all relative z-10 overflow-hidden flex items-center justify-center group/btn">
                  <span className="relative z-10">Checkout Now</span>
                </button>
             </div>
           </div>
         </div>
       )}
       <CustomSectionEmbed location="cart_bottom" />
    </div>
  );
};

export default Cart;
