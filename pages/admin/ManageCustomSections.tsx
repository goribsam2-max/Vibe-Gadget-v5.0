import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useNotify } from '../../components/Notifications';
import Icon from '../../components/Icon';
import { motion, AnimatePresence } from 'framer-motion';

const ManageCustomSections: React.FC = () => {
    const notify = useNotify();
    const [sections, setSections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingState, setEditingState] = useState<string | null>(null);
    const [formData, setFormData] = useState({ id: '', location: 'home_top', html: '', isActive: true });

    useEffect(() => {
        const q = query(collection(db, 'custom_sections'));
        const unsub = onSnapshot(q, (snap) => {
            setSections(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const handleSave = async () => {
        try {
            const id = formData.id || Math.random().toString(36).substr(2, 9);
            await setDoc(doc(db, 'custom_sections', id), {
                location: formData.location,
                html: formData.html,
                isActive: formData.isActive
            });
            notify('Custom section saved!', 'success');
            setEditingState(null);
            setFormData({ id: '', location: 'home_top', html: '', isActive: true });
        } catch (e: any) {
            notify(e.message, 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this section?")) return;
        try {
            await deleteDoc(doc(db, 'custom_sections', id));
            notify('Section deleted', 'success');
        } catch (e: any) {
            notify(e.message, 'error');
        }
    };

    const availableLocations = ['home_top', 'home_bottom', 'cart_bottom', 'checkout_bottom', 'profile_bottom', 'product_bottom', 'wishlist_bottom'];

    return (
        <div className="max-w-4xl mx-auto px-6 py-10 pb-32 min-h-screen">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-lg font-semibold">Custom Sections</h1>
                    <p className="text-xs text-zinc-500 uppercase font-bold tracking-normal mt-1">Inject dynamic HTML/CSS anywhere</p>
                </div>
                <button onClick={() => { setEditingState('new'); setFormData({ id: '', location: 'home_top', html: '', isActive: true }); }} className="bg-emerald-500 text-white px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-normal shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center">
                    <Icon name="plus" className="mr-2" /> Add New
                </button>
            </div>

            <AnimatePresence>
                {editingState && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-700 mb-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold uppercase tracking-normal text-xs">{editingState === 'new' ? 'New Section' : 'Edit Section'}</h3>
                            <button onClick={() => setEditingState(null)} className="text-zinc-400 hover:text-black dark:hover:text-white"><Icon name="times" /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-normal text-zinc-500 mb-2 block">Placement Location</label>
                                <select 
                                    value={formData.location} 
                                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                                    className="w-full bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border border-transparent outline-none text-sm focus:border-emerald-500"
                                >
                                    {availableLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-normal text-zinc-500 mb-2 block">HTML Content</label>
                                <textarea 
                                    value={formData.html} 
                                    onChange={(e) => setFormData({...formData, html: e.target.value})}
                                    className="w-full h-48 bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border border-transparent outline-none font-mono text-xs focus:border-emerald-500"
                                    placeholder="<div class='bg-red-500 p-4'>Sale!</div>"
                                />
                            </div>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                                    className={`w-12 h-6 rounded-full relative transition-colors ${formData.isActive ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${formData.isActive ? 'left-7' : 'left-1'}`}></div>
                                </button>
                                <span className="text-[10px] font-bold uppercase tracking-normal">Active</span>
                            </div>

                            <button onClick={handleSave} className="w-full bg-[#06331e] text-white py-4 rounded-xl font-bold uppercase tracking-normal text-xs mt-4">
                                Save Section
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {loading ? (
                <div className="py-20 text-center"><Icon name="spinner-third" className="animate-spin text-lg" /></div>
            ) : sections.length === 0 ? (
                <div className="py-32 text-center text-zinc-400 font-bold text-xs uppercase tracking-normal">No custom sections</div>
            ) : (
                <div className="grid gap-4">
                    {sections.map(sec => (
                        <div key={sec.id} className="bg-white dark:bg-zinc-800 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <div className="flex items-center space-x-3 mb-2">
                                    <span className={`w-2 h-2 rounded-full ${sec.isActive ? 'bg-emerald-500' : 'bg-zinc-400'}`}></span>
                                    <h4 className="font-bold text-sm tracking-normal font-mono">{sec.location}</h4>
                                </div>
                                <div className="text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg font-mono truncate max-w-lg">
                                    {sec.html}
                                </div>
                            </div>
                            <div className="flex space-x-2 shrink-0">
                                <button onClick={() => { setFormData(sec); setEditingState(sec.id); }} className="w-10 h-10 bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl flex items-center justify-center hover:bg-zinc-200 transition-colors"><Icon name="edit" /></button>
                                <button onClick={() => handleDelete(sec.id)} className="w-10 h-10 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-100 transition-colors"><Icon name="trash" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ManageCustomSections;
