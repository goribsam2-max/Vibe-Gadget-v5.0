
import React from 'react';
import { useNavigate } from 'react-router-dom';

const LocationAccess: React.FC = () => {
  const navigate = useNavigate();

  const handleAllow = () => {
    // Request real permission if needed, then navigate
    navigate('/');
  };

  return (
    <div className="h-screen flex flex-col p-8 items-center justify-center text-center animate-fade-in">
       <div className="w-24 h-24 bg-[#f4f4f5] dark:bg-zinc-800/80 rounded-full flex items-center justify-center text-3xl mb-10">📍</div>
       <h1 className="text-2xl font-bold mb-4">What Is Your Location?</h1>
       <p className="text-f-gray text-sm mb-12 px-6">We need to know your location in order to suggest nearby services.</p>
       
       <button onClick={handleAllow} className="btn-primary w-full mb-4">Allow Location Access</button>
       <button onClick={() => navigate('/')} className="text-sm font-bold text-black dark:text-white underline">Enter Location Manually</button>
    </div>
  );
};

export default LocationAccess;
