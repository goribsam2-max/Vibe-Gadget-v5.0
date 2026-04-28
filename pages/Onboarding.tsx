
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const slides = [
  {
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=500',
    title: 'Discover Premium Tech',
    desc: 'Explore our curated collection of high-quality mobile accessories and gadgets.'
  },
  {
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=500',
    title: 'Secure Shopping',
    desc: 'Browse, compare, and order your essentials with a fast and secure experience.'
  },
  {
    image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=500',
    title: 'Fast Nationwide Delivery',
    desc: 'Reliable shipping across Bangladesh. Get your gadgets delivered to your doorstep.'
  }
];

const Onboarding: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const handleFinish = () => {
    localStorage.setItem('vibe_onboarded', 'true');
    onFinish();
    navigate('/auth-selector');
  };

  const next = () => {
    if (current === slides.length - 1) {
      handleFinish();
    } else {
      setCurrent(current + 1);
    }
  };

  return (
    <div className="h-screen flex flex-col p-8 bg-zinc-50 dark:bg-zinc-800 max-w-md mx-auto">
      <div className="flex justify-end mb-6">
        <button onClick={handleFinish} className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-black dark:text-white transition-colors">Skip</button>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div 
            key={current}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full flex flex-col items-center"
          >
            <div className="w-full aspect-[4/5] bg-zinc-50 dark:bg-zinc-800 rounded-[48px] mb-12 overflow-hidden shadow-2xl shadow-zinc-100">
              <img src={slides[current].image} className="w-full h-full object-cover" alt="" />
            </div>
            
            <h1 className="text-3xl font-black text-center mb-4 tracking-tighter leading-none">{slides[current].title}</h1>
            <p className="text-zinc-500 text-sm text-center leading-relaxed mb-10 px-6 font-medium">{slides[current].desc}</p>
          </motion.div>
        </AnimatePresence>
        
        <div className="flex space-x-2 mb-10">
          {slides.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === current ? 'w-8 bg-zinc-900' : 'w-2 bg-zinc-200'}`}></div>
          ))}
        </div>
      </div>

      <div className="space-y-4 w-full">
        <button onClick={next} className="btn-primary w-full shadow-2xl shadow-black/10 py-5 text-sm uppercase tracking-widest">
          {current === slides.length - 1 ? "Start Shopping" : "Continue"}
        </button>
        
        {current === 0 && (
          <p className="text-center text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Already a member? <button onClick={() => navigate('/signin')} className="text-black dark:text-white underline">Sign In</button>
          </p>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
