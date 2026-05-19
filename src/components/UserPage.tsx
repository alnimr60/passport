import React, { useState, useEffect, useRef } from 'react';
import { User, signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { Camera, Save, LogOut, ChevronRight, CheckCircle2, LayoutDashboard, Settings, X, Loader2, Plus, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import IDCard from './IDCard';
import { toPng } from 'html-to-image';
import { Link } from 'react-router-dom';
import { handleFirestoreError, OperationType } from '../lib/error-handler';

import { resizeImage } from '../lib/image-utils';

export default function UserPage({ user }: { user: User }) {
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [nationality, setNationality] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');
  const [faculty, setFaculty] = useState('');
  const [year, setYear] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [step, setStep] = useState(1); // 1: Card Details, 2: Final Card
  const [isAdmin, setIsAdmin] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const downloadCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setProfile(data);
        setName(data.name || '');
        setNationality(data.nationality || '');
        setBirthDate(data.birthDate || '');
        setAddress(data.address || '');
        setFaculty(data.faculty || '');
        setYear(data.year || '');
        setPhoto(data.photoUrl || null);
        if (data.name && data.nationality && data.birthDate && data.address && data.faculty && data.year && data.photoUrl) {
           setStep(2);
        }
      }
      setLoading(false);
    });

    const checkAdmin = async () => {
      try {
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        setIsAdmin(adminDoc.exists());
      } catch (err) {
        console.error("Failed to check admin status", err);
      }
    };
    checkAdmin();

    return unsub;
  }, [user.uid]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProcessingImage(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const resized = await resizeImage(reader.result as string);
        setPhoto(resized);
        setProcessingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    const path = `users/${user.uid}`;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        name,
        nationality,
        birthDate,
        address,
        faculty,
        year,
        photoUrl: photo,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      if (step < 2) setStep(step + 1);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setSaving(false);
    }
  };

  const downloadID = async () => {
    if (!downloadCardRef.current) return;
    setSaving(true);
    try {
      const dataUrl = await toPng(downloadCardRef.current, {
        quality: 1.0,
        pixelRatio: 3,
        skipFonts: true, // Skip fonts to avoid "Failed to fetch" on remote CSS
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = `identity_passport_${name.toLowerCase().replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err: any) {
      console.error('Download failed', err);
      alert(`Failed to generate PNG: ${err.message || 'Unknown error'}. This is often caused by remote CSS restrictions in the preview. Try opening the app in a new tab.`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  const isProfileComplete = name && nationality && birthDate && address && faculty && year && photo;

  return (
    <div className="min-h-screen bg-[#f1eee1] font-serif flex flex-col overflow-x-hidden relative"
         style={{
           backgroundImage: `
             linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
             linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
           `,
           backgroundSize: '100px 100px'
         }}>
      {/* Paper texture overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
      
      {/* Header */}
      <header className="w-full p-6 sm:p-10 flex justify-between items-center border-b-2 border-slate-900/10 bg-[#f9f5e3]/90 backdrop-blur-md sticky top-0 z-30">
        <div>
          <h2 className="text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 mb-0.5 sm:mb-1">State Registry</h2>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">Identity Bureau</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {isProfileComplete && (
            <button 
              onClick={downloadID}
              className="p-2.5 sm:p-3 bg-white text-slate-600 rounded shadow hover:bg-slate-50 transition-all border border-slate-200 group"
              title="Download Document"
            >
              <Download size={18} className="text-[#d4af37] group-hover:scale-110 transition-transform" />
            </button>
          )}
          <button 
            onClick={() => setShowEditor(true)}
            className="flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-2.5 bg-[#1a2d42] text-[#d4af37] rounded shadow-lg hover:bg-[#233b56] transition-all font-bold text-[10px] sm:text-sm tracking-widest uppercase border border-[#d4af37]/20"
          >
            <Settings size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Modify Record</span>
            <span className="sm:hidden">Edit</span>
          </button>
          
          <div className="hidden sm:flex items-center gap-2">
            {isAdmin && (
              <Link 
                to="/admin" 
                className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-[#1a2d42] rounded transition-all shadow-sm"
                title="Bureau Dashboard"
              >
                <LayoutDashboard size={18} />
              </Link>
            )}
            <button 
              onClick={() => signOut(auth)}
              className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-red-800 rounded transition-all shadow-sm"
              title="Terminate Session"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Hidden Card for Download - Ensures no scaling/perspective issues */}
      <div className="fixed -left-[2000px] top-0 pointer-events-none" aria-hidden="true">
        <div ref={downloadCardRef} className="w-[600px]">
          <IDCard 
            name={name || "Full Name"}
            nationality={nationality || "Nationality"}
            birthDate={birthDate || "Birth Date"}
            address={address || "Address"}
            faculty={faculty || "Faculty"}
            year={year || "Year"}
            photo={photo}
            stamps={profile?.assignedStamps || []}
          />
        </div>
      </div>

      {/* Main Content: ID Card Focus */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-12 flex flex-col items-center justify-center min-h-[calc(100vh-100px)]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, rotateX: 5 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          className="perspective-2000 w-full flex justify-center transition-transform duration-700"
        >
          <div ref={cardRef} className="w-full flex justify-center">
            <IDCard 
              name={name || "Full Name"}
              nationality={nationality || "Nationality"}
              birthDate={birthDate || "Birth Date"}
              address={address || "Address"}
              faculty={faculty || "Faculty"}
              year={year || "Year"}
              photo={photo}
              stamps={profile?.assignedStamps || []}
            />
          </div>
        </motion.div>

        {!isProfileComplete && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-24 sm:mt-32 p-8 sm:p-10 bg-[#f9f5e3] rounded-sm border-2 border-[#d4c5a0] w-full max-w-lg text-center shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative"
          >
            {/* Wax seal decoration */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-[#8b0000] rounded-full shadow-lg border-2 border-[#a52a2a] flex items-center justify-center text-[#d4af37] font-black italic">
              B
            </div>
            <p className="text-[#1a2d42] font-black uppercase tracking-[0.25em] mb-6 text-sm">Application for Registry</p>
            <p className="text-slate-600 text-xs italic mb-8 leading-relaxed">Please proceed to initialize your official documentation for archival processing.</p>
            <button 
              onClick={() => setShowEditor(true)}
              className="px-12 py-4 bg-[#1a2d42] text-[#d4af37] font-bold rounded shadow-xl hover:bg-[#233b56] transition-all uppercase tracking-[0.2em] text-xs border border-[#d4af37]/30 active:scale-95"
            >
              Begin Registration
            </button>
          </motion.div>
        )}
      </main>

      {/* Slide-over/Overlay Editor */}
      <AnimatePresence>
        {showEditor && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditor(false)}
              className="fixed inset-0 bg-[#0c131d]/60 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#fcfbf7] shadow-2xl z-50 overflow-y-auto border-l border-[#d4c5a0]"
            >
              <div className="p-10">
                <header className="flex justify-between items-center mb-10 border-b border-slate-200 pb-6">
                  <h3 className="text-xl font-bold text-slate-900 uppercase tracking-widest">Registrar's Office</h3>
                  <button 
                    onClick={() => setShowEditor(false)}
                    className="p-2 text-slate-400 hover:text-slate-900 transition-all"
                  >
                    <X size={20} />
                  </button>
                </header>

                <div className="space-y-8">
                  {/* Step Selector */}
                  <div className="flex gap-1 p-1 bg-slate-100 rounded border border-slate-200">
                    <button 
                      onClick={() => setStep(1)}
                      className={`flex-1 py-2 text-[10px] font-bold rounded transition-all uppercase tracking-tighter ${step === 1 ? 'bg-white shadow text-[#1a2d42]' : 'text-slate-400'}`}
                    >
                      Vital Stats
                    </button>
                    <button 
                      onClick={() => setStep(2)}
                      className={`flex-1 py-2 text-[10px] font-bold rounded transition-all uppercase tracking-tighter ${step === 2 ? 'bg-white shadow text-[#1a2d42]' : 'text-slate-400'}`}
                    >
                      Validation
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Surname & Given Names</label>
                          <input 
                            type="text" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-5 py-3 bg-white border border-slate-200 rounded focus:border-[#d4af37] outline-none transition-all placeholder:text-slate-200"
                            placeholder="DOE, JOHN"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Nationality</label>
                            <input 
                              type="text" 
                              value={nationality} 
                              onChange={(e) => setNationality(e.target.value)}
                              className="w-full px-5 py-3 bg-white border border-slate-200 rounded focus:border-[#d4af37] outline-none transition-all placeholder:text-slate-200"
                              placeholder="FRENCH"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Birth Date</label>
                            <input 
                              type="text" 
                              value={birthDate} 
                              onChange={(e) => setBirthDate(e.target.value)}
                              className="w-full px-5 py-3 bg-white border border-slate-200 rounded focus:border-[#d4af37] outline-none transition-all placeholder:text-slate-200"
                              placeholder="01/01/1990"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Residential Address</label>
                          <input 
                            type="text" 
                            value={address} 
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full px-5 py-3 bg-white border border-slate-200 rounded focus:border-[#d4af37] outline-none transition-all placeholder:text-slate-200"
                            placeholder="123 ARCHIVE ST, BUREAU CITY"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Faculty</label>
                            <input 
                              type="text" 
                              value={faculty} 
                              onChange={(e) => setFaculty(e.target.value)}
                              className="w-full px-5 py-3 bg-white border border-slate-200 rounded focus:border-[#d4af37] outline-none transition-all placeholder:text-slate-200"
                              placeholder="MEDICINE"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Academic Year</label>
                            <input 
                              type="text" 
                              value={year} 
                              onChange={(e) => setYear(e.target.value)}
                              className="w-full px-5 py-3 bg-white border border-slate-200 rounded focus:border-[#d4af37] outline-none transition-all placeholder:text-slate-200"
                              placeholder="4TH YEAR"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Portraiture</label>
                          <div className="flex items-center gap-6 p-6 bg-white rounded border border-slate-200">
                            <div className="relative">
                              <div className="w-16 h-20 rounded border border-slate-300 overflow-hidden bg-slate-50 grayscale">
                                {photo ? (
                                  <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-200">
                                    <Camera size={24} />
                                  </div>
                                )}
                              </div>
                              <label className="absolute -bottom-2 -right-2 p-1.5 bg-[#1a2d42] text-[#d4af37] rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform">
                                <Plus size={14} />
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                              </label>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium italic leading-relaxed">
                              Standard biometric portrait required. Desaturation will be applied for archival purposes.
                            </p>
                          </div>
                        </div>
                        <button
                          disabled={!name || !nationality || !birthDate || !address || !faculty || !year || !photo || saving || processingImage}
                          onClick={saveProfile}
                          className="w-full flex items-center justify-center gap-2 py-4 bg-[#1a2d42] text-[#d4af37] font-bold rounded shadow-xl hover:bg-[#233b56] disabled:opacity-50 transition-all uppercase tracking-widest text-xs border border-[#d4af37]/20"
                        >
                          {saving ? <Loader2 className="animate-spin text-[#d4af37]" /> : "Commit Record"}
                        </button>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12"
                      >
                        <div className="w-20 h-20 bg-[#f9f5e3] text-[#1a2d42] rounded border border-[#d4af37]/30 flex items-center justify-center mx-auto mb-6 shadow-sm">
                          <CheckCircle2 size={40} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 uppercase tracking-widest mb-2">Record Verified</h3>
                        <p className="text-slate-500 text-xs mb-12 px-6 leading-relaxed italic">
                          Your identity has been successfully registered in the central archives. You may now view your official passport document.
                        </p>
                        <button
                          onClick={() => setShowEditor(false)}
                          className="px-12 py-4 bg-[#1a2d42] text-[#d4af37] font-bold rounded shadow-xl hover:bg-[#233b56] transition-all uppercase tracking-widest text-xs border border-[#d4af37]/40"
                        >
                          Close Archive
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
