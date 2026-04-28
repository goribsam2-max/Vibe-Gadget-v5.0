
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNotify } from '../components/Notifications';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../components/Icon';

const HelpCenter: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const [activeTab, setActiveTab] = useState('FAQ');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const [ticketMode, setTicketMode] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: '', message: '' });

  const faqs = [
    { q: 'How do I track my gadget delivery?', a: 'You can track your order in the "Purchase History" section of your profile. Once shipped, a tracking ID will be visible.' },
    { q: 'What is the warranty on Vibe products?', a: 'Most accessories come with a 6-month replacement warranty. Gadgets like smartwatches have a 1-year brand warranty.' },
    { q: 'How do I pay via bKash/Nagad?', a: 'During checkout, select your preferred provider. You can choose to pay the delivery charge in advance or the full amount.' },
    { q: 'Can I return an accessory if it doesn\'t fit?', a: 'Yes, we have a 3-day return policy if the product is in its original packaging and unused.' },
    { q: 'Is cash on delivery available?', a: 'Yes, we offer COD nationwide. However, for some high-value gadgets, a small partial payment might be required.' }
  ];

  const contactOptions = [
    { label: 'Customer Hotline', icon: 'phone-alt', action: () => window.open('tel:01747708843') },
    { label: 'WhatsApp Support', icon: 'whatsapp', action: () => window.open('https://wa.me/8801747708843') },
    { label: 'Vibe Facebook Page', icon: 'facebook-f', action: () => window.open('https://facebook.com') }
  ];

  const submitTicket = async (e: React.FormEvent) => {
     e.preventDefault();
     if(!auth.currentUser) {
        notify("Please login to submit a ticket", "error");
        navigate('/auth-selector');
        return;
     }

     if (!ticketForm.subject || !ticketForm.message) return;

     try {
        await addDoc(collection(db, 'helpdesk'), {
           userId: auth.currentUser.uid,
           userName: auth.currentUser.displayName || 'User',
           userEmail: auth.currentUser.email || '',
           subject: ticketForm.subject,
           message: ticketForm.message,
           status: 'Open',
           createdAt: Date.now()
        });
        notify("Ticket submitted successfully", "success");
        setTicketForm({ subject: '', message: '' });
        setTicketMode(false);
     } catch (err) {
        notify("Failed to submit ticket", "error");
     }
  };

  return (
    <div className="p-6 md:p-12 pb-48 animate-fade-in bg-zinc-50 dark:bg-zinc-800 max-w-3xl mx-auto min-h-screen font-inter">
       <div className="flex items-center space-x-6 mb-12">
          <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[#06331e] rounded-full shadow-sm hover:bg-[#06331e] hover:text-white transition-all active:scale-95">
             <Icon name="chevron-left" className="text-xs" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-[#06331e] mb-1.5">{ticketMode ? 'Submit Ticket' : 'Support Desk'}</h1>
            <p className="text-zinc-400 text-[10px] md:text-xs font-bold tracking-widest uppercase">{ticketMode ? 'Describe your issue' : 'Help & Contact'}</p>
          </div>
       </div>

       <AnimatePresence mode="wait">
       {!ticketMode ? (
           <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <div className="flex bg-zinc-50 dark:bg-zinc-800 p-1.5 rounded-full mb-12 border border-zinc-100 dark:border-zinc-800 shadow-sm max-w-sm">
                  {['FAQ', 'Contact'].map(tab => (
                     <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold rounded-full transition-all ${activeTab === tab ? 'bg-[#06331e] text-white shadow-md' : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-400'}`}
                     >
                        {tab}
                     </button>
                  ))}
               </div>

               {activeTab === 'FAQ' ? (
                 <div className="space-y-4">
                    {faqs.map((faq, i) => (
                       <div key={i} className="border border-zinc-100 dark:border-zinc-800 rounded-3xl overflow-hidden transition-all bg-zinc-50 dark:bg-zinc-800/50 shadow-sm hover:border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:bg-zinc-800 group cursor-pointer" onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}>
                          <button className="w-full p-6 flex justify-between items-center text-left">
                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 pr-8 leading-relaxed tracking-tight group-hover:text-[#06331e] transition-colors">{faq.q}</span>
                            <Icon name="chevron-down" className={`text-[10px] text-zinc-300 transition-transform duration-300 ${expandedFaq === i ? 'rotate-180 text-[#06331e]' : ''}`} />
                          </button>
                          <div className={`px-6 transition-all duration-300 overflow-hidden ${expandedFaq === i ? 'pb-6 max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                            <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">{faq.a}</p>
                          </div>
                       </div>
                    ))}
                 </div>
               ) : (
                 <div className="space-y-4">
                    {contactOptions.map((opt, i) => (
                       <button 
                          key={i} 
                          onClick={opt.action}
                          className="w-full p-4 px-6 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-full hover:shadow-sm hover:bg-zinc-50 dark:bg-zinc-800 hover:border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 transition-all flex items-center justify-between group cursor-pointer active:scale-95"
                       >
                          <div className="flex items-center space-x-4">
                             <Icon name={opt.icon} className="w-6 text-center text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                             <span className="font-bold text-sm uppercase tracking-widest text-zinc-700 dark:text-zinc-300 group-hover:text-[#06331e] transition-colors">{opt.label}</span>
                          </div>
                          <Icon name="chevron-right" className="text-[10px] text-zinc-300 group-hover:text-[#06331e] transition-colors" />
                       </button>
                    ))}
                    <div className="h-4"></div>
                    <button 
                       onClick={() => setTicketMode(true)}
                       className="w-full p-6 bg-[#06331e] rounded-3xl text-white font-bold uppercase tracking-widest text-xs flex flex-col items-center justify-center hover:bg-emerald-900 transition-colors shadow-lg shadow-[#06331e]/20"
                    >
                       <Icon name="ticket-alt" className="text-2xl mb-3 text-emerald-400" />
                       Open Support Ticket
                       <span className="text-[9px] font-normal opacity-70 mt-1 capitalize tracking-normal">Our team will respond within 24 hours</span>
                    </button>
                 </div>
               )}
           </motion.div>
       ) : (
           <motion.div key="ticket" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
               <form onSubmit={submitTicket} className="space-y-6">
                   <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-widest mb-3">Issue Subject</label>
                      <input 
                         type="text" 
                         required
                         value={ticketForm.subject}
                         onChange={e => setTicketForm({...ticketForm, subject: e.target.value})}
                         className="w-full p-5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:border-[#06331e] focus:bg-zinc-50 dark:bg-zinc-800 transition-all text-sm font-bold text-zinc-900 dark:text-zinc-100"
                         placeholder="e.g. Order #1234 delivery delay"
                      />
                   </div>
                   <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-widest mb-3">Message</label>
                      <textarea 
                         required
                         value={ticketForm.message}
                         onChange={e => setTicketForm({...ticketForm, message: e.target.value})}
                         className="w-full p-5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl h-40 focus:border-[#06331e] focus:bg-zinc-50 dark:bg-zinc-800 transition-all text-sm font-medium text-zinc-800 dark:text-zinc-200"
                         placeholder="Describe your issue in detail..."
                      />
                   </div>
                   <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setTicketMode(false)} className="flex-1 p-5 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-500 font-bold uppercase text-[10px] tracking-widest hover:bg-zinc-50 dark:bg-zinc-800 transition-colors">
                         Cancel
                      </button>
                      <button type="submit" className="flex-[2] p-5 rounded-full bg-[#06331e] text-white font-bold uppercase text-[10px] tracking-widest shadow-xl hover:bg-emerald-900 transition-colors">
                         Submit Ticket
                      </button>
                   </div>
               </form>
           </motion.div>
       )}
       </AnimatePresence>
    </div>
  );
};

export default HelpCenter;
