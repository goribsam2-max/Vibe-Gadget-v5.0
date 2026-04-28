import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useNotify } from '../../components/Notifications';
import { uploadToImgbb } from '../../services/imgbb';
import Icon from '../../components/Icon';

const PRESET_SONGS = [
  { name: 'LoFi Chill', url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3' },
  { name: 'Upbeat Corporate', url: 'https://cdn.pixabay.com/download/audio/2022/10/24/audio_34b4ce6dcb.mp3?filename=uplifting-upbeat-corporate-125086.mp3' },
  { name: 'Cyberpunk Action', url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_249ea36566.mp3?filename=cyberpunk-2099-10701.mp3' },
  { name: 'Epic Cinematic', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=epic-hollywood-trailer-9489.mp3' },
  { name: 'Pop Vibe', url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_c6ccf3232f.mp3?filename=summer-nights-tropical-house-music-11440.mp3' },
  { name: 'YT Playlist Track 1', url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3?filename=electronic-future-beats-117997.mp3' },
  { name: 'YT Playlist Track 2', url: 'https://cdn.pixabay.com/download/audio/2021/11/24/audio_a1622f98f6.mp3?filename=modern-vlog-140795.mp3' }
];

const ManageStories: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  const [type, setType] = useState<'image' | 'video'>('image');
  const [category, setCategory] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  // Audio Selection
  const [songSource, setSongSource] = useState<'preset' | 'custom'>('preset');
  const [selectedSongUrl, setSelectedSongUrl] = useState('');
  const [customSongUrl, setCustomSongUrl] = useState('');
  const [audioStart, setAudioStart] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'stories'), (snap) => {
      setStories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    try {
      const url = await uploadToImgbb(file);
      setPreviewUrl(url);
    } catch {
      notify("Failed to upload image", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!category || (type === 'image' && !previewUrl) || (type === 'video' && !videoUrl)) {
       return notify("Please fill required fields", "error");
    }
    
    const finalAudioUrl = songSource === 'preset' ? selectedSongUrl : customSongUrl;

    setLoading(true);
    try {
       await addDoc(collection(db, 'stories'), {
         type,
         category: category.trim(),
         mediaUrl: type === 'image' ? previewUrl : videoUrl,
         linkUrl: linkUrl.trim(),
         duration: type === 'image' ? 10 : 15,
         audioUrl: finalAudioUrl || null,
         audioStart: Number(audioStart) || 0,
         createdAt: new Date().toISOString()
       });
       notify("Story saved", "success");
       setIsAdding(false);
       setCategory('');
       setPreviewUrl('');
       setVideoUrl('');
       setLinkUrl('');
       setSelectedSongUrl('');
       setCustomSongUrl('');
       setAudioStart(0);
    } catch (e) {
       notify("Failed to save story", "error");
    } finally {
       setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
     if (!window.confirm("Delete this story?")) return;
     try {
        await deleteDoc(doc(db, 'stories', id));
        notify("Story deleted", "success");
     } catch (e) {
        notify("Failed to delete", "error");
     }
  };

  const finalAudioPreviewUrl = songSource === 'preset' ? selectedSongUrl : customSongUrl;

  if (isAdding) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10 pb-48 min-h-screen bg-zinc-50 dark:bg-zinc-800 font-inter">
        <div className="flex items-center space-x-6 mb-12">
            <button onClick={() => setIsAdding(false)} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-zinc-900 hover:text-white transition-all">
              <Icon name="arrow-left" className="text-sm" />
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Create New Story</h1>
            </div>
        </div>

        <div className="space-y-6">
           <div>
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-2 block">Story Category / Title</label>
              <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Flash Sales, Top Offers" className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm outline-none border border-zinc-200 dark:border-zinc-700 focus:border-black transition-colors" />
           </div>
           
           <div>
             <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-2 block">Media Protocol</label>
             <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl">
                <button onClick={() => setType('image')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${type === 'image' ? 'bg-zinc-50 dark:bg-zinc-800 shadow border border-zinc-200 dark:border-zinc-700' : 'text-zinc-500 hover:bg-zinc-200'}`}>Image Cover</button>
                <button onClick={() => setType('video')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${type === 'video' ? 'bg-zinc-50 dark:bg-zinc-800 shadow border border-zinc-200 dark:border-zinc-700' : 'text-zinc-500 hover:bg-zinc-200'}`}>Direct Video Link</button>
             </div>
           </div>

           {type === 'image' ? (
              <div>
                <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-2 block">Upload Cover</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="h-48 border-2 border-dashed border-zinc-300 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-50 dark:bg-zinc-800 transition-colors relative overflow-hidden group"
                >
                   {loading && !previewUrl ? <Icon name="spinner" className="animate-spin text-zinc-400 text-3xl" /> : previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" alt="preview" /> : <div className="text-center group-hover:scale-105 transition-transform"><Icon name="cloud-upload-alt" className="text-3xl text-zinc-400 mb-3"/><p className="text-sm font-bold text-zinc-500">Tap to browse files</p></div>}
                   <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
              </div>
           ) : (
              <div>
                 <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-2 block">Direct Video URL (.mp4)</label>
                 <input type="text" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://.../video.mp4" className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm outline-none border border-zinc-200 dark:border-zinc-700 focus:border-black transition-colors" />
              </div>
           )}

           <div>
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-2 block">Associated Link URL (Optional)</label>
              <input type="text" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm outline-none border border-zinc-200 dark:border-zinc-700 focus:border-black transition-colors" />
              <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mt-2">Where should users go when they swipe up or click?</p>
           </div>

           <div className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-6 rounded-3xl space-y-5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase block">Background Audio</label>
                <div className="flex border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden text-[10px] font-bold">
                  <button onClick={() => setSongSource('preset')} className={`px-3 py-1.5 ${songSource === 'preset' ? 'bg-zinc-900 text-white' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500'}`}>Presets</button>
                  <button onClick={() => setSongSource('custom')} className={`px-3 py-1.5 ${songSource === 'custom' ? 'bg-zinc-900 text-white' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500'}`}>Custom Link</button>
                </div>
              </div>
              
              {songSource === 'preset' ? (
                <select className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-sm font-bold outline-none" value={selectedSongUrl} onChange={e => { setSelectedSongUrl(e.target.value); setAudioStart(0); }}>
                   <option value="">No Music</option>
                   {PRESET_SONGS.map((song, i) => <option key={i} value={song.url}>{song.name}</option>)}
                </select>
              ) : (
                <input type="text" value={customSongUrl} onChange={e => setCustomSongUrl(e.target.value)} placeholder="https://yourserver.com/song.mp3" className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm outline-none border border-zinc-200 dark:border-zinc-700" />
              )}

              {finalAudioPreviewUrl && (
                 <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase mb-2 block">Start Offset (seconds)</label>
                    <input type="number" min="0" value={audioStart} onChange={e => setAudioStart(Number(e.target.value))} className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-sm font-bold outline-none focus:border-black" />
                    
                    <div className="mt-4 flex items-center space-x-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800 p-3 rounded-2xl shadow-sm">
                      <audio ref={audioRef} src={finalAudioPreviewUrl} preload="auto" />
                      <button onClick={() => { if(audioRef.current){ audioRef.current.currentTime = audioStart; audioRef.current.play(); setTimeout(()=>audioRef.current?.pause(), 5000); } }} className="flex-1 text-xs font-bold uppercase bg-[#06331e] text-white px-4 py-3 rounded-xl active:scale-95 transition-all">Preview 5s Sync</button>
                      <button onClick={() => audioRef.current?.pause()} className="text-xs font-bold uppercase border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-3 rounded-xl active:scale-95 transition-all">Stop</button>
                    </div>
                 </div>
              )}
           </div>

           <div className="pt-4 pb-12">
             <button onClick={handleSave} disabled={loading} className="w-full py-5 bg-zinc-900 dark:bg-zinc-50 dark:text-black text-white rounded-2xl font-bold uppercase tracking-widest text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-black/20">
                {loading ? 'Saving...' : 'Publish to Feed'}
             </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 pb-48 min-h-screen bg-zinc-50 dark:bg-zinc-800 font-inter">
      <div className="mb-12 flex items-center justify-between">
        <div className="flex items-center space-x-6">
           <button onClick={() => navigate('/admin')} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-zinc-900 hover:text-white transition-all">
             <Icon name="arrow-left" className="text-sm" />
           </button>
           <div>
             <h1 className="text-2xl font-black tracking-tight">Stories Setup</h1>
             <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Manage active flash stories</p>
           </div>
        </div>
        <button onClick={() => setIsAdding(true)} className="bg-[#06331e] text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-zinc-900 transition-colors flex items-center space-x-2">
           <Icon name="plus" />
           <span>Add Story</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
         {stories.map(story => (
            <div key={story.id} className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 group shadow-sm">
               {story.type === 'video' ? (
                 <video src={story.mediaUrl} className="w-full h-full object-cover" muted loop />
               ) : (
                 <img src={story.mediaUrl} className="w-full h-full object-cover" alt="" />
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/20 opacity-80" />
               <div className="absolute top-3 left-3 bg-zinc-50 dark:bg-zinc-900/20 backdrop-blur-md px-2 py-1 rounded-md text-[9px] font-bold text-white uppercase tracking-widest">
                  {story.category}
               </div>
               <button onClick={() => handleDelete(story.id)} className="absolute bottom-4 right-4 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 xl:group-hover:opacity-100 lg:opacity-0 opacity-100 transition-opacity hover:scale-110 shadow-lg border border-red-400">
                  <Icon name="trash" />
               </button>
            </div>
         ))}
         {stories.length === 0 && (
            <div className="col-span-full py-20 text-center bg-zinc-50 dark:bg-zinc-800 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-3xl">
              <Icon name="layer-group" className="text-zinc-300 text-4xl mb-4" />
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">No stories active</p>
              <button onClick={() => setIsAdding(true)} className="mt-4 text-[10px] font-bold uppercase tracking-widest text-[#06331e] bg-emerald-50 px-4 py-2 rounded-lg">Create First Story</button>
            </div>
         )}
      </div>
    </div>
  );
};
export default ManageStories;
