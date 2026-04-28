
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotify } from '../components/Notifications';
import Icon from '../components/Icon';

const PaymentMethods: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const [selected, setSelected] = useState(localStorage.getItem('vibe_preferred_payment') || 'bKash');

  const methods = [
    { id: 'bKash', logo: 'https://www.logo.wine/a/logo/BKash/BKash-Logo.wine.svg' },
    { id: 'Nagad', logo: 'https://www.logo.wine/a/logo/Nagad/Nagad-Logo.wine.svg' },
    { id: 'Cash on Delivery', svg: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> }
  ];

  const handleSave = () => {
    localStorage.setItem('vibe_preferred_payment', selected);
    notify("Payment preference saved!", "success");
    navigate(-1);
  };

  return (
    <div className="p-6 pb-24 animate-fade-in min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-800 max-w-md mx-auto">
       <div className="flex items-center space-x-4 mb-10">
          <button onClick={() => navigate(-1)} className="p-3 bg-[#f4f4f5] dark:bg-zinc-800/80 rounded-2xl">
             <Icon name="chevron-left" className="text-sm" />
          </button>
          <h1 className="text-xl font-bold">Payment Setup</h1>
       </div>

       <div className="flex-1">
          <div className="mb-10">
             <h2 className="text-[10px] font-bold text-f-gray uppercase tracking-widest mb-2">Policy Notice</h2>
             <p className="text-xs leading-relaxed text-gray-500 font-medium">
                Digital payments (bKash/Nagad) help us process your order faster. Use <span className="text-black dark:text-white font-bold">01747708843</span> for any manual send-money transactions.
             </p>
          </div>

          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Methods</p>
          <div className="space-y-4">
             {methods.map(m => (
               <div 
                  key={m.id} 
                  onClick={() => setSelected(m.id)}
                  className={`p-5 rounded-[28px] border-2 flex items-center justify-between cursor-pointer transition-all ${selected === m.id ? 'border-black bg-f-gray shadow-xl shadow-black/5' : 'border-f-light bg-zinc-50 dark:bg-zinc-800 hover:border-gray-200'}`}
               >
                  <div className="flex items-center space-x-4">
                     {m.logo ? (
                        <div className="w-14 h-14 flex items-center justify-center p-1 bg-zinc-50 dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-50">
                            <img src={m.logo} className="w-full h-full object-contain" alt={m.id} />
                        </div>
                     ) : (
                        <div className="w-14 h-14 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center border border-gray-50 shadow-sm">
                            <svg className="w-6 h-6 text-black dark:text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">{m.svg}</svg>
                        </div>
                     )}
                     <div className="flex flex-col">
                        <span className="font-bold text-sm">{m.id}</span>
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">{m.id === 'Cash on Delivery' ? 'Doorstep Pay' : '01747708843'}</span>
                     </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selected === m.id ? 'border-black' : 'border-gray-200'}`}>
                     {selected === m.id && <div className="w-3 h-3 bg-zinc-900 dark:bg-zinc-50 dark:text-black rounded-full animate-fade-in"></div>}
                  </div>
               </div>
             ))}
          </div>
       </div>

       <button onClick={handleSave} className="btn-primary w-full mt-10 shadow-2xl shadow-black/20">Apply & Save</button>
    </div>
  );
};

export default PaymentMethods;
