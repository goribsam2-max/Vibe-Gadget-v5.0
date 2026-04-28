import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import Logo from '../components/Logo';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#121212] flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-md w-full bg-white dark:bg-black p-10 sm:p-14 rounded-3xl shadow-2xl border border-zinc-100 dark:border-zinc-800"
      >
        <div className="flex justify-center mb-10">
           <Logo scale={1.2} centerOrigin />
        </div>
        
        <motion.div
          animate={{ rotate: [-2, 2, -2] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="w-24 h-24 mx-auto bg-zinc-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-8 shadow-inner"
        >
          <Icon name="search" className="text-4xl text-zinc-400" />
        </motion.div>
        
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-3">
          Page Not Found
        </h1>
        
        <p className="text-sm text-zinc-500 font-medium mb-10 leading-relaxed">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <button 
          onClick={() => navigate('/')}
          className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-md flex items-center justify-center gap-2"
        >
          <Icon name="arrow-left" className="text-xs" />
          Back to Home
        </button>
      </motion.div>
    </div>
  );
};

export default NotFound;
