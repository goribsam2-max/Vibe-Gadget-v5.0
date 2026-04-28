
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotify } from '../components/Notifications';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import Icon from '../components/Icon';

const PasswordManager: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return notify("New passwords do not match", "error");
    }
    if (formData.newPassword.length < 6) {
      return notify("Password must be at least 6 characters", "error");
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error("No active session");

      // Re-authenticate user before password change
      const credential = EmailAuthProvider.credential(user.email, formData.oldPassword);
      await reauthenticateWithCredential(user, credential);
      
      await updatePassword(user, formData.newPassword);
      notify("Password updated successfully!", "success");
      navigate('/settings');
    } catch (err: any) {
      notify(err.message || "Failed to update password", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 animate-fade-in bg-zinc-50 dark:bg-zinc-800 max-w-md mx-auto min-h-screen flex flex-col">
       <div className="flex items-center space-x-4 mb-10">
          <button onClick={() => navigate(-1)} className="p-3 bg-[#f4f4f5] dark:bg-zinc-800/80 rounded-2xl">
             <Icon name="chevron-left" className="text-sm" />
          </button>
          <h1 className="text-xl font-bold">Password Manager</h1>
       </div>

       <form onSubmit={handleChange} className="flex-1 space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Current Password</label>
            <input 
              type="password" 
              className="w-full bg-[#f4f4f5] dark:bg-zinc-800/80 p-5 rounded-[24px] outline-none border border-transparent focus:border-black transition-all"
              required
              value={formData.oldPassword}
              onChange={e => setFormData({...formData, oldPassword: e.target.value})}
            />
          </div>

          <div className="space-y-6 pt-4 border-t border-f-light">
             <div>
               <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">New Password</label>
               <input 
                 type="password" 
                 className="w-full bg-[#f4f4f5] dark:bg-zinc-800/80 p-5 rounded-[24px] outline-none border border-transparent focus:border-black transition-all"
                 required
                 value={formData.newPassword}
                 onChange={e => setFormData({...formData, newPassword: e.target.value})}
               />
             </div>
             <div>
               <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Confirm New Password</label>
               <input 
                 type="password" 
                 className="w-full bg-[#f4f4f5] dark:bg-zinc-800/80 p-5 rounded-[24px] outline-none border border-transparent focus:border-black transition-all"
                 required
                 value={formData.confirmPassword}
                 onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
               />
             </div>
          </div>

          <button 
            disabled={loading}
            className="btn-primary w-full mt-10 shadow-xl shadow-black/10 disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
       </form>
    </div>
  );
};

export default PasswordManager;
