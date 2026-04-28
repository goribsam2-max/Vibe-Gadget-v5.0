
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { uploadToImgbb } from '../../services/imgbb';
import { useNotify, useConfirm } from '../../components/Notifications';
import Icon from '../../components/Icon';

interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  link?: string;
  createdAt: number;
}

const ManageBanners: React.FC = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [featuredCategory, setFeaturedCategory] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const notify = useNotify();
  const confirm = useConfirm();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
    imageFile: null as File | null,
    bannerType: 'hero' as 'hero' | 'popup' | 'gif'
  });

  const fetchBanners = async () => {
    const q = query(collection(db, 'banners'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    setBanners(snap.docs.map(d => ({ id: d.id, ...d.data() } as Banner)));
  };

  const fetchSettings = async () => {
    const snap = await getDoc(doc(db, 'settings', 'platform'));
    if (snap.exists()) {
       setFeaturedCategory(snap.data().featuredCategory || '');
    }
  };

  useEffect(() => { fetchBanners(); fetchSettings(); }, []);

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
       await setDoc(doc(db, 'settings', 'platform'), { featuredCategory }, { merge: true });
       notify("Homepage showcase category updated", "success");
    } catch(err) {
       notify("Failed to save settings", "error");
    } finally {
       setSavingSettings(false);
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingId(banner.id);
    setFormData({ title: banner.title, description: banner.description, link: banner.link || '', imageFile: null, bannerType: banner.bannerType || 'hero' });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let imageUrl = '';
      if (formData.imageFile) {
        imageUrl = await uploadToImgbb(formData.imageFile);
      }

      const bannerData: any = {
        title: formData.title,
        description: formData.description,
        link: formData.link,
        bannerType: formData.bannerType
      };

      if (imageUrl) bannerData.imageUrl = imageUrl;

      if (editingId) {
        await updateDoc(doc(db, 'banners', editingId), bannerData);
        notify("Banner updated successfully", "success");
      } else {
        if (!imageUrl) throw new Error("An image is required for new banners");
        bannerData.createdAt = Date.now();
        await addDoc(collection(db, 'banners'), bannerData);
        notify("New banner published", "success");
      }

      setEditingId(null);
      setFormData({ title: '', description: '', link: '', imageFile: null });
      fetchBanners();
    } catch (err: any) {
      notify(err.message || "Failed to save banner", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id: string) => {
    confirm({
      title: "Remove Banner?",
      message: "Are you sure you want to remove this banner from the homepage?",
      onConfirm: async () => {
        await deleteDoc(doc(db, 'banners', id));
        notify("Banner removed", "info");
        fetchBanners();
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 bg-zinc-50 dark:bg-zinc-800 min-h-screen pb-32">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center space-x-6">
          <button onClick={() => navigate('/admin')} className="w-12 h-12 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[#06331e] rounded-full shadow-sm hover:bg-[#06331e] hover:text-white transition-all active:scale-95"><Icon name="chevron-left" className="text-xs" /></button>
          <div>
             <h1 className="text-xl md:text-2xl font-black tracking-tight text-[#06331e] mb-1.5">Store Banners</h1>
             <p className="text-zinc-400 text-[10px] md:text-xs font-bold tracking-widest uppercase">Homepage Visuals</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1">
          <form onSubmit={handleAdd} className="bg-zinc-50 dark:bg-zinc-800 p-10 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 space-y-8 shadow-sm sticky top-10">
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4">{editingId ? 'Edit' : 'Create New'} Banner</h2>
            
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-3 px-1">Main Title</label>
              <input 
                type="text" required
                placeholder="e.g. Smart Watch Sale"
                className="w-full bg-zinc-50 dark:bg-zinc-800 p-5 rounded-2xl outline-none focus:ring-1 focus:ring-black transition-all font-bold shadow-inner"
                value={formData.title || ""}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-3 px-1">Description</label>
              <input 
                type="text" required
                placeholder="e.g. Up to 50% Off"
                className="w-full bg-zinc-50 dark:bg-zinc-800 p-5 rounded-2xl outline-none focus:ring-1 focus:ring-black transition-all font-medium text-sm shadow-inner"
                value={formData.description || ""}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-3 px-1">Action Link (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. /product/123 or /all-products"
                className="w-full bg-zinc-50 dark:bg-zinc-800 p-5 rounded-2xl outline-none focus:ring-1 focus:ring-black transition-all font-medium text-sm shadow-inner"
                value={formData.link || ""}
                onChange={e => setFormData({...formData, link: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-3 px-1">Banner Type</label>
              <select 
                title="Banner Type"
                className="w-full bg-zinc-50 dark:bg-zinc-800 p-5 rounded-2xl outline-none focus:ring-1 focus:ring-black transition-all font-bold text-sm shadow-inner cursor-pointer"
                value={formData.bannerType || 'hero'}
                onChange={e => setFormData({...formData, bannerType: e.target.value as any})}
              >
                <option value="hero">Hero (Top Slider)</option>
                <option value="popup">Welcome Popup</option>
                <option value="gif">Thin GIF Banner</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-3 px-1">Banner Image (GIFs allowed)</label>
              <input 
                title="Banner Image"
                type="file" accept="image/*"
                className="w-full bg-zinc-50 dark:bg-zinc-800 p-5 rounded-2xl outline-none text-[10px] font-bold uppercase shadow-inner cursor-pointer"
                onChange={e => setFormData({...formData, imageFile: e.target.files?.[0] || null})}
              />
            </div>

            <button 
                disabled={uploading}
                className="w-full bg-zinc-900 border border-zinc-900 text-white shadow-sm disabled:opacity-50 text-[10px] font-bold uppercase tracking-widest py-4 rounded-full transition-all hover:bg-zinc-900"
            >
              {uploading ? "Uploading..." : (editingId ? "Update Banner" : "Create Banner")}
            </button>
            {editingId && (
              <button 
                onClick={() => { setEditingId(null); setFormData({title: '', description: '', link: '', imageFile: null}); }} 
                className="w-full text-[10px] font-black uppercase text-zinc-400 tracking-widest mt-2 hover:text-black dark:text-white transition-colors"
              >
                Cancel Editing
              </button>
            )}
          </form>

          <div className="bg-zinc-50 dark:bg-zinc-800 p-10 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 mt-8 shadow-sm">
             <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6">Home Slider Category</h2>
             <p className="text-[10px] font-bold text-zinc-500 mb-6 leading-relaxed">Select a category to display in the auto-slider below the header search bar on the homepage.</p>
             <div className="flex flex-col space-y-4">
                <select 
                  value={featuredCategory} 
                  onChange={e => setFeaturedCategory(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 p-5 rounded-2xl outline-none focus:ring-1 focus:ring-black transition-all font-bold shadow-inner uppercase tracking-widest text-xs"
                >
                   <option value="">-- No Slider --</option>
                   <option value="Mobile">Mobile</option>
                   <option value="Accessories">Accessories</option>
                   <option value="Gadgets">Gadgets</option>
                   <option value="Chargers">Chargers</option>
                </select>
                <button 
                  onClick={saveSettings} 
                  disabled={savingSettings}
                  className="w-full bg-[#06331e] text-white shadow-sm disabled:opacity-50 text-[10px] font-bold uppercase tracking-widest py-4 rounded-full transition-all hover:bg-emerald-900"
                >
                  {savingSettings ? "Saving..." : "Update Category"}
                </button>
             </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {banners.map(banner => (
              <div key={banner.id} className="group relative bg-zinc-50 dark:bg-zinc-800 rounded-[2.5rem] overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm transition-all hover:shadow-2xl">
                <div className="h-56 relative">
                  <img src={banner.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-1000" alt="" />
                  <div className="absolute inset-0 bg-zinc-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                     <button onClick={() => handleEdit(banner)} className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center hover:scale-110 transition-transform"><Icon name="pen" className="text-black dark:text-white" /></button>
                     <button onClick={() => handleDelete(banner.id)} className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform"><Icon name="trash" className="text-white" /></button>
                  </div>
                </div>
                <div className="p-8 relative">
                   <span className="absolute top-0 right-8 -translate-y-1/2 bg-zinc-900 dark:bg-zinc-50 dark:text-black text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                     {banner.bannerType === 'popup' ? 'Welcome Popup' : banner.bannerType === 'gif' ? 'GIF Banner' : 'Hero Slider'}
                   </span>
                   <h3 className="font-black text-lg tracking-tight mb-2 mt-2">{banner.title}</h3>
                   <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mb-4">{banner.description}</p>
                   {banner.link && <p className="text-[10px] font-mono text-zinc-300">Link: {banner.link}</p>}
                </div>
              </div>
            ))}
            {banners.length === 0 && <div className="col-span-full py-32 text-center text-zinc-300 font-black uppercase tracking-widest">No banners active</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageBanners;
