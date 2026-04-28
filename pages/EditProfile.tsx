import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useNotify } from '../components/Notifications';
import { uploadToImgbb } from '../services/imgbb';
import { motion } from 'framer-motion';
import Icon from '../components/Icon';

const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [updating, setUpdating] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoURL, setPhotoURL] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        setName(auth.currentUser.displayName || '');
        setPhotoURL(auth.currentUser.photoURL || '');
        const d = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (d.exists() && d.data().phone) {
           setPhone(d.data().phone);
        }
      }
    };
    fetchUserData();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setUpdating(true);
    try {
      await updateProfile(auth.currentUser, { displayName: name });
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { displayName: name, phone });
      notify("Profile details updated!", "success");
      navigate('/profile');
    } catch(err) {
      notify("Failed to update profile", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; 
    if (!file || !auth.currentUser) return;
    setUpdating(true);
    try {
        notify("Uploading image...", "info");
        const url = await uploadToImgbb(file);
        await updateProfile(auth.currentUser, { photoURL: url });
        await updateDoc(doc(db, 'users', auth.currentUser.uid), { photoURL: url });
        setPhotoURL(url);
        notify("Profile picture updated!", "success");
    } catch(e) { 
        notify("Image upload failed.", "error"); 
    } finally { 
        setUpdating(false); 
    }
  };

  return (
    <div className="p-6 md:p-12 pb-48 bg-zinc-50 dark:bg-zinc-800 max-w-2xl mx-auto min-h-screen font-inter">
        <div className="flex items-center space-x-6 mb-12">
            <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 rounded-full border border-zinc-100 dark:border-zinc-800 shadow-sm hover:bg-[#06331e] hover:text-white transition-all active:scale-95">
                <Icon name="chevron-left" className="text-sm" />
            </button>
            <div className="flex flex-col">
                <h1 className="text-3xl font-black tracking-tight text-[#06331e] uppercase">Edit Profile</h1>
                <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-[0.3em] mt-1 pr-2">Update your information</p>
            </div>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-8 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <div className="flex flex-col items-center justify-center mb-10">
                <div className="relative mb-4">
                    <motion.div className="w-28 h-28 rounded-full border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-sm bg-zinc-50 dark:bg-zinc-800">
                        <img src={photoURL || `https://ui-avatars.com/api/?name=${name}&background=000&color=fff`} className="w-full h-full object-cover" alt="Profile" />
                    </motion.div>
                    <button 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={updating} 
                        className="absolute bottom-1 right-1 w-8 h-8 bg-[#06331e] text-white rounded-full flex items-center justify-center hover:bg-[#0a4a2b] shadow-md transition-all active:scale-95"
                    >
                        <Icon name="camera" className="text-xs" />
                    </button>
                    <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleImageUpload} />
                </div>
            </div>

            <form onSubmit={handleUpdate} className="space-y-6">
                <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Full Name</label>
                    <input 
                        required 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        type="text" 
                        className="w-full bg-zinc-50 dark:bg-zinc-800 px-5 py-4 rounded-xl outline-none border border-zinc-200 dark:border-zinc-700 focus:border-[#06331e] focus:ring-1 focus:ring-[#06331e] transition-all font-bold text-sm shadow-sm"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Phone Number</label>
                    <input 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)} 
                        type="tel" 
                        placeholder="+880 1..." 
                        className="w-full bg-zinc-50 dark:bg-zinc-800 px-5 py-4 rounded-xl outline-none border border-zinc-200 dark:border-zinc-700 focus:border-[#06331e] focus:ring-1 focus:ring-[#06331e] transition-all font-bold text-sm shadow-sm"
                    />
                </div>
                <div className="pt-4">
                    <button disabled={updating} type="submit" className="w-full py-4 bg-[#06331e] text-white rounded-full font-bold text-xs uppercase tracking-widest shadow-lg shadow-[#06331e]/20 hover:bg-[#0a4a2b] transition-all active:scale-[0.98] disabled:opacity-50">
                        {updating ? 'Saving Changes...' : 'Save Profile Details'}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default EditProfile;
