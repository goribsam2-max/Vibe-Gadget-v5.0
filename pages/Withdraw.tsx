import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, updateDoc, collection, addDoc, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { UserProfile } from '../types';
import Icon from '../components/Icon';
import { useNotify } from '../components/Notifications';

const WithdrawPage: React.FC<{ userData: UserProfile | null }> = ({ userData }) => {
  const navigate = useNavigate();
  const notify = useNotify();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bkashNumber, setBkashNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [configs, setConfigs] = useState<any>(null);

  useEffect(() => {
    // Fetch configs
    import('firebase/firestore').then(({ getDoc, doc }) => {
       getDoc(doc(db, 'settings', 'platform')).then(snap => {
          if (snap.exists()) setConfigs(snap.data());
       });
    });

    if (!userData) {
      if (!auth.currentUser) navigate('/auth-selector');
      return;
    }

    const unsub = onSnapshot(query(collection(db, 'withdrawals'), where('userId', '==', userData.uid), orderBy('createdAt', 'desc')), (snapshot) => {
        const list: any[] = [];
        snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        setWithdrawals(list);
    });

    return () => unsub();
  }, [userData, navigate]);

  const handleWithdraw = async () => {
    if (!userData) return;
    const amount = Number(withdrawAmount);
    const minWithdrawal = configs?.affiliateMinWithdrawal ?? 50;
    
    if (!amount || amount < minWithdrawal) return notify(`Minimum withdraw is ৳${minWithdrawal}`, "error");
    if (amount > (userData.walletBalance || 0)) return notify("Insufficient balance", "error");
    if (!bkashNumber || bkashNumber.length < 11) return notify("Enter valid bKash number", "error");
    if (!accountName) return notify("Enter account name", "error");

    setSubmittingWithdraw(true);
    try {
       await addDoc(collection(db, 'withdrawals'), {
         userId: userData.uid,
         amount,
         bkashNumber,
         accountName,
         status: 'Pending',
         createdAt: Date.now()
       });
       await updateDoc(doc(db, 'users', userData.uid), {
          walletBalance: (userData.walletBalance || 0) - amount
       });
       notify("Withdraw request submitted successfully", "success");
       setWithdrawAmount('');
       setBkashNumber('');
       setAccountName('');
    } catch(e) {
       notify("Failed to submit request", "error");
    }
    setSubmittingWithdraw(false);
  };

  if (!userData) return <div className="min-h-screen flex items-center justify-center"><Icon name="spinner-third" className="animate-spin text-3xl" /></div>;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 min-h-screen font-inter bg-zinc-50 dark:bg-[#121212] pb-32">
      <div className="flex items-center space-x-4 mb-8">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-full transition-colors shadow-sm">
          <Icon name="arrow-left" className="text-xs" />
        </button>
        <h1 className="text-2xl font-black tracking-tight uppercase text-zinc-900 dark:text-zinc-100">Withdraw Funds</h1>
      </div>

      <div className="bg-gradient-to-br from-[#06331e] to-emerald-900 text-white p-8 md:p-10 rounded-[2rem] relative overflow-hidden shadow-lg shadow-emerald-900/20 mb-8">
         <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4 pointer-events-none">
           <Icon name="wallet" className="text-[12rem]" />
         </div>
         <div className="flex items-center space-x-2 text-emerald-300 mb-2">
           <Icon name="wallet" className="text-sm" />
           <p className="text-[10px] font-bold uppercase tracking-widest">Available Balance</p>
         </div>
         <h2 className="text-5xl md:text-6xl font-black tracking-tighter relative z-10 truncate">৳{userData.walletBalance || 0}</h2>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2rem] shadow-sm mb-10">
         <div className="flex items-center space-x-3 text-zinc-900 dark:text-zinc-100 font-black tracking-tight mb-6">
            <Icon name="money-bill-wave" className="text-emerald-500 text-lg" />
            <span>Request Withdrawal</span>
         </div>
         <div className="space-y-5 mb-8">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Amount (Min ৳{configs?.affiliateMinWithdrawal ?? 50})</label>
              <div className="relative">
                 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">৳</div>
                 <input type="number" min={configs?.affiliateMinWithdrawal ?? 50} value={withdrawAmount} onChange={e=>setWithdrawAmount(e.target.value)} placeholder="0" className="w-full bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-700/50 pl-10 pr-4 py-4 rounded-xl outline-none font-black text-xl text-zinc-900 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               <div>
                 <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">bKash Number</label>
                 <input type="text" value={bkashNumber} onChange={e=>setBkashNumber(e.target.value)} placeholder="01XXX..." className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-4 py-4 rounded-xl outline-none font-bold text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors" />
               </div>
               <div>
                 <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Account Name</label>
                 <input type="text" value={accountName} onChange={e=>setAccountName(e.target.value)} placeholder="e.g. John Doe" className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-4 py-4 rounded-xl outline-none font-bold text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors" />
               </div>
            </div>
         </div>
         <button onClick={handleWithdraw} disabled={submittingWithdraw} className="w-full bg-[#06331e] text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg hover:bg-emerald-950 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center">
            {submittingWithdraw ? <Icon name="spinner-third" className="animate-spin text-lg" /> : 'Submit Request'}
         </button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Withdrawal History</h3>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{withdrawals.length} total</span>
        </div>

        {withdrawals.length === 0 ? (
           <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-[2rem] border border-dashed border-zinc-200 dark:border-zinc-800">
              <Icon name="history" className="text-3xl text-zinc-300 dark:text-zinc-700 mb-4" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">No withdrawals yet</p>
           </div>
        ) : (
           <div className="bg-white dark:bg-zinc-900 p-2 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col gap-1.5">
              {withdrawals.map(w => (
                 <div key={w.id} className="flex items-center justify-between py-2 px-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                    <div className="flex items-center overflow-hidden pr-3">
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mr-3 hidden sm:flex ${w.status === 'Completed' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : w.status === 'Rejected' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                          <Icon name={w.status === 'Completed' ? 'check' : w.status === 'Rejected' ? 'times' : 'clock'} className="text-xs" />
                       </div>
                       <div className="truncate">
                          <div className="flex items-center space-x-2 pb-0.5">
                             <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate">{w.bkashNumber}</span>
                             <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${w.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : w.status === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'}`}>{w.status}</span>
                          </div>
                          <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-widest">{new Date(w.createdAt).toLocaleString()}</p>
                       </div>
                    </div>
                    <div className="shrink-0">
                       <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-zinc-900 dark:text-zinc-100 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                         ৳ {w.amount}
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawPage;
