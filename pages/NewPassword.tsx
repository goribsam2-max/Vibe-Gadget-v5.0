
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '../firebase';
import { useNotify } from '../components/Notifications';
import Icon from '../components/Icon';
import { getFriendlyErrorMessage } from '../lib/firebaseErrorMapper';
import SEO from '../components/SEO';

const NewPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const notify = useNotify();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [oobCode, setOobCode] = useState('');

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const code = queryParams.get('oobCode');
    const mode = queryParams.get('mode');

    if (mode === 'resetPassword' && code) {
      setOobCode(code);
      verifyPasswordResetCode(auth, code).then((email) => {
        setEmail(email);
      }).catch((error) => {
        notify("Invalid or expired reset link. Please try resetting your password again.", "error");
        navigate('/signin');
      });
    } else {
      notify("Invalid reset link.", "error");
      navigate('/signin');
    }
  }, [location, notify, navigate]);

  const handleReset = async () => {
    if (!password) return notify("Please enter a new password", "error");
    if (password !== confirm) return notify("Passwords do not match", "error");
    if (password.length < 6) return notify("Password must be at least 6 characters", "error");

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      notify("Password reset successful! You can now sign in.", "success");
      navigate('/signin');
    } catch (error: any) {
      notify(getFriendlyErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  if (!email) return <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-800"><Icon name="spinner" className="animate-spin text-4xl text-emerald-600" /></div>;

  return (
    <div className="p-6 md:p-12 pb-24 animate-fade-in bg-zinc-50 dark:bg-zinc-800 max-w-xl mx-auto min-h-screen font-inter">
       <SEO title="Reset Password" description="Create a new password for your VibeGadget account." />
       <div className="flex items-center space-x-6 mb-12">
          <button onClick={() => navigate('/signin')} className="p-3.5 bg-zinc-50 dark:bg-zinc-800 rounded-2xl hover:bg-zinc-900 hover:text-white transition-all shadow-sm">
             <Icon name="chevron-left" className="text-sm" />
          </button>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">New Password</h1>
       </div>
       
       <div className="flex-1">
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-10 leading-relaxed font-medium">Create a new password for <strong className="text-black dark:text-white">{email}</strong>. It must be different from previously used passwords.</p>
          
          <div className="space-y-6">
             <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">New Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••••" className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 font-bold outline-none focus:border-black transition-colors" />
             </div>
             <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Confirm Password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••••••" className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 font-bold outline-none focus:border-black transition-colors" />
             </div>
          </div>
       </div>

       <button disabled={loading} onClick={handleReset} className="btn-primary w-full py-4 shadow-xl shadow-zinc-200 mt-12 disabled:opacity-50 flex items-center justify-center text-sm">
          {loading ? <Icon name="spinner" className="mr-2 animate-spin" /> : null}
          {loading ? "Resetting..." : "Create New Password"}
       </button>
    </div>
  );
};

export default NewPassword;
