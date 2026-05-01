
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { uploadToImgbb } from '../../services/imgbb';
import { useNotify, useConfirm } from '../../components/Notifications';
import { Product } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../components/Icon';

const ManageProducts: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const notify = useNotify();
  const confirm = useConfirm();

  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    description: '',
    category: 'Mobile',
    stock: 10,
    imageFiles: [] as File[],
    isOffer: false,
    offerPrice: 0,
    modelUrl: '',
    videoUrl: ''
  });

  const fetchProducts = async () => {
    const snap = await getDocs(collection(db, 'products'));
    setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name || '',
      price: product.price || 0,
      description: product.description || '',
      category: product.category || 'Mobile',
      stock: product.stock || 0,
      imageFiles: [],
      isOffer: product.isOffer || false,
      offerPrice: product.offerPrice || 0,
      modelUrl: product.modelUrl || '',
      videoUrl: product.videoUrl || ''
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrls: string[] = [];
      if (formData.imageFiles.length > 0) {
        for (const file of formData.imageFiles) {
          const url = await uploadToImgbb(file);
          imageUrls.push(url);
        }
      }

      const productData: any = {
        name: formData.name,
        price: Number(formData.price),
        description: formData.description,
        category: formData.category,
        stock: Number(formData.stock),
        isOffer: Boolean(formData.isOffer),
        offerPrice: Number(formData.offerPrice || 0),
        modelUrl: formData.modelUrl || '',
        videoUrl: formData.videoUrl || '',
      };

      if (imageUrls.length > 0) {
        productData.image = imageUrls[0];
        productData.images = imageUrls;
      }

      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), productData);
        notify("Product updated successfully", "success");
      } else {
        productData.rating = 5;
        productData.numReviews = 0;
        await addDoc(collection(db, 'products'), productData);
        notify("Product added to catalog", "success");
      }

      setIsAdding(false);
      setEditingId(null);
      setFormData({ name: '', price: 0, description: '', category: 'Mobile', stock: 10, imageFiles: [], isOffer: false, offerPrice: 0, modelUrl: '' });
      fetchProducts();
    } catch (err: any) {
      notify(err.message || "Failed to save product", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    confirm({
      title: "Delete Product?",
      message: "This product will be permanently removed from the store.",
      onConfirm: async () => {
        await deleteDoc(doc(db, 'products', id));
        notify("Product deleted", "info");
        fetchProducts();
      }
    });
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-10 pb-32 min-h-screen bg-zinc-50 dark:bg-zinc-800 animate-fade-in relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="flex items-center justify-between mb-12 relative z-10 animate-stagger-1">
        <div className="flex items-center space-x-6">
          <button onClick={() => navigate('/admin')} className="w-12 h-12 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[#06331e] rounded-full shadow-sm hover:bg-[#06331e] hover:text-white transition-all active:scale-95 group hover-tilt"><Icon name="chevron-left" className="text-xs group-hover:-translate-x-1 transition-transform" /></button>
          <div>
             <h1 className="text-xl md:text-lg font-semibold tracking-tight text-[#06331e] mb-1.5 text-shine">Products Inventory</h1>
             <p className="text-zinc-400 text-[10px] md:text-xs font-bold tracking-normal uppercase">Catalog Management</p>
          </div>
        </div>
        <button 
          onClick={() => { setIsAdding(!isAdding); setEditingId(null); setFormData({ name: '', price: 0, description: '', category: 'Mobile', stock: 10, imageFiles: [], isOffer: false, offerPrice: 0, modelUrl: '' }); }}
          className={`px-6 py-3 rounded-full font-bold uppercase text-[10px] tracking-normal shadow-lg transition-all active:scale-95 border hover-tilt hover-glow ${isAdding ? 'bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:bg-zinc-800' : 'bg-zinc-900 text-white border-zinc-900 hover:bg-emerald-500'}`}
        >
          {isAdding ? "Cancel" : "Add Product"}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            onSubmit={handleSubmit} 
            className="bg-zinc-50 dark:bg-zinc-800 p-8 md:p-12 rounded-[2rem] shadow-xl mb-12 space-y-8 max-w-4xl mx-auto border border-zinc-100 dark:border-zinc-800 relative z-10 border-gradient hover-glow transition-all"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-normal mb-3 px-1">Product Name</label>
                <input 
                  type="text" className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl outline-none border border-zinc-200 dark:border-zinc-700 focus:border-[#06331e] focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-sm hover:border-zinc-300" required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-normal mb-3 px-1">Category</label>
                <select 
                  className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl outline-none border border-zinc-200 dark:border-zinc-700 focus:border-[#06331e] focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-sm cursor-pointer hover:border-zinc-300"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option>Mobile</option>
                  <option>Accessories</option>
                  <option>Gadgets</option>
                  <option>Chargers</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-normal mb-3 px-1">Price (৳)</label>
                <input 
                  type="number" className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl outline-none border border-zinc-200 dark:border-zinc-700 focus:border-[#06331e] focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-sm hover:border-zinc-300" required
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-normal mb-3 px-1">Stock Amount</label>
                <input 
                  type="number" className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl outline-none border border-zinc-200 dark:border-zinc-700 focus:border-[#06331e] focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-sm hover:border-zinc-300" required
                  value={formData.stock}
                  onChange={e => setFormData({...formData, stock: Number(e.target.value)})}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-normal mb-3 px-1">Upload Images (One or More)</label>
              <input 
                type="file" className="w-full p-5 bg-zinc-50 dark:bg-zinc-800 rounded-xl outline-none text-[11px] font-bold shadow-sm border border-dashed border-zinc-300 cursor-pointer text-zinc-500 transition-all hover:bg-zinc-100 dark:bg-zinc-800 hover:border-[#06331e] focus:ring-4 focus:ring-emerald-500/10 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-50 dark:bg-zinc-800 file:text-[#06331e] file:border file:border-zinc-200 dark:border-zinc-700 file:shadow-sm" accept="image/*" multiple
                onChange={e => { if (e.target.files) setFormData({...formData, imageFiles: Array.from(e.target.files)}); }}
              />
              {editingId && <p className="text-[10px] text-zinc-400 mt-3 font-medium px-1">Leave empty to keep existing images.</p>}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-normal mb-3 px-1">3D Model URL (GLB file link)</label>
              <input 
                type="url" className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl outline-none border border-zinc-200 dark:border-zinc-700 focus:border-[#06331e] focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-sm hover:border-zinc-300" placeholder="https://example.com/model.glb"
                value={formData.modelUrl || ""}
                onChange={e => setFormData({...formData, modelUrl: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-normal mb-3 px-1">Video Review URL (YouTube/TikTok)</label>
              <input 
                type="url" className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl outline-none border border-zinc-200 dark:border-zinc-700 focus:border-[#06331e] focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-sm hover:border-zinc-300" placeholder="https://youtube.com/watch?v=..."
                value={formData.videoUrl || ""}
                onChange={e => setFormData({...formData, videoUrl: e.target.value})}
              />
            </div>

            <div className="bg-red-50/20 dark:bg-red-900/10 p-5 rounded-[1.25rem] border border-red-100 dark:border-red-900/30 transition-all hover:bg-red-50/40">
               <div className="flex items-center mb-4">
                  <input 
                    type="checkbox" 
                    id="isOfferCheckbox"
                    className="w-4 h-4 rounded text-red-500 focus:ring-red-500 border border-red-200 dark:border-red-800 accent-red-500 bg-transparent"
                    checked={formData.isOffer || false}
                    onChange={e => setFormData({...formData, isOffer: e.target.checked})}
                  />
                  <label htmlFor="isOfferCheckbox" className="ml-2.5 text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-normal cursor-pointer mt-0.5">Special Offer Product</label>
               </div>
               
               <AnimatePresence>
                 {formData.isOffer && (
                   <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                     <label className="block text-[10px] font-medium text-red-400 uppercase tracking-normal mb-2">Offer Price (৳)</label>
                     <input 
                       type="number" className="w-full p-3 bg-transparent rounded-lg outline-none border border-red-200 dark:border-red-800 focus:border-red-400 transition-all font-medium text-xs text-red-600 dark:text-red-400" required={formData.isOffer}
                       value={formData.offerPrice || ""}
                       onChange={e => setFormData({...formData, offerPrice: Number(e.target.value)})}
                     />
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-normal mb-3 px-1">Product Description</label>
              <textarea 
                className="w-full p-5 bg-zinc-50 dark:bg-zinc-800 rounded-xl h-40 outline-none border border-zinc-200 dark:border-zinc-700 focus:border-[#06331e] focus:ring-4 focus:ring-emerald-500/10 transition-all leading-relaxed text-sm font-medium hover:border-zinc-300"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <button 
              disabled={loading}
              className="w-full py-5 bg-gradient-to-r from-[#06331e] to-black text-white rounded-xl font-bold uppercase tracking-normal text-[11px] shadow-lg disabled:opacity-50 transition-all hover:shadow-xl active:scale-95 group relative overflow-hidden"
            >
              <span className="relative z-10">{loading ? "Processing..." : (editingId ? "Update Product" : "Save Product")}</span>
              <div className="absolute inset-0 bg-zinc-50 dark:bg-zinc-900/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="flex flex-col space-y-3 relative z-10 animate-stagger-3">
        {products.map(p => (
          <motion.div 
            layout
            key={p.id} 
            className="bg-zinc-50 dark:bg-zinc-800 rounded-full p-2 pr-6 flex items-center justify-between border border-zinc-100 dark:border-zinc-800 shadow-sm transition-all hover:shadow-xl hover:border-emerald-200 group hover-glow relative overflow-hidden"
          >
             <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
             <div className="flex items-center space-x-4 relative z-10">
               <div className="w-14 h-14 rounded-full overflow-hidden bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-500">
                  <img src={p.image} className="w-full h-full object-contain p-1 mix-blend-multiply dark:mix-blend-normal" alt={p.name} />
               </div>
               <div className="flex flex-col justify-center">
                  <h4 className="font-bold text-[13px] text-zinc-900 dark:text-zinc-100 tracking-tight max-w-[200px] md:max-w-xs truncate group-hover:text-emerald-700 transition-colors">{p.name}</h4>
                  <div className="flex items-center space-x-3 mt-1">
                     <p className="text-xs font-semibold text-emerald-600">৳{p.isOffer && p.offerPrice ? p.offerPrice : p.price}</p>
                     <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-normal"><span className="text-zinc-500">{p.stock}</span> in stock</p>
                     <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-normal flex items-center"><Icon name="eye" className="mr-1 text-emerald-300" /> {p.views || 0}</p>
                     {p.isOffer && <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-[8px] font-semibold uppercase tracking-normal shadow-sm">Offer</span>}
                  </div>
               </div>
             </div>
             
             <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity relative z-10">
                <button onClick={() => handleEdit(p)} className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-[#06331e] hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm active:scale-90">
                   <Icon name="pen" className="text-xs" />
                </button>
                <button onClick={() => handleDelete(p.id)} className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 border border-red-100 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-90">
                   <Icon name="trash" className="text-xs" />
                </button>
             </div>
          </motion.div>
        ))}
        {products.length === 0 && (
           <div className="py-32 text-center flex flex-col items-center bg-zinc-50 dark:bg-zinc-800 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
             <Icon name="box-open" className="text-lg text-zinc-200 mb-4" />
             <p className="text-zinc-400 font-bold uppercase tracking-normal text-[11px]">Inventory is empty</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default ManageProducts;
