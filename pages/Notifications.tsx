
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Notification, UserProfile } from '../types';
import { useNavigate, Link } from 'react-router-dom';
import Icon from '../components/Icon';

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      if (!auth.currentUser) return;
      const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (snap.exists()) setUserProfile(snap.data() as UserProfile);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!auth.currentUser || !userProfile) return;
    
    // Query notifications
    const q = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allNotifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      
      // Filter logic:
      // 1. Must be targeted to the user OR be a broadcast ('all')
      // 2. Must be created AFTER the user's registration date
      const filtered = allNotifs.filter(n => {
        const isTargeted = n.userId === auth.currentUser?.uid || n.userId === 'all';
        const isFresh = n.createdAt > (userProfile.registrationDate || userProfile.createdAt);
        return isTargeted && isFresh;
      });

      setNotifications(filtered);
      setLoading(false);
    });

    return unsubscribe;
  }, [userProfile]);

  const markAsRead = async (notif: Notification) => {
    if (!notif.isRead && notif.id) {
       try {
         await updateDoc(doc(db, 'notifications', notif.id), { isRead: true });
       } catch (e) {
         console.warn("Could not mark notif as read");
       }
    }
    if (notif.link) {
       navigate(notif.link);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 pb-32 min-h-screen bg-zinc-50 dark:bg-zinc-800 font-inter">
      <div className="flex items-center space-x-6 mb-12">
        <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[#06331e] rounded-full shadow-sm hover:bg-[#06331e] hover:text-white transition-all active:scale-95">
          <Icon name="chevron-left" className="text-xs" />
        </button>
        <div>
           <h1 className="text-xl md:text-2xl font-black tracking-tight text-[#06331e] mb-1.5">System Alerts</h1>
           <p className="text-zinc-400 text-[10px] md:text-xs font-bold tracking-widest uppercase">Admin Broadcasts & Updates</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-32"><div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></div></div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-32 flex flex-col items-center">
          <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-full flex items-center justify-center mb-6">
             <Icon name="bell-slash" className="text-xl text-zinc-300" />
          </div>
          <p className="text-xs font-bold tracking-widest uppercase text-zinc-400">No Alerts for You</p>
          <p className="text-[10px] mt-2 font-medium text-zinc-400">New alerts will appear here after they are sent.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map(notif => (
            <div 
              key={notif.id} 
              onClick={() => notif.link && markAsRead(notif)}
              className={`bg-zinc-50 dark:bg-zinc-800 p-6 md:p-8 rounded-[2rem] border transition-all flex flex-col md:flex-row gap-6 ${notif.link ? 'cursor-pointer hover:bg-zinc-50 dark:bg-zinc-800 hover:border-emerald-200 hover:shadow-md' : 'hover:bg-zinc-50 dark:bg-zinc-800 hover:border-zinc-200 dark:border-zinc-700'} ${notif.isRead === false ? 'border-emerald-200 bg-emerald-50/30' : 'border-zinc-100 dark:border-zinc-800/50 shadow-sm'}`}
            >
              {notif.type === 'ticket' ? (
                // Pill Shape for Ticket Notification
                <div className="w-full flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200">
                      <Icon name="ticket-alt" className="text-xl text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">{notif.title}</h3>
                        {!notif.isRead && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                      </div>
                      <p className="text-[11px] text-zinc-500 font-medium">{notif.message}</p>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-2">
                         {new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {notif.link && (
                    <button className="sm:w-auto w-full px-6 py-2.5 bg-zinc-900 hover:bg-zinc-900 text-white text-[10px] uppercase font-bold tracking-widest rounded-full transition-colors whitespace-nowrap">
                      Open Ticket
                    </button>
                  )}
                </div>
              ) : (
                // Standard Notification
                <>
                  {notif.image && (
                    <div className="w-full md:w-48 h-32 md:h-auto rounded-2xl overflow-hidden shadow-sm border border-zinc-100 dark:border-zinc-800 shrink-0">
                       <img src={notif.image} className="w-full h-full object-cover" alt="" />
                    </div>
                  )}
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 pr-2">{notif.title}</h3>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest shrink-0 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800 px-3 py-1 rounded-full">{new Date(notif.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed font-medium">{notif.message}</p>
                    {notif.link && (
                       <button className="mt-4 px-6 py-2 bg-zinc-900 hover:bg-zinc-900 text-white text-[10px] uppercase font-bold tracking-widest rounded-full transition-colors w-fit">
                         View Details
                       </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      <p className="mt-16 text-[9px] text-center text-zinc-300 font-bold uppercase tracking-[0.3em]">Vibegadget all rights reserved</p>
    </div>
  );
};

export default NotificationsPage;
