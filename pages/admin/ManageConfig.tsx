
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useNotify } from '../../components/Notifications';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../components/Icon';

const ManageConfig: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>('firebase');

  const [configs, setConfigs] = useState({
    firebaseApiKey: "AIzaSyC1vnVFbzezdpqAxjU5GXgAxu63DN05eyE",
    telegramToken: "8236254617:AAFFTI9j4pl6U-8-pdJgZigWb2M75oBmyzg",
    telegramChatId: "5494141897",
    oneSignalAppId: "29c39d8a-7be8-404a-8a33-5616086735fa",
    oneSignalApiKey: "",
    googleClientId: "",
    facebookAppId: "",
    appleServiceId: "",
    googleLogin: true,
    facebookLogin: false,
    appleLogin: false,
    deliveryCharge: 150,
    storeOpen: true,
    mysteryBoxActive: true,
    storeNotice: "",
    dealEndTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    bkashNumber: "01778953114",
    bkashIcon: "https://i.ibb.co.com/8m5LntYV/b-Kash-app-logo.png",
    nagadNumber: "01778953114",
    nagadIcon: "https://i.ibb.co.com/RkG7cbs0/Nagad-Logo-wine.png",
    affiliateMinWithdrawal: 50,
    affiliateTier1Threshold: 3,
    affiliateTier1Commission: 50,
    affiliateTier2Threshold: 10,
    affiliateTier2Commission: 100,
    affiliateTier3Threshold: 20,
    affiliateTier3Commission: 150,
    affiliateTier4Threshold: 30,
    affiliateTier4Commission: 200
  });

  useEffect(() => {
    getDoc(doc(db, 'settings', 'platform')).then((snap) => {
      if (snap.exists()) {
        setConfigs(prev => ({ ...prev, ...snap.data() }));
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'platform'), configs);
      notify("Settings saved successfully", "success");
    } catch (e) {
      notify("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-800">
      <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 pb-48 min-h-screen bg-zinc-50 dark:bg-zinc-800 font-inter">
      <div className="mb-12 flex items-center space-x-6">
        <button onClick={() => navigate('/admin')} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-zinc-900 hover:text-white transition-all">
          <Icon name="arrow-left" className="text-sm" />
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight">App Settings</h1>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Manage Connections and Keys</p>
        </div>
      </div>

      <div className="space-y-4 mb-12">
        <AccordionSection 
          id="firebase" 
          title="Firebase Settings" 
          icon="fire" 
          expanded={expandedSection === 'firebase'} 
          onToggle={() => setExpandedSection(expandedSection === 'firebase' ? null : 'firebase')}
        >
           <Field label="API Key" value={configs.firebaseApiKey} onChange={(v: string) => setConfigs({...configs, firebaseApiKey: v})} />
        </AccordionSection>

        <AccordionSection 
          id="onesignal" 
          title="Notification Settings" 
          icon="bell" 
          expanded={expandedSection === 'onesignal'} 
          onToggle={() => setExpandedSection(expandedSection === 'onesignal' ? null : 'onesignal')}
        >
           <Field label="OneSignal App ID" value={configs.oneSignalAppId} onChange={(v: string) => setConfigs({...configs, oneSignalAppId: v})} />
           <Field label="REST API Key" value={configs.oneSignalApiKey} onChange={(v: string) => setConfigs({...configs, oneSignalApiKey: v})} placeholder="XXXX" />
        </AccordionSection>

        <AccordionSection 
          id="telegram" 
          title="Telegram Alerts" 
          icon="telegram-plane" 
          expanded={expandedSection === 'telegram'} 
          onToggle={() => setExpandedSection(expandedSection === 'telegram' ? null : 'telegram')}
        >
           <Field label="Bot Token" value={configs.telegramToken} onChange={(v: string) => setConfigs({...configs, telegramToken: v})} />
           <Field label="Chat ID" value={configs.telegramChatId} onChange={(v: string) => setConfigs({...configs, telegramChatId: v})} />
        </AccordionSection>

        <AccordionSection 
          id="store" 
          title="Global Store Config" 
          icon="store" 
          expanded={expandedSection === 'store'} 
          onToggle={() => setExpandedSection(expandedSection === 'store' ? null : 'store')}
        >
           <div className="space-y-6">
              <div className="p-5 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <Toggle label="Store Open (Accepting Orders)" active={configs.storeOpen} onToggle={() => setConfigs({...configs, storeOpen: !configs.storeOpen})} />
                {!configs.storeOpen && <p className="text-[10px] uppercase font-bold text-red-500 mt-4 tracking-widest px-1">Orders are currently paused</p>}
              </div>

              <div className="p-5 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <Toggle label="Enable Mystery Box Feature" active={configs.mysteryBoxActive ?? true} onToggle={() => setConfigs({...configs, mysteryBoxActive: !(configs.mysteryBoxActive ?? true)})} />
                <p className="text-[10px] uppercase font-bold text-zinc-500 mt-4 tracking-widest px-1">Controls Mystery Box visibility</p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase mb-2 block tracking-widest">Base Delivery Charge (৳)</label>
                <input 
                    type="number" 
                    value={configs.deliveryCharge || 0}
                    onChange={e => setConfigs({...configs, deliveryCharge: Number(e.target.value)})}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl text-sm font-medium outline-none border border-transparent focus:border-zinc-900 transition-all font-mono" 
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase mb-2 block tracking-widest">Global Store Notice (Optional)</label>
                <textarea 
                    value={configs.storeNotice || ""}
                    onChange={e => setConfigs({...configs, storeNotice: e.target.value})}
                    placeholder="E.g., Expect 2 days delay due to weather." 
                    className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl text-sm font-medium outline-none border border-transparent focus:border-zinc-900 transition-all min-h-[100px]" 
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase mb-2 block tracking-widest">Flash Deal End Time</label>
                <input 
                    type="datetime-local" 
                    value={configs.dealEndTime || ""}
                    onChange={e => setConfigs({...configs, dealEndTime: e.target.value})}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl text-sm font-medium outline-none border border-transparent focus:border-zinc-900 transition-all font-mono" 
                />
              </div>
           </div>
        </AccordionSection>

        <AccordionSection 
          id="payment" 
          title="Payment Settings" 
          icon="credit-card" 
          expanded={expandedSection === 'payment'} 
          onToggle={() => setExpandedSection(expandedSection === 'payment' ? null : 'payment')}
        >
           <div className="space-y-6">
              <Field label="bKash Number" value={configs.bkashNumber} onChange={(v: string) => setConfigs({...configs, bkashNumber: v})} placeholder="017..." />
              <Field label="bKash Icon URL" value={configs.bkashIcon} onChange={(v: string) => setConfigs({...configs, bkashIcon: v})} placeholder="https://..." />
              <Field label="Nagad Number" value={configs.nagadNumber} onChange={(v: string) => setConfigs({...configs, nagadNumber: v})} placeholder="017..." />
              <Field label="Nagad Icon URL" value={configs.nagadIcon} onChange={(v: string) => setConfigs({...configs, nagadIcon: v})} placeholder="https://..." />
           </div>
        </AccordionSection>

        <AccordionSection 
          id="affiliate" 
          title="Affiliate Settings" 
          icon="money-bill-wave" 
          expanded={expandedSection === 'affiliate'} 
          onToggle={() => setExpandedSection(expandedSection === 'affiliate' ? null : 'affiliate')}
        >
           <div className="space-y-4">
               <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase mb-2 block tracking-widest">Minimum Withdrawal (৳)</label>
                  <input type="number" value={configs.affiliateMinWithdrawal ?? 50} onChange={e => setConfigs({...configs, affiliateMinWithdrawal: Number(e.target.value)})} className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl text-sm font-medium outline-none border border-transparent focus:border-zinc-900 transition-all font-mono" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                   <div><label className="text-[10px] font-bold text-zinc-400 uppercase mb-2 block tracking-widest">T1 Target</label><input type="number" value={configs.affiliateTier1Threshold ?? 3} onChange={e => setConfigs({...configs, affiliateTier1Threshold: Number(e.target.value)})} className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl text-sm font-mono" /></div>
                   <div><label className="text-[10px] font-bold text-zinc-400 uppercase mb-2 block tracking-widest">T1 Commission (৳)</label><input type="number" value={configs.affiliateTier1Commission ?? 50} onChange={e => setConfigs({...configs, affiliateTier1Commission: Number(e.target.value)})} className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl text-sm font-mono" /></div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                   <div><label className="text-[10px] font-bold text-zinc-400 uppercase mb-2 block tracking-widest">T2 Target</label><input type="number" value={configs.affiliateTier2Threshold ?? 10} onChange={e => setConfigs({...configs, affiliateTier2Threshold: Number(e.target.value)})} className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl text-sm font-mono" /></div>
                   <div><label className="text-[10px] font-bold text-zinc-400 uppercase mb-2 block tracking-widest">T2 Commission (৳)</label><input type="number" value={configs.affiliateTier2Commission ?? 100} onChange={e => setConfigs({...configs, affiliateTier2Commission: Number(e.target.value)})} className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl text-sm font-mono" /></div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                   <div><label className="text-[10px] font-bold text-zinc-400 uppercase mb-2 block tracking-widest">T3 Target</label><input type="number" value={configs.affiliateTier3Threshold ?? 20} onChange={e => setConfigs({...configs, affiliateTier3Threshold: Number(e.target.value)})} className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl text-sm font-mono" /></div>
                   <div><label className="text-[10px] font-bold text-zinc-400 uppercase mb-2 block tracking-widest">T3 Commission (৳)</label><input type="number" value={configs.affiliateTier3Commission ?? 150} onChange={e => setConfigs({...configs, affiliateTier3Commission: Number(e.target.value)})} className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl text-sm font-mono" /></div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                   <div><label className="text-[10px] font-bold text-zinc-400 uppercase mb-2 block tracking-widest">T4 Target</label><input type="number" value={configs.affiliateTier4Threshold ?? 30} onChange={e => setConfigs({...configs, affiliateTier4Threshold: Number(e.target.value)})} className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl text-sm font-mono" /></div>
                   <div><label className="text-[10px] font-bold text-zinc-400 uppercase mb-2 block tracking-widest">T4 Commission (৳)</label><input type="number" value={configs.affiliateTier4Commission ?? 200} onChange={e => setConfigs({...configs, affiliateTier4Commission: Number(e.target.value)})} className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl text-sm font-mono" /></div>
               </div>
           </div>
        </AccordionSection>

        <AccordionSection 
          id="auth" 
          title="Login Options" 
          icon="key" 
          expanded={expandedSection === 'auth'} 
          onToggle={() => setExpandedSection(expandedSection === 'auth' ? null : 'auth')}
        >
           <div className="space-y-8">
              <div className="p-5 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <Toggle label="Google Login" active={configs.googleLogin} onToggle={() => setConfigs({...configs, googleLogin: !configs.googleLogin})} />
                {configs.googleLogin && <div className="mt-4"><Field label="Google Client ID" value={configs.googleClientId} onChange={(v: string) => setConfigs({...configs, googleClientId: v})} placeholder="apps.googleusercontent.com" /></div>}
              </div>
              <div className="p-5 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <Toggle label="Facebook Login" active={configs.facebookLogin} onToggle={() => setConfigs({...configs, facebookLogin: !configs.facebookLogin})} />
                {configs.facebookLogin && <div className="mt-4"><Field label="Facebook App ID" value={configs.facebookAppId} onChange={(v: string) => setConfigs({...configs, facebookAppId: v})} /></div>}
              </div>
              <div className="p-5 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <Toggle label="Apple Login" active={configs.appleLogin} onToggle={() => setConfigs({...configs, appleLogin: !configs.appleLogin})} />
                {configs.appleLogin && <div className="mt-4"><Field label="Apple Service ID" value={configs.appleServiceId} onChange={(v: string) => setConfigs({...configs, appleServiceId: v})} /></div>}
              </div>
           </div>
        </AccordionSection>
      </div>

      <button 
        disabled={saving}
        onClick={handleSave}
        className="w-full py-5 bg-zinc-900 dark:bg-zinc-50 dark:text-black text-white rounded-2xl font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save All Settings'}
      </button>
    </div>
  );
};

const AccordionSection = ({ title, icon, children, expanded, onToggle }: any) => (
  <div className="border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden bg-zinc-50 dark:bg-zinc-800">
    <button onClick={onToggle} className="w-full px-6 py-5 flex items-center justify-between hover:bg-zinc-50 dark:bg-zinc-800 transition-colors">
      <div className="flex items-center space-x-4">
        <Icon name={icon as any} className="text-zinc-400 w-5" />
        <span className="text-sm font-bold">{title}</span>
      </div>
      <Icon name="chevron-down" className={`text-[10px] transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
    </button>
    <AnimatePresence>
      {expanded && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="px-6 pb-6 pt-2 space-y-6">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const Field = ({ label, value, onChange, placeholder }: any) => (
  <div>
     <label className="text-[10px] font-bold text-zinc-400 uppercase mb-2 block tracking-widest">{label}</label>
     <input 
        type="text" 
        value={value || ""}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder} 
        className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl text-sm font-medium outline-none border border-transparent focus:border-zinc-900 transition-all" 
     />
  </div>
);

const Toggle = ({ label, active, onToggle }: any) => (
  <div className="flex justify-between items-center">
     <span className="text-xs font-bold">{label}</span>
     <div 
        onClick={onToggle}
        className={`w-12 h-7 rounded-full transition-all relative cursor-pointer p-1 ${active ? 'bg-zinc-900' : 'bg-zinc-200'}`}
     >
        <motion.div 
            animate={{ x: active ? 20 : 0 }}
            className="w-5 h-5 bg-zinc-50 dark:bg-zinc-800 rounded-full shadow-sm"
        />
     </div>
  </div>
);

export default ManageConfig;
