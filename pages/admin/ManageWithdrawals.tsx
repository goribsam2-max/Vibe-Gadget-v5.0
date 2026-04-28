import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { WithdrawRequest } from '../../types';
import Icon from '../../components/Icon';
import { useNavigate } from 'react-router-dom';
import { useNotify } from '../../components/Notifications';

const ManageWithdrawals: React.FC = () => {
  const [requests, setRequests] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const notify = useNotify();

  useEffect(() => {
    const q = query(collection(db, 'withdrawals'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithdrawRequest)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const updateStatus = async (id: string, status: 'Pending' | 'Completed' | 'Rejected') => {
     try {
       await updateDoc(doc(db, 'withdrawals', id), { status });
       notify(`Status updated to ${status}`, "success");
     } catch(e) {
       notify("Failed to update", "error");
     }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-10 min-h-screen">
      <div className="flex items-center space-x-6 mb-10">
        <button onClick={() => navigate('/admin')} className="w-10 h-10 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full hover:bg-zinc-900 hover:text-white transition-all"><Icon name="arrow-left" /></button>
        <div>
           <h1 className="text-2xl font-black tracking-tight mb-1">Manage Withdrawals</h1>
           <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Affiliate payout requests</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {requests.map(req => (
            <div key={req.id} className="bg-zinc-50 dark:bg-zinc-800 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-700">
               <div className="flex items-center justify-between mb-4">
                 <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${req.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : req.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{req.status}</span>
                 <span className="text-[10px] font-bold text-zinc-400 uppercase">{new Date(req.createdAt).toLocaleDateString()}</span>
               </div>
               <h3 className="text-3xl font-black text-emerald-600 mb-4">৳{req.amount}</h3>
               <div className="space-y-1 mb-6">
                 <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Name: <span className="text-black dark:text-white">{req.accountName}</span></p>
                 <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400">bKash: <span className="text-black dark:text-white">{req.bkashNumber}</span></p>
               </div>
               
               {req.status === 'Pending' && (
                 <div className="flex space-x-2">
                   <button onClick={() => updateStatus(req.id, 'Completed')} className="flex-1 bg-zinc-900 dark:bg-zinc-50 dark:text-black text-white text-[10px] font-bold py-2 rounded-lg uppercase">Complete</button>
                   <button onClick={() => updateStatus(req.id, 'Rejected')} className="flex-1 bg-red-50 text-red-600 text-[10px] font-bold py-2 rounded-lg uppercase">Reject</button>
                 </div>
               )}
            </div>
         ))}
      </div>
    </div>
  );
};
export default ManageWithdrawals;
