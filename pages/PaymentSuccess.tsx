
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="h-screen flex flex-col p-8 items-center justify-center text-center animate-fade-in bg-zinc-50 dark:bg-zinc-800 max-w-md mx-auto">
       <div className="w-24 h-24 bg-[#f4f4f5] dark:bg-zinc-800/80 rounded-[40px] flex items-center justify-center mb-10 shadow-2xl shadow-black/5 ring-1 ring-gray-100">
          <Icon name="check-circle" className="w-12 h-12 text-black dark:text-white" />
       </div>
       <h1 className="text-lg font-bold mb-2 tracking-tight">Order Confirmed!</h1>
       <p className="text-f-gray text-sm mb-12 px-10">Your tech essentials are being prepared for delivery via Steadfast Courier.</p>
       
       <div className="w-full space-y-4">
          <button onClick={() => navigate('/orders')} className="btn-primary w-full shadow-xl shadow-black/10 uppercase text-xs tracking-normal">Track Logistics</button>
          <button onClick={() => navigate(`/e-receipt/${orderId}`)} className="btn-secondary w-full uppercase text-xs tracking-normal">View Digital Receipt</button>
       </div>
    </div>
  );
};

export default PaymentSuccess;
