import React from 'react';
import Icon from '../components/Icon';

const Logo: React.FC<{ className?: string, scale?: number, centerOrigin?: boolean }> = ({ className = '', scale = 1, centerOrigin = false }) => {
  return (
    <div 
      className={`inline-flex items-center gap-2 ${className}`}
      style={{ transform: `scale(${scale})`, transformOrigin: centerOrigin ? 'center center' : 'left center' }}
    >
      <h1 className="font-sans font-bold tracking-tight text-black dark:text-white text-xl sm:text-lg flex items-center leading-none mt-0.5">
        Vibe<span className="text-zinc-500 dark:text-zinc-400 font-normal ml-0.5">Gadget</span>
      </h1>
    </div>
  );
};

export default Logo;
