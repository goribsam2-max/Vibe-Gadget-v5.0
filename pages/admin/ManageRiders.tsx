import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useNotify } from '../../components/Notifications';
import { motion } from 'framer-motion';
import Icon from '../../components/Icon';

const ManageRiders: React.FC = () => {
    const navigate = useNavigate();
    const notify = useNotify();
    const [riders, setRiders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    
    const [form, setForm] = useState({
       name: '',
       phone: '',
       zone: 'Dhaka',
       vehicle: 'Motorcycle'
    });

    useEffect(() => {
        fetchRiders();
    }, []);

    const fetchRiders = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, 'riders'));
            setRiders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleAddRider = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!form.name || !form.phone) return;

        try {
            const riderId = Date.now().toString();
            await setDoc(doc(db, 'riders', riderId), {
                name: form.name,
                phone: form.phone,
                zone: form.zone,
                vehicle: form.vehicle,
                status: 'Available',
                deliveriesCompleted: 0,
                createdAt: Date.now()
            });
            notify(`Rider added successfully`, 'success');
            setShowAdd(false);
            setForm({ name: '', phone: '', zone: 'Dhaka', vehicle: 'Motorcycle' });
            fetchRiders();
        } catch (err) {
            notify('Error adding rider', 'error');
        }
    };

    const handleRemoveRider = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'riders', id));
            notify("Rider removed", "success");
            fetchRiders();
        } catch (err) {
            notify("Error removing rider", "error");
        }
    };

    const zones = ['Dhaka', 'Chattogram', 'Sylhet', 'Rajshahi'];

    return (
        <div className="max-w-6xl mx-auto px-6 py-10 pb-32 min-h-screen bg-zinc-50 dark:bg-zinc-800/50">
            <div className="flex items-center justify-between mb-12">
                <div className="flex items-center space-x-6">
                    <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[#06331e] rounded-full shadow-sm hover:bg-[#06331e] hover:text-white transition-all active:scale-95">
                        <Icon name="arrow-left" className="text-xs" />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 mb-1">Rider Fleet</h1>
                        <p className="text-zinc-400 text-[10px] md:text-xs font-bold tracking-widest uppercase">Delivery Personnel</p>
                    </div>
                </div>
                <button onClick={() => setShowAdd(!showAdd)} className="bg-[#06331e] text-white px-6 py-3 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-emerald-900 transition-colors shadow-lg">
                    <Icon name={showAdd ? 'times' : 'plus'} className="mr-2" /> {showAdd ? 'Cancel' : 'Add Rider'}
                </button>
            </div>

            {showAdd && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-50 dark:bg-zinc-800 p-8 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-700 mb-8 max-w-2xl">
                   <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-6 uppercase tracking-widest text-xs">Register Delivery Rider</h3>
                   <form onSubmit={handleAddRider} className="space-y-6">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Full Name</label>
                              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Rahim Miah" className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold" required />
                           </div>
                           <div>
                              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Phone Number</label>
                              <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="01XXXXXXXXX" className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold" required />
                           </div>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Operating Zone</label>
                              <select value={form.zone} onChange={e => setForm({...form, zone: e.target.value})} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold">
                                  {zones.map(z => <option key={z} value={z}>{z}</option>)}
                              </select>
                           </div>
                           <div>
                              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Vehicle Type</label>
                              <select value={form.vehicle} onChange={e => setForm({...form, vehicle: e.target.value})} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold">
                                  <option value="Motorcycle">Motorcycle</option>
                                  <option value="Bicycle">Bicycle</option>
                                  <option value="Van">Van</option>
                              </select>
                           </div>
                       </div>

                       <div className="flex justify-end pt-4">
                           <button type="submit" className="px-8 py-3 bg-emerald-500 text-white rounded-full font-bold uppercase tracking-widest text-xs hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
                               Register Rider
                           </button>
                       </div>
                   </form>
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {riders.map(rider => (
                   <div key={rider.id} className="bg-zinc-50 dark:bg-zinc-800 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-700 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-orange-600" />
                      <div className="flex justify-between items-start mb-6 mt-1">
                          <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center">
                                  <Icon name="motorcycle" className="text-sm" />
                              </div>
                              <div>
                                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{rider.name}</h3>
                                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{rider.phone}</p>
                              </div>
                          </div>
                          <button onClick={() => handleRemoveRider(rider.id)} className="w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center">
                              <Icon name="trash" className="text-xs" />
                          </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-5">
                          <div>
                             <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Zone</p>
                             <p className="font-bold text-zinc-800 dark:text-zinc-200 text-sm mt-1 flex items-center"><Icon name="map-marker-alt" className="text-emerald-500 mr-2 text-[10px]" />{rider.zone}</p>
                          </div>
                          <div>
                             <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Status / Trips</p>
                             <div className="flex items-center space-x-2 mt-1">
                                 <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                 <span className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">{rider.status} ({rider.deliveriesCompleted || 0} Trips)</span>
                             </div>
                          </div>
                      </div>
                   </div>
                ))}

                {riders.length === 0 && !loading && (
                    <div className="col-span-full py-20 text-center bg-zinc-50 dark:bg-zinc-800 rounded-3xl border border-zinc-200 dark:border-zinc-700 shadow-sm text-zinc-400">
                      <Icon name="motorcycle" className="text-4xl mb-4 text-zinc-300" />
                      <p className="font-bold text-xs uppercase tracking-widest">No riders recorded yet</p>
                   </div>
                )}
            </div>
        </div>
    );
};

export default ManageRiders;
