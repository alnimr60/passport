import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { Users, Plus, Trash2, ArrowLeft, Stamp as StampIcon, Check, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import { resizeImage } from '../lib/image-utils';

export default function AdminPage() {
  const [stampName, setStampName] = useState('');
  const [stampImage, setStampImage] = useState<string | null>(null);
  const [stamps, setStamps] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingImage, setProcessingImage] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'stamps'>('users');

  useEffect(() => {
    const unsubStamps = onSnapshot(collection(db, 'stamps'), (snap) => {
      setStamps(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => {
      unsubStamps();
      unsubUsers();
    };
  }, []);

  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProcessingImage(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const resized = await resizeImage(reader.result as string, 400, 400); // Badges don't need to be huge
        setStampImage(resized);
        setProcessingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const addStamp = async () => {
    if (!stampName || !stampImage) return;
    const id = Date.now().toString();
    const path = `stamps/${id}`;
    try {
      await setDoc(doc(db, 'stamps', id), {
        name: stampName,
        imageUrl: stampImage,
        createdAt: new Date().toISOString()
      });
      setStampName('');
      setStampImage(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const deleteStamp = async (id: string) => {
    if (confirm("Delete this stamp?")) {
      const path = `stamps/${id}`;
      try {
        await deleteDoc(doc(db, 'stamps', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  };

  const toggleStampForUser = async (userId: string, stampId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    let currentStamps = user.assignedStamps || [];
    if (currentStamps.includes(stampId)) {
      currentStamps = currentStamps.filter((s: string) => s !== stampId);
    } else {
      currentStamps = [...currentStamps, stampId];
    }

    const path = `users/${userId}`;
    try {
      await updateDoc(doc(db, 'users', userId), {
        assignedStamps: currentStamps,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  if (loading) return null;

  return (
    <div className="max-w-6xl mx-auto p-8 font-serif">
      <header className="flex justify-between items-center mb-10 border-b border-slate-200 pb-8">
        <div className="flex items-center gap-6">
          <Link to="/" className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-[#1a2d42] rounded shadow-sm transition-all">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 mb-1">Central Archive</h2>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bureau Oversight</h1>
          </div>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2.5 rounded text-[10px] font-bold transition-all uppercase tracking-widest ${activeTab === 'users' ? 'bg-[#1a2d42] text-[#d4af37] shadow' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Registrants
          </button>
          <button 
            onClick={() => setActiveTab('stamps')}
            className={`px-6 py-2.5 rounded text-[10px] font-bold transition-all uppercase tracking-widest ${activeTab === 'stamps' ? 'bg-[#1a2d42] text-[#d4af37] shadow' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Tax Stamps
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'users' ? (
          <motion.div 
            key="users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {users.map((u) => (
                <div key={u.id} className="bg-[#fcfbf7] rounded border border-slate-200 p-8 shadow-sm flex flex-col relative overflow-hidden">
                  {/* Ledger lines background */}
                  <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px)', backgroundSize: '100% 24px' }}></div>
                  
                  <div className="flex items-start gap-5 mb-8 relative z-10">
                    <img src={u.photoUrl} alt={u.name} className="w-16 h-20 rounded border border-slate-300 object-cover grayscale shadow-inner" />
                    <div>
                      <h3 className="font-bold text-slate-900 uppercase tracking-tight text-lg leading-tight mb-1">{u.name}</h3>
                      <p className="text-[10px] text-blue-800 font-bold uppercase tracking-widest">{u.role}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{u.department}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-8 flex-1 relative z-10">
                    <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-300 border-b border-slate-100 pb-2">Examination Record</h4>
                    {u.quizAnswers?.map((ans: string, i: number) => (
                      <div key={i} className="text-[10px] text-slate-600 italic leading-relaxed">
                        <span className="text-slate-300 mr-2">Q{i+1}:</span> {ans || "PENDING"}
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-slate-100 relative z-10">
                    <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-300 mb-4">Official Endorsements</h4>
                    <div className="flex flex-wrap gap-3">
                       {stamps.map(s => (
                         <button
                           key={s.id}
                           onClick={() => toggleStampForUser(u.id, s.id)}
                           className={`w-12 h-12 rounded border p-2 transition-all ${u.assignedStamps?.includes(s.id) ? 'bg-[#fcfbf7] border-[#d4af37] shadow-inner brightness-75' : 'bg-white border-slate-200 opacity-20 hover:opacity-100'}`}
                           title={s.name}
                         >
                           <img src={s.imageUrl} alt={s.name} className="w-full h-full object-contain filter hue-rotate-180 contrast-125" />
                         </button>
                       ))}
                       {stamps.length === 0 && <p className="text-[10px] text-slate-300 italic">Archive empty.</p>}
                    </div>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className="col-span-full py-32 text-center bg-[#fcfbf7] rounded border-2 border-dashed border-slate-200 shadow-inner">
                  <Users className="mx-auto text-slate-200 mb-6" size={48} strokeWidth={1} />
                  <p className="text-slate-400 uppercase tracking-widest text-[10px] font-bold">No participants registered in current ledger</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="stamps"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-12"
          >
            {/* Create Stamp */}
            <div className="bg-[#fcfbf7] p-10 rounded border border-slate-200 shadow-sm max-w-xl mx-auto">
              <h3 className="font-bold mb-8 flex items-center gap-4 text-slate-900 border-b border-slate-100 pb-4">
                <StampIcon size={24} className="text-[#1a2d42]" strokeWidth={1.5} />
                <span className="uppercase tracking-widest text-sm">Issue New Fiscal Stamp</span>
              </h3>
              <div className="space-y-6">
                 <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Designative Label</label>
                    <input 
                      type="text" 
                      value={stampName} 
                      onChange={(e) => setStampName(e.target.value)}
                      placeholder="e.g. COMMENDATION, MERIT"
                      className="w-full px-5 py-3 bg-white border border-slate-200 rounded focus:border-[#d4af37] outline-none transition-all uppercase text-xs"
                    />
                 </div>
                <label className="flex items-center justify-center gap-4 px-6 py-8 bg-white border-2 border-dashed border-slate-100 rounded cursor-pointer hover:bg-slate-100 transition-colors">
                  <Award size={24} className="text-slate-300" strokeWidth={1} />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stampImage ? "Insignia Selected" : "Upload Official Seal"}</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleStampUpload} />
                </label>
                {stampImage && (
                  <div className="flex justify-center p-8 bg-white rounded border border-slate-50 shadow-inner">
                    <img src={stampImage} alt="Preview" className="h-24 w-24 object-contain filter hue-rotate-180" />
                  </div>
                )}
                <button 
                  disabled={!stampName || !stampImage}
                  onClick={addStamp}
                  className="w-full py-4 bg-[#1a2d42] text-[#d4af37] font-bold rounded shadow-xl hover:bg-[#233b56] disabled:opacity-50 transition-all uppercase tracking-widest text-xs border border-[#d4af37]/20"
                >
                  Authorize Stamp
                </button>
              </div>
            </div>

            {/* List Stamps */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {stamps.map((s) => (
                <div key={s.id} className="group relative bg-[#fcfbf7] p-6 rounded border border-slate-200 shadow-sm flex flex-col items-center gap-4 transition-transform hover:-translate-y-1">
                  <div className="w-20 h-20 flex items-center justify-center p-3 bg-white rounded border border-slate-100 shadow-inner">
                    <img src={s.imageUrl} alt={s.name} className="w-full h-full object-contain filter hue-rotate-180" />
                  </div>
                  <p className="text-[9px] font-bold text-slate-600 text-center uppercase tracking-widest px-2">{s.name}</p>
                  <button 
                    onClick={() => deleteStamp(s.id)}
                    className="absolute -top-3 -right-3 p-2 bg-red-800 text-white rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
