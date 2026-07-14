import React, { useState, useEffect, useRef } from 'react';
import { User, signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { Camera, Save, LogOut, ChevronRight, CheckCircle2, LayoutDashboard, Settings, X, Loader2, Plus, Download, FileText, HelpCircle, Shield } from 'lucide-react';
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

  const [activeView, setActiveView] = useState<'passport' | 'questions'>('passport');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [answersSaving, setAnswersSaving] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const newShuffled: Record<string, string[]> = {};
    questions.forEach(q => {
      if (q.type === 'select' && q.options && q.options.length > 0) {
        const opts = [...q.options];
        for (let i = opts.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const temp = opts[i];
          opts[i] = opts[j];
          opts[j] = temp;
        }
        newShuffled[q.id] = opts;
      }
    });
    setShuffledOptions(newShuffled);
  }, [questions]);

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
        if (data.quizAnswers) {
          setAnswers(data.quizAnswers || {});
        }
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

  useEffect(() => {
    const q = query(collection(db, 'questions'), where('published', '==', true));
    const unsubQuestions = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a: any, b: any) => (a.createdAt || '').localeCompare(b.createdAt || ''));
      setQuestions(list);
      setQuestionsLoading(false);
    }, (error) => {
      console.error("Error listening to published questions:", error);
      setQuestionsLoading(false);
    });

    return () => unsubQuestions();
  }, []);

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

  const submitSingleAnswer = async (qId: string) => {
    const answerValue = answers[qId]?.trim() || '';
    if (!answerValue) return;

    setAnswersSaving(true);
    const path = `users/${user.uid}`;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        quizAnswers: {
          [qId]: answerValue
        },
        submittedQuestions: {
          [qId]: true
        },
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setAnswersSaving(false);
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
          
          <div className="flex items-center gap-1.5 sm:gap-2">
            {isAdmin && (
              <Link 
                to="/admin" 
                className="p-2 sm:p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-[#1a2d42] rounded transition-all shadow-sm flex items-center justify-center"
                title="Bureau Dashboard"
              >
                <LayoutDashboard size={16} className="sm:w-[18px] sm:h-[18px]" />
              </Link>
            )}
            <button 
              onClick={() => signOut(auth)}
              className="p-2 sm:p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-red-800 rounded transition-all shadow-sm flex items-center justify-center"
              title="Terminate Session"
            >
              <LogOut size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        </div>
      </header>

      {/* Hidden Card for Download - Ensures no scaling/perspective issues */}
      <div className="fixed -left-[2000px] top-0 pointer-events-none" aria-hidden="true">
        <div ref={downloadCardRef} className="w-[880px]">
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
        
        {isProfileComplete && (
          <div className="flex gap-2 mb-10 bg-[#f9f5e3]/80 backdrop-blur-md p-1.5 rounded border border-slate-900/10 shadow-sm relative z-20">
            <button 
              onClick={() => setActiveView('passport')}
              className={`px-6 py-2.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeView === 'passport' ? 'bg-[#1a2d42] text-[#d4af37] shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Shield size={12} className={activeView === 'passport' ? 'text-[#d4af37]' : ''} />
              <span>Official Passport</span>
            </button>
            <button 
              onClick={() => setActiveView('questions')}
              className={`px-6 py-2.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeView === 'questions' ? 'bg-[#1a2d42] text-[#d4af37] shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <FileText size={12} className={activeView === 'questions' ? 'text-[#d4af37]' : ''} />
              <span>Oversight Questionnaire</span>
              {profile?.quizAnswers && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Submitted" />
              )}
            </button>
          </div>
        )}

        {isProfileComplete && activeView === 'questions' ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl bg-[#fcfbf7] rounded border-2 border-[#d4c5a0] p-8 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.08)] relative overflow-hidden font-serif"
          >
            {/* Fine watermark background pattern */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,0,0,0.4) 1px, transparent 0)', backgroundSize: '12px 12px' }}></div>
            
            {/* Header */}
            <div className="text-center border-b-2 border-slate-900/10 pb-6 mb-8 relative">
              <h2 className="text-[9px] font-bold uppercase tracking-[0.35em] text-[#1a2d42] mb-1">State Registry Department</h2>
              <h1 className="text-xl sm:text-2xl font-bold uppercase text-slate-900 tracking-tight">Oversight Clearance Questionnaire</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Official Scrutiny Ledger No. {user.uid.slice(0, 8).toUpperCase()}</p>
            </div>

            <p className="text-xs text-slate-600 italic mb-8 leading-relaxed text-center">
              Please complete the following inquiries with absolute fidelity. Your statements will be preserved within the permanent registry archives and evaluated by bureau hosts for stamp eligibility.
            </p>

            <div className="space-y-8 relative">
              {questionsLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Loader2 size={24} className="animate-spin mb-2" />
                  <span className="text-xs uppercase tracking-widest font-mono">Retrieving Inquiries...</span>
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded">
                  <p className="text-sm text-slate-500 italic">No official clearance questions have been published yet.</p>
                </div>
              ) : (
                questions.map((q) => {
                  const isLocked = profile?.submittedQuestions?.[q.id] === true;
                  const currentVal = answers[q.id] || '';
                  const canSubmit = currentVal.trim().length > 0 && !isLocked;

                  return (
                    <div key={q.id} className="space-y-3.5 border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                      <div className="flex justify-between items-baseline gap-4">
                        <span className="text-[10px] font-mono uppercase text-[#d4af37] font-bold tracking-wider">{q.label}</span>
                        <span className="text-[9px] font-mono text-slate-400 uppercase">Field Ref: {q.id.toUpperCase().slice(0, 8)}</span>
                      </div>
                      <label className="block text-sm font-bold text-slate-900 leading-tight mb-2 text-left">
                        {q.question}
                      </label>
                      
                      {q.type === 'select' ? (
                        <div className="space-y-2 text-left">
                          {(shuffledOptions[q.id] || q.options || []).map((opt: string) => {
                            const isSelected = answers[q.id] === opt;
                            return (
                              <button
                                key={opt}
                                type="button"
                                disabled={isLocked}
                                onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                                className={`w-full text-left px-4 py-3.5 border rounded text-xs uppercase tracking-wider font-sans transition-all duration-200 flex items-center justify-between ${
                                  isSelected 
                                    ? 'bg-[#1a2d42] text-[#d4af37] border-[#1a2d42] font-semibold shadow-md' 
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                } ${isLocked ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                              >
                                <span>{opt}</span>
                                {isSelected && <CheckCircle2 size={14} className="text-[#d4af37]" />}
                              </button>
                            );
                          })}
                        </div>
                      ) : q.type === 'textarea' ? (
                        <textarea
                          value={answers[q.id] || ''}
                          disabled={isLocked}
                          onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                          rows={3}
                          className={`w-full px-4 py-3 bg-white border border-slate-200 rounded focus:border-[#d4af37] outline-none transition-all text-sm placeholder:text-slate-300 font-sans resize-none ${isLocked ? 'bg-slate-50 text-slate-500 cursor-not-allowed border-dashed' : ''}`}
                          placeholder={q.placeholder}
                        />
                      ) : (
                        <input
                          type="text"
                          value={answers[q.id] || ''}
                          disabled={isLocked}
                          onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                          className={`w-full px-4 py-3 bg-white border border-slate-200 rounded focus:border-[#d4af37] outline-none transition-all text-sm placeholder:text-slate-300 font-sans ${isLocked ? 'bg-slate-50 text-slate-500 cursor-not-allowed border-dashed' : ''}`}
                          placeholder={q.placeholder}
                        />
                      )}

                      {/* Individual question lock / submit button */}
                      <div className="pt-2 flex items-center justify-between">
                        {isLocked ? (
                          <div className="flex items-center gap-2 text-[9px] text-emerald-800 font-mono font-bold uppercase tracking-wider bg-emerald-50 px-2.5 py-1.5 rounded border border-emerald-200">
                            <CheckCircle2 size={12} className="text-emerald-700" />
                            <span>Committed & Certified</span>
                          </div>
                        ) : (
                          <div className="flex justify-end w-full">
                            <button
                              type="button"
                              onClick={() => submitSingleAnswer(q.id)}
                              disabled={!canSubmit || answersSaving}
                              className="px-5 py-2.5 bg-[#1a2d42] text-[#d4af37] font-bold rounded shadow-md hover:bg-[#233b56] disabled:opacity-30 disabled:hover:bg-[#1a2d42] transition-all uppercase tracking-widest text-[9px] border border-[#d4af37]/20 flex items-center gap-1.5"
                            >
                              {answersSaving ? (
                                <>
                                  <Loader2 size={10} className="animate-spin" />
                                  <span>Recording...</span>
                                </>
                              ) : (
                                <>
                                  <Save size={10} />
                                  <span>Submit & Certify</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {(() => {
              const submittedCount = questions.filter(q => profile?.submittedQuestions?.[q.id] === true).length;
              const totalCount = questions.length;
              const allSubmitted = totalCount > 0 && submittedCount === totalCount;

              return (
                <div className="mt-10 pt-6 border-t border-slate-900/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono uppercase">
                    <FileText size={14} className="text-[#d4af37]" />
                    <span>Ledger Progress: {submittedCount} of {totalCount} Certified</span>
                  </div>
                  {allSubmitted ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-widest font-mono bg-emerald-50 border border-emerald-200 px-4 py-2 rounded">
                      <CheckCircle2 size={14} className="text-emerald-700" />
                      <span>Ledger Fully Certified</span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400 italic uppercase tracking-wider font-mono">
                      * All fields must be certified to lock document evaluation
                    </div>
                  )}
                </div>
              );
            })()}
          </motion.div>
        ) : isProfileComplete ? (
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
        ) : null}

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
