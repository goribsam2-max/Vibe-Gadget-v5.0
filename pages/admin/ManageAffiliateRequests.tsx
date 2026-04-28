import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDoc, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import Icon from '../../components/Icon';
import { useNavigate } from 'react-router-dom';
import { useNotify } from '../../components/Notifications';
import { AffiliateRequest } from '../../types';

const ManageAffiliateRequests: React.FC = () => {
  const [requests, setRequests] = useState<AffiliateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const notify = useNotify();

  useEffect(() => {
    const q = query(collection(db, 'affiliate_requests'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AffiliateRequest)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const updateStatus = async (request: AffiliateRequest, newStatus: 'approved' | 'rejected') => {
     try {
       await updateDoc(doc(db, 'affiliate_requests', request.id!), { status: newStatus });
       
       if (newStatus === 'approved') {
          const namePart = request.fullName.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '');
          const generatedCode = namePart.length >= 2 ? `AFF-${namePart}` : `AFF-${request.userId.substring(0, 6).toUpperCase()}`;
          const userRef = doc(db, 'users', request.userId);
          const uDoc = await getDoc(userRef);
          
          await updateDoc(userRef, {
             isAffiliate: true,
             affiliateStatus: 'approved',
             affiliateCode: uDoc.data()?.affiliateCode || generatedCode,
             walletBalance: uDoc.data()?.walletBalance || 0
          });
          
          if (!uDoc.data()?.affiliateCode) {
              await addDoc(collection(db, 'coupons'), {
                 code: generatedCode,
                 discount: 5,
                 type: 'percent',
                 maxUses: 999999,
                 usedCount: 0,
                 isActive: true,
                 isAffiliate: true,
                 affiliateId: request.userId,
                 createdAt: Date.now()
              });
          }
          
          await addDoc(collection(db, 'notifications'), {
             userId: request.userId,
             title: 'Affiliate Application Approved',
             message: 'Congratulations! Your affiliate application has been approved. You can now start sharing your custom promo code to earn rewards.',
             isRead: false,
             createdAt: Date.now(),
             type: 'system'
          });
       } else {
          // rejected
          await updateDoc(doc(db, 'users', request.userId), {
             isAffiliate: false,
             affiliateStatus: 'rejected'
          });
          
          await addDoc(collection(db, 'notifications'), {
             userId: request.userId,
             title: 'Affiliate Application Rejected',
             message: 'Unfortunately, your affiliate application was not approved at this time.',
             isRead: false,
             createdAt: Date.now(),
             type: 'system'
          });
       }
       notify(`Application ${newStatus}`, "success");
     } catch(e) {
       notify("Failed to update application status", "error");
     }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-10 min-h-screen">
      <div className="flex items-center space-x-6 mb-10">
        <button onClick={() => navigate('/admin')} className="w-10 h-10 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full hover:bg-zinc-900 hover:text-white transition-all"><Icon name="arrow-left" /></button>
        <div>
           <h1 className="text-2xl font-black tracking-tight mb-1">Affiliate Applications</h1>
           <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Review and approve requests</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {requests.map(req => (
            <div key={req.id} className="bg-zinc-50 dark:bg-zinc-800 p-6 md:p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-700 shadow-sm flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                   <div className="flex items-center justify-between mb-4">
                     <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : req.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{req.status}</span>
                     <span className="text-[10px] font-bold text-zinc-400 uppercase">{new Date(req.createdAt).toLocaleDateString()}</span>
                   </div>
                   <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-4 tracking-tighter">{req.fullName}</h3>
                   <div className="space-y-3 mb-6 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                     <p className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-2"><Icon name="envelope" className="text-zinc-400"/> <span className="text-black dark:text-white">{req.email}</span></p>
                     <p className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-2"><Icon name="phone" className="text-zinc-400"/> <span className="text-black dark:text-white">{req.phone}</span></p>
                     {req.socialUrl && (
                        <p className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-2"><Icon name="link" className="text-zinc-400"/> <a href={req.socialUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{req.socialUrl}</a></p>
                     )}
                   </div>
                </div>
                
                {req.status === 'pending' && (
                  <div className="flex flex-col gap-3 justify-center border-t md:border-t-0 md:border-l border-zinc-200 dark:border-zinc-700 pt-6 md:pt-0 md:pl-6">
                    <button onClick={() => updateStatus(req, 'approved')} className="w-full bg-[#06331e] text-white text-[10px] font-black tracking-widest py-4 px-8 rounded-xl uppercase hover:bg-emerald-800 transition-colors shadow-lg active:scale-95">Approve</button>
                    <button onClick={() => updateStatus(req, 'rejected')} className="w-full bg-red-50 text-red-600 text-[10px] font-black tracking-widest py-4 px-8 rounded-xl uppercase hover:bg-red-100 transition-colors active:scale-95">Reject</button>
                  </div>
                )}
            </div>
         ))}
         {requests.length === 0 && (
             <div className="col-span-full py-20 text-center text-zinc-400 font-bold uppercase tracking-widest bg-zinc-50 dark:bg-zinc-800 rounded-3xl border border-zinc-200 dark:border-zinc-700">No applications found.</div>
         )}
      </div>
    </div>
  );
};
export default ManageAffiliateRequests;
