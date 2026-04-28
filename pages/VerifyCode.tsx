
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';

const VerifyCode: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-8 animate-fade-in h-screen flex flex-col">
       <button onClick={() => navigate(-1)} className="p-2 bg-[#f4f4f5] dark:bg-zinc-800/80 rounded-full self-start mb-10">
          <Icon name="chevron-left" className="text-sm" />
       </button>
       
       <div className="text-center flex-1">
          <h1 className="text-2xl font-bold mb-4">Verify Code</h1>
          <p className="text-f-gray text-sm mb-10">Please enter the code we just sent to email <span className="text-black dark:text-white font-bold">example@mail.com</span></p>
          
          <div className="flex justify-center space-x-4 mb-10">
             {[2, 8, '-', '-'].map((v, i) => (
                <div key={i} className="w-14 h-16 bg-[#f4f4f5] dark:bg-zinc-800/80 rounded-2xl flex items-center justify-center font-bold text-xl border-f-light border focus-within:border-black">
                   {typeof v === 'number' ? v : ''}
                </div>
             ))}
          </div>
          
          <p className="text-xs text-f-gray">Didn't receive OTP? <button className="font-bold text-black dark:text-white underline">Resend code</button></p>
       </div>

       <button onClick={() => navigate('/complete-profile')} className="btn-primary w-full">Verify</button>
    </div>
  );
};

export default VerifyCode;
