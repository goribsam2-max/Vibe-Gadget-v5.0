import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotify } from '../components/Notifications';
import { collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import SEO from '../components/SEO';
import Icon from '../components/Icon';

const ContactUs: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
       return notify("Please fill all fields", "error");
    }
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'helpdesk'), {
         userId: auth.currentUser?.uid || 'guest',
         userName: formData.name,
         userEmail: formData.email,
         subject: "Contact Us Inquiry",
         message: formData.message,
         status: 'open',
         createdAt: Date.now(),
         updatedAt: Date.now()
      });
      notify("Your message has been sent successfully. We will get back to you soon.", "success");
      setFormData({ name: '', email: '', message: '' });
      
      // Attempt generic mailto fallback if they strictly wanted email forward (but db save is primary)
      // window.location.href = `mailto:vibegadgetfeni@gmail.com?subject=Inquiry from ${formData.name}&body=${formData.message}`;
    } catch(e) {
      notify("Failed to send message", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-12 pb-24 animate-fade-in bg-zinc-50 dark:bg-zinc-800 max-w-2xl mx-auto min-h-screen">
       <SEO title="Contact Us" description="Contact VibeGadget for inquiries, support and help." />
       <div className="flex items-center space-x-6 mb-12">
          <button onClick={() => navigate(-1)} className="p-3.5 bg-zinc-50 dark:bg-zinc-800 rounded-2xl hover:bg-zinc-900 hover:text-white transition-all shadow-sm">
             <Icon name="chevron-left" className="text-sm" />
          </button>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight">Contact Us</h1>
       </div>

       <div className="mb-10 text-zinc-600 dark:text-zinc-400">
          <p>We're here to help. If you have any inquiries regarding your orders or need support, please fill out the form below. As a verified and trusted platform, we ensure your data is secure.</p>
       </div>

       <form onSubmit={handleSubmit} className="space-y-6">
          <div>
             <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Full Name</label>
             <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 font-bold outline-none focus:border-black transition-colors" placeholder="John Doe" />
          </div>
          <div>
             <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Email Address</label>
             <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 font-bold outline-none focus:border-black transition-colors" placeholder="john@example.com" />
          </div>
          <div>
             <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Message</label>
             <textarea value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 font-bold outline-none focus:border-black transition-colors h-40 resize-none" placeholder="How can we help you?"></textarea>
          </div>
          <button disabled={loading} type="submit" className="w-full btn-primary py-4 text-sm shadow-xl shadow-zinc-200 disabled:opacity-50 flex items-center justify-center">
             {loading ? <Icon name="spinner" className="mr-2 animate-spin" /> : null}
             {loading ? "Sending..." : "Send Message"}
          </button>
       </form>
    </div>
  );
};

export default ContactUs;
