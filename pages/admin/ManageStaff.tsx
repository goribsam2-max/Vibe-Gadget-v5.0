import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useNotify } from '../../components/Notifications';
import { motion } from 'framer-motion';
import Icon from '../../components/Icon';

const ManageStaff: React.FC = () => {
    const navigate = useNavigate();
    const notify = useNotify();
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    
    // RBAC Permissions List
    const ALL_MODULES = [
       { id: 'products', name: 'Products Catalog' },
       { id: 'orders', name: 'Order Management' },
       { id: 'users', name: 'User Database' },
       { id: 'coupons', name: 'Coupons & Promos' },
       { id: 'helpdesk', name: 'Help Desk' },
       { id: 'refunds', name: 'Refunds' },
       { id: 'banners', name: 'Banners' }
    ];

    const [form, setForm] = useState({
       email: '',
       roleName: 'Support Agent',
       permissions: ['helpdesk'] as string[]
    });

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, 'staff'));
            setStaff(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleTogglePermission = (modId: string) => {
        if(form.permissions.includes(modId)) {
            setForm({...form, permissions: form.permissions.filter(p => p !== modId)});
        } else {
            setForm({...form, permissions: [...form.permissions, modId]});
        }
    };

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!form.email) return;

        try {
            // Use email as doc ID for easy lookup during login/RBAC checks
            const staffId = form.email.toLowerCase().trim();
            await setDoc(doc(db, 'staff', staffId), {
                email: form.email,
                roleName: form.roleName,
                permissions: form.permissions,
                createdAt: Date.now(),
                isActive: true
            });
            notify(`Staff role added for ${form.email}`, 'success');
            setShowAdd(false);
            setForm({ email: '', roleName: 'Support Agent', permissions: ['helpdesk'] });
            fetchStaff();
        } catch (err) {
            notify('Error adding staff', 'error');
        }
    };

    const handleRemoveStaff = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'staff', id));
            notify("Staff member removed", "success");
            fetchStaff();
        } catch (err) {
            notify("Error removing staff", "error");
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-6 py-10 pb-32 min-h-screen bg-zinc-50 dark:bg-zinc-800/50">
            <div className="flex items-center justify-between mb-12">
                <div className="flex items-center space-x-6">
                    <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[#06331e] rounded-full shadow-sm hover:bg-[#06331e] hover:text-white transition-all active:scale-95">
                        <Icon name="arrow-left" className="text-xs" />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 mb-1">Staff Roles</h1>
                        <p className="text-zinc-400 text-[10px] md:text-xs font-bold tracking-widest uppercase">RBAC & Permissions</p>
                    </div>
                </div>
                <button onClick={() => setShowAdd(!showAdd)} className="bg-[#06331e] text-white px-6 py-3 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-emerald-900 transition-colors shadow-lg">
                    <Icon name={showAdd ? 'times' : 'plus'} className="mr-2" /> {showAdd ? 'Cancel' : 'Add Staff'}
                </button>
            </div>

            {showAdd && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-50 dark:bg-zinc-800 p-8 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-700 mb-8 max-w-2xl">
                   <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-6 uppercase tracking-widest text-xs">Configure Staff Access</h3>
                   <form onSubmit={handleAddStaff}>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                           <div>
                              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Staff Email</label>
                              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="agent@vibe.shop" className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold" required />
                           </div>
                           <div>
                              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Role Title</label>
                              <input type="text" value={form.roleName} onChange={e => setForm({...form, roleName: e.target.value})} placeholder="e.g. Content Manager" className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold" required />
                           </div>
                       </div>
                       
                       <div className="mb-8">
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Module Permissions</label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                             {ALL_MODULES.map(mod => (
                                <div 
                                   key={mod.id} 
                                   onClick={() => handleTogglePermission(mod.id)}
                                   className={`p-3 rounded-xl border flex items-center space-x-3 cursor-pointer transition-all ${form.permissions.includes(mod.id) ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'}`}
                                >
                                   <div className={`w-4 h-4 rounded border flex items-center justify-center ${form.permissions.includes(mod.id) ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-300'}`}>
                                      {form.permissions.includes(mod.id) && <Icon name="check" className="text-[8px]" />}
                                   </div>
                                   <span className={`text-xs font-bold ${form.permissions.includes(mod.id) ? 'text-emerald-900' : 'text-zinc-600 dark:text-zinc-400'}`}>{mod.name}</span>
                                </div>
                             ))}
                          </div>
                          {form.permissions.length === 0 && <p className="text-[10px] text-red-500 font-bold mt-2"><Icon name="exclamation-triangle" className="mr-1" /> Select at least one module</p>}
                       </div>

                       <div className="flex justify-end">
                           <button type="submit" disabled={form.permissions.length === 0} className="px-8 py-3 bg-emerald-500 text-white rounded-full font-bold uppercase tracking-widest text-xs hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50">
                               Confirm & Add User
                           </button>
                       </div>
                   </form>
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Master Admin Card (Cannot be deleted) */}
                 <div className="bg-[#06331e] p-6 rounded-3xl border border-[#0a4a2b] shadow-xl text-white relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl"></div>
                    <div>
                        <div className="flex items-center space-x-3 mb-6">
                           <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-900/10 rounded-full flex items-center justify-center border border-white/20">
                              <Icon name="crown" className="text-emerald-400 text-sm" />
                           </div>
                           <div>
                              <h3 className="font-black text-lg tracking-tight">Super Admin</h3>
                              <p className="text-[10px] text-emerald-200 uppercase tracking-widest font-bold">admin@vibe.shop</p>
                           </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                           <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-md text-[9px] font-bold uppercase tracking-widest border border-emerald-500/30">All Access</span>
                        </div>
                    </div>
                </div>

                {/* Sub Admins */}
                {staff.map(member => (
                   <div key={member.id} className="bg-zinc-50 dark:bg-zinc-800 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-700 shadow-sm flex flex-col justify-between">
                      <div>
                          <div className="flex justify-between items-start mb-6">
                              <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-200 dark:border-zinc-700 text-zinc-500">
                                      <Icon name="user-shield" className="text-sm" />
                                  </div>
                                  <div>
                                      <h3 className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{member.roleName}</h3>
                                      <p className="text-[10px] text-zinc-400 font-bold max-w-[150px] truncate">{member.email}</p>
                                  </div>
                              </div>
                              <button onClick={() => handleRemoveStaff(member.id)} className="w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center">
                                  <Icon name="trash" className="text-xs" />
                              </button>
                          </div>
                          
                          <div className="mt-4 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Permissions</p>
                              <div className="flex flex-wrap gap-2">
                                  {member.permissions?.map((p: string) => (
                                     <span key={p} className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-[9px] font-bold uppercase tracking-widest border border-zinc-200 dark:border-zinc-700">
                                         {ALL_MODULES.find(m => m.id === p)?.name || p}
                                     </span>
                                  ))}
                              </div>
                          </div>
                      </div>
                   </div>
                ))}
            </div>
        </div>
    );
};

export default ManageStaff;
