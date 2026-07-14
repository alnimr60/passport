import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { Users, Plus, Trash2, ArrowLeft, Stamp as StampIcon, Check, Award, FileText, Edit, Eye, EyeOff, HelpCircle, FileCode, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import { resizeImage } from '../lib/image-utils';

export default function AdminPage() {
  const [stampName, setStampName] = useState('');
  const [stampImage, setStampImage] = useState<string | null>(null);
  const [stamps, setStamps] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingImage, setProcessingImage] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'stamps' | 'admins' | 'questions'>('users');
  const [expandedAnswers, setExpandedAnswers] = useState<Record<string, boolean>>({});

  // Questions management states
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [qLabel, setQLabel] = useState('');
  const [qQuestion, setQQuestion] = useState('');
  const [qType, setQType] = useState<'text' | 'textarea' | 'select'>('text');
  const [qPlaceholder, setQPlaceholder] = useState('');
  const [qOptionsRaw, setQOptionsRaw] = useState('');
  const [qPublished, setQPublished] = useState(true);

  useEffect(() => {
    const unsubStamps = onSnapshot(collection(db, 'stamps'), (snap) => {
      setStamps(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.error("Stamp stream error:", error);
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (error) => {
      console.error("User stream error:", error);
      setLoading(false);
    });

    const unsubAdmins = onSnapshot(collection(db, 'admins'), (snap) => {
      setAdmins(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.error("Admin stream error:", error);
    });

    const unsubQuestions = onSnapshot(collection(db, 'questions'), (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a: any, b: any) => (a.createdAt || '').localeCompare(b.createdAt || ''));
      setQuestions(list);
    }, (error) => {
      console.error("Questions stream error:", error);
    });

    return () => {
      unsubStamps();
      unsubUsers();
      unsubAdmins();
      unsubQuestions();
    };
  }, []);

  const startEditQuestion = (q: any) => {
    setEditingQuestionId(q.id);
    setQLabel(q.label || '');
    setQQuestion(q.question || '');
    setQType(q.type || 'text');
    setQPlaceholder(q.placeholder || '');
    setQOptionsRaw(q.options ? q.options.join(', ') : '');
    setQPublished(q.published ?? true);
  };

  const cancelEditQuestion = () => {
    setEditingQuestionId(null);
    setQLabel('');
    setQQuestion('');
    setQType('text');
    setQPlaceholder('');
    setQOptionsRaw('');
    setQPublished(true);
  };

  const saveQuestion = async () => {
    if (!qLabel || !qQuestion) return;
    
    const options = qType === 'select' 
      ? qOptionsRaw.split(',').map(s => s.trim()).filter(Boolean) 
      : [];
      
    const id = editingQuestionId || Date.now().toString();
    const path = `questions/${id}`;
    
    try {
      const data: any = {
        label: qLabel,
        question: qQuestion,
        type: qType,
        published: qPublished,
        updatedAt: new Date().toISOString()
      };
      
      if (qType === 'select') {
        data.options = options;
        data.placeholder = "";
      } else {
        data.placeholder = qPlaceholder;
        data.options = [];
      }
      
      if (!editingQuestionId) {
        data.createdAt = new Date().toISOString();
      }
      
      await setDoc(doc(db, 'questions', id), data, { merge: true });
      cancelEditQuestion();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const togglePublishQuestion = async (q: any) => {
    const path = `questions/${q.id}`;
    try {
      await updateDoc(doc(db, 'questions', q.id), {
        published: !q.published,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteQuestion = async (id: string) => {
    if (confirm("Delete this inquiry? Registrants' answers to this question ID will remain in their document but may not be displayed in future clearance evaluations.")) {
      const path = `questions/${id}`;
      try {
        await deleteDoc(doc(db, 'questions', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  };

  const seedDefaultQuestions = async () => {
    if (!confirm("Seed the 4 default clearance questions into Firestore?")) return;
    
    const defaults = [
      {
        id: 'q1',
        label: 'Purpose of Entry',
        question: 'State your primary objective for seeking archival endorsement and registry within our department.',
        type: 'text',
        placeholder: 'e.g., To pursue scientific research and contribute to local academic scholarship.',
        published: true,
        createdAt: new Date(Date.now() - 3000).toISOString()
      },
      {
        id: 'q2',
        label: 'Pledge of Diligence',
        question: 'Do you solemnly pledge to uphold the rigorous standards of your chosen academic faculty with absolute integrity?',
        type: 'select',
        options: ['I so pledge', 'I decline to pledge'],
        published: true,
        createdAt: new Date(Date.now() - 2000).toISOString()
      },
      {
        id: 'q3',
        label: 'Specialized Attributes',
        question: 'Describe any technical skills, linguistic proficiencies, or specialized capabilities you possess that warrant priority archival stamping.',
        type: 'textarea',
        placeholder: 'e.g., Fluent in classical languages, expert in systems analysis, 4 years of physical laboratory experience.',
        published: true,
        createdAt: new Date(Date.now() - 1000).toISOString()
      },
      {
        id: 'q4',
        label: 'Consent of Permanent Record',
        question: 'Do you freely authorize the Department of Excellence to preserve your biometric portraiture and educational credentials in perpetuity?',
        type: 'select',
        options: ['Consent granted', 'Consent withheld'],
        published: true,
        createdAt: new Date().toISOString()
      }
    ];

    try {
      for (const q of defaults) {
        await setDoc(doc(db, 'questions', q.id), q);
      }
    } catch (error) {
      console.error("Error seeding questions:", error);
      alert("Failed to seed questions: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const toggleAdminRole = async (user: any) => {
    const isAdminUser = admins.some(a => a.id === user.id);
    const path = `admins/${user.id}`;
    
    try {
      if (isAdminUser) {
        if (confirm(`Revoke host access for ${user.name}?`)) {
          await deleteDoc(doc(db, 'admins', user.id));
        }
      } else {
        if (confirm(`Grant host access to ${user.name}?`)) {
          await setDoc(doc(db, 'admins', user.id), {
            email: user.email,
            role: 'host',
            grantedAt: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

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
    <div className="max-w-6xl mx-auto p-4 sm:p-8 font-serif">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 border-b border-slate-200 pb-6 md:pb-8">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link to="/" className="p-2.5 sm:p-3 bg-white border border-slate-200 text-slate-400 hover:text-[#1a2d42] rounded shadow-sm transition-all">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 mb-1">Central Archive</h2>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Bureau Oversight</h1>
          </div>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded flex-wrap w-full md:w-auto justify-start md:justify-end">
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex-1 md:flex-none px-3 py-2 rounded text-[9px] sm:text-[10px] font-bold transition-all uppercase tracking-widest text-center ${activeTab === 'users' ? 'bg-[#1a2d42] text-[#d4af37] shadow' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Registrants
          </button>
          <button 
            onClick={() => setActiveTab('questions')}
            className={`flex-1 md:flex-none px-3 py-2 rounded text-[9px] sm:text-[10px] font-bold transition-all uppercase tracking-widest text-center ${activeTab === 'questions' ? 'bg-[#1a2d42] text-[#d4af37] shadow' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Inquiries
          </button>
          <button 
            onClick={() => setActiveTab('stamps')}
            className={`flex-1 md:flex-none px-3 py-2 rounded text-[9px] sm:text-[10px] font-bold transition-all uppercase tracking-widest text-center ${activeTab === 'stamps' ? 'bg-[#1a2d42] text-[#d4af37] shadow' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Tax Stamps
          </button>
          <button 
            onClick={() => setActiveTab('admins')}
            className={`flex-1 md:flex-none px-3 py-2 rounded text-[9px] sm:text-[10px] font-bold transition-all uppercase tracking-widest text-center ${activeTab === 'admins' ? 'bg-[#1a2d42] text-[#d4af37] shadow' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Hosts
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
               {users.map((u) => {
                 const isUserAdmin = admins.some(a => a.id === u.id);
                 return (
                   <div key={u.id} className="bg-[#fcfbf7] rounded border border-slate-200 p-8 shadow-sm flex flex-col relative overflow-hidden">
                     {/* Ledger lines background */}
                     <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px)', backgroundSize: '100% 24px' }}></div>
                     
                     {isUserAdmin && (
                       <div className="absolute top-0 right-0 bg-[#d4af37] text-[#1a2d42] text-[8px] font-bold uppercase tracking-widest py-1 px-3 rounded-bl shadow-sm z-20">
                         Official Host
                       </div>
                     )}

                     <div className="flex items-start gap-5 mb-8 relative z-10">
                       <img src={u.photoUrl} alt={u.name} className="w-16 h-20 rounded border border-slate-300 object-cover grayscale shadow-inner" />
                       <div>
                         <h3 className="font-bold text-slate-900 uppercase tracking-tight text-lg leading-tight mb-1">{u.name}</h3>
                         <p className="text-[10px] text-blue-800 font-bold uppercase tracking-widest">{u.faculty} - Year {u.year}</p>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{u.nationality}</p>
                       </div>
                     </div>

                     <div className="pt-6 border-t border-slate-100 relative z-10">
                       <div className="flex justify-between items-center mb-4">
                        {/* Questionnaire Responses */}
                        <div className="mb-6 pt-4 border-t border-slate-200">
                          <button
                            onClick={() => setExpandedAnswers(prev => ({ ...prev, [u.id]: !prev[u.id] }))}
                            className="w-full flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-950 hover:border-slate-300 transition-all py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded shadow-sm"
                          >
                            <span className="flex items-center gap-1.5 font-mono">
                              <FileText size={10} className="text-[#d4af37]" />
                              <span>Registry Answers</span>
                            </span>
                            <span className={`text-[7px] px-1.5 py-0.5 rounded font-mono ${u.quizAnswers ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-amber-100 text-amber-800'}`}>
                              {u.quizAnswers ? 'SUBMITTED' : 'PENDING'}
                            </span>
                          </button>
                          
                          <AnimatePresence>
                            {expandedAnswers[u.id] && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden mt-3 space-y-3 bg-white p-4 rounded border border-slate-200 font-serif shadow-inner"
                              >
                                {u.quizAnswers ? (
                                  <div className="space-y-3 text-left max-h-64 overflow-y-auto pr-1">
                                    {questions.map((q) => {
                                      const answer = u.quizAnswers[q.id];
                                      return (
                                        <div key={q.id}>
                                          <p className="text-[7px] font-mono text-slate-400 uppercase tracking-wider mb-0.5">
                                            {q.label} {!q.published && <span className="text-amber-500 font-bold font-sans">(DRAFT)</span>}
                                          </p>
                                          <p className="text-[10px] text-slate-800 leading-tight italic bg-slate-50 p-2 rounded border border-slate-100">
                                            {answer ? `"${answer}"` : <span className="text-slate-300 italic">No response.</span>}
                                          </p>
                                        </div>
                                      );
                                    })}
                                    {/* Legacy answers support */}
                                    {Object.entries(u.quizAnswers).map(([key, val]) => {
                                      const hasQ = questions.some(q => q.id === key);
                                      if (hasQ) return null;
                                      return (
                                        <div key={key}>
                                          <p className="text-[7px] font-mono text-slate-400 uppercase tracking-wider mb-0.5">
                                            Field {key.toUpperCase()} (Legacy)
                                          </p>
                                          <p className="text-[10px] text-slate-500 leading-tight italic bg-slate-50 p-2 rounded border border-slate-100">
                                            "{val as string}"
                                          </p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-slate-400 italic text-center py-2">Registrant has not submitted answers yet.</p>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                         <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-300">Official Endorsements</h4>
                         <button 
                           onClick={() => toggleAdminRole(u)}
                           className={`text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${isUserAdmin ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-slate-200 text-slate-400 hover:text-[#1a2d42] hover:bg-slate-50'}`}
                         >
                           {isUserAdmin ? 'Revoke Access' : 'Grant Host Access'}
                         </button>
                       </div>
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
                 );
               })}
              {users.length === 0 && (
                <div className="col-span-full py-32 text-center bg-[#fcfbf7] rounded border-2 border-dashed border-slate-200 shadow-inner">
                  <Users className="mx-auto text-slate-200 mb-6" size={48} strokeWidth={1} />
                  <p className="text-slate-400 uppercase tracking-widest text-[10px] font-bold">No participants registered in current ledger</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : activeTab === 'admins' ? (
          <motion.div 
            key="admins"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-[#fcfbf7] rounded border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white">
                  <div>
                    <h3 className="font-bold text-slate-900 uppercase tracking-widest text-sm">Active Bureau Hosts</h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Authorized personnel with administrative privileges</p>
                  </div>
                  <Users className="text-[#1a2d42]" size={24} strokeWidth={1} />
               </div>
               <div className="divide-y divide-slate-100">
                  {admins.map((admin) => {
                    const user = users.find(u => u.id === admin.id);
                    return (
                      <div key={admin.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-4">
                          {user ? (
                            <img src={user.photoUrl} alt={user.name} className="w-10 h-12 rounded border border-slate-200 object-cover grayscale" />
                          ) : (
                            <div className="w-10 h-12 rounded bg-slate-100 border border-slate-200 flex items-center justify-center">
                              <Users size={16} className="text-slate-300" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900 uppercase tracking-tight text-xs">{admin.email}</p>
                            <p className="text-[8px] text-[#d4af37] font-bold uppercase tracking-[0.2em]">{admin.role} - since {admin.grantedAt ? new Date(admin.grantedAt).toLocaleDateString() : 'Original Setup'}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => toggleAdminRole({ id: admin.id, name: admin.email || 'this host', email: admin.email })}
                          className="text-[8px] font-bold uppercase tracking-widest px-3 py-2 border border-red-100 text-red-400 hover:bg-red-50 rounded transition-all"
                        >
                          Revoke Access
                        </button>
                      </div>
                    );
                  })}
                  {admins.length === 0 && (
                    <div className="p-12 text-center">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No additional hosts authorized</p>
                    </div>
                  )}
               </div>
            </div>
            <div className="mt-8 p-6 bg-blue-50 border border-blue-100 rounded text-blue-800 text-[10px] font-medium leading-relaxed">
               <p className="uppercase tracking-widest font-bold mb-2">Security Protocol</p>
               Hosts can authorize new stamps and endorse participant credentials. To grant host access, navigate to the <button onClick={() => setActiveTab('users')} className="underline font-bold">Registrants</button> tab and locate the participant record.
            </div>
          </motion.div>
        ) : activeTab === 'questions' ? (
          <motion.div 
            key="questions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form panel */}
              <div className="lg:col-span-1 bg-[#fcfbf7] p-8 rounded border border-slate-200 shadow-sm self-start">
                <h3 className="font-bold mb-6 flex items-center gap-3 text-slate-900 border-b border-slate-100 pb-4">
                  <HelpCircle size={20} className="text-[#1a2d42]" strokeWidth={1.5} />
                  <span className="uppercase tracking-widest text-xs">
                    {editingQuestionId ? 'Edit Inquiry Specification' : 'New Inquiry Specification'}
                  </span>
                </h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Label (Short title)</label>
                    <input 
                      type="text" 
                      value={qLabel} 
                      onChange={(e) => setQLabel(e.target.value)}
                      placeholder="e.g., Purpose of Entry"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded focus:border-[#d4af37] outline-none transition-all text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Question text</label>
                    <textarea 
                      value={qQuestion} 
                      onChange={(e) => setQQuestion(e.target.value)}
                      placeholder="e.g., State your primary objective for seeking archival endorsement..."
                      rows={3}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded focus:border-[#d4af37] outline-none transition-all text-xs resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Input Response Type</label>
                    <select
                      value={qType}
                      onChange={(e: any) => setQType(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded focus:border-[#d4af37] outline-none transition-all text-xs"
                    >
                      <option value="text">Single Line Text Box</option>
                      <option value="textarea">Multi-line Paragraph Field</option>
                      <option value="select">Multiple Choice Selection</option>
                    </select>
                  </div>

                  {qType !== 'select' ? (
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Placeholder Text (Optional)</label>
                      <input 
                        type="text" 
                        value={qPlaceholder} 
                        onChange={(e) => setQPlaceholder(e.target.value)}
                        placeholder="e.g., Enter your purpose..."
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded focus:border-[#d4af37] outline-none transition-all text-xs"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Options (Comma separated)</label>
                      <input 
                        type="text" 
                        value={qOptionsRaw} 
                        onChange={(e) => setQOptionsRaw(e.target.value)}
                        placeholder="e.g., I so pledge, I decline to pledge"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded focus:border-[#d4af37] outline-none transition-all text-xs"
                      />
                      <p className="text-[8px] text-slate-400 mt-1 uppercase tracking-wider">Separate values with commas</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 py-2">
                    <input 
                      type="checkbox" 
                      id="qPublished" 
                      checked={qPublished} 
                      onChange={(e) => setQPublished(e.target.checked)}
                      className="rounded text-[#d4af37] focus:ring-[#d4af37] border-slate-300 h-4 w-4"
                    />
                    <label htmlFor="qPublished" className="text-[10px] font-bold text-slate-600 uppercase tracking-widest cursor-pointer select-none">
                      Publish Immediately
                    </label>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={saveQuestion}
                      disabled={!qLabel || !qQuestion}
                      className="flex-1 py-3 bg-[#1a2d42] text-[#d4af37] font-bold rounded shadow-md hover:bg-[#233b56] disabled:opacity-50 transition-all uppercase tracking-widest text-[9px] border border-[#d4af37]/10"
                    >
                      {editingQuestionId ? 'Update Inquiry' : 'Add Inquiry'}
                    </button>
                    {editingQuestionId && (
                      <button 
                        onClick={cancelEditQuestion}
                        className="px-4 py-3 bg-slate-200 text-slate-700 font-bold rounded hover:bg-slate-300 transition-all uppercase tracking-widest text-[9px]"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* List panel */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-bold text-slate-900 uppercase tracking-widest text-sm">Active Inquiries Registry</h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
                      {questions.length} question{questions.length !== 1 && 's'} currently defined
                    </p>
                  </div>
                  {questions.length === 0 && (
                    <button
                      onClick={seedDefaultQuestions}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[9px] font-bold uppercase tracking-widest hover:bg-amber-100 transition-all"
                    >
                      <Plus size={12} />
                      <span>Seed Default Inquiries</span>
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div 
                      key={q.id} 
                      className={`bg-[#fcfbf7] p-6 rounded border transition-all ${q.published ? 'border-slate-200 shadow-sm' : 'border-amber-200/60 bg-amber-50/20 shadow-none'}`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[10px] font-bold text-[#d4af37] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              #{idx + 1}
                            </span>
                            <span className="font-bold text-slate-900 uppercase tracking-tight text-xs">
                              {q.label}
                            </span>
                            <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${q.published ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {q.published ? 'PUBLISHED' : 'DRAFT'}
                            </span>
                            <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wider">
                              Type: {q.type}
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 leading-relaxed italic">
                            "{q.question}"
                          </p>

                          {q.type === 'select' ? (
                            <div className="flex flex-wrap gap-1.5 items-center">
                              <span className="text-[8px] text-slate-400 uppercase font-bold tracking-widest">Choices:</span>
                              {q.options?.map((opt: string, i: number) => (
                                <span key={i} className="text-[9px] font-mono bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600">
                                  {opt}
                                </span>
                              ))}
                            </div>
                          ) : q.placeholder ? (
                            <p className="text-[9px] text-slate-400 font-mono">
                              Placeholder: <span className="italic">"{q.placeholder}"</span>
                            </p>
                          ) : null}
                        </div>

                        <div className="flex gap-2">
                          <button 
                            onClick={() => togglePublishQuestion(q)}
                            className={`p-2 rounded border transition-all ${q.published ? 'border-slate-200 text-slate-500 hover:text-amber-600 hover:bg-slate-100' : 'border-amber-200 text-amber-700 hover:text-emerald-700 hover:bg-amber-100/50'}`}
                            title={q.published ? "Switch to Draft" : "Publish Inquiry"}
                          >
                            {q.published ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button 
                            onClick={() => startEditQuestion(q)}
                            className="p-2 rounded border border-slate-200 text-slate-500 hover:text-[#1a2d42] hover:bg-slate-100 transition-all"
                            title="Edit Inquiry"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => deleteQuestion(q.id)}
                            className="p-2 rounded border border-red-100 text-red-400 hover:text-white hover:bg-red-800 transition-all"
                            title="Delete Inquiry"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {questions.length === 0 && (
                    <div className="py-20 text-center bg-[#fcfbf7] rounded border-2 border-dashed border-slate-200 shadow-inner">
                      <HelpCircle className="mx-auto text-slate-200 mb-4" size={40} strokeWidth={1} />
                      <p className="text-slate-500 uppercase tracking-widest text-[9px] font-bold">No clearance inquiries defined in registry</p>
                      <button
                        onClick={seedDefaultQuestions}
                        className="mt-4 px-5 py-2.5 bg-[#1a2d42] text-[#d4af37] rounded text-[9px] font-bold uppercase tracking-widest hover:bg-[#233b56] transition-all shadow-sm border border-[#d4af37]/20"
                      >
                        Seed Default Clearance Inquiries
                      </button>
                    </div>
                  )}
                </div>
              </div>
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
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-center p-12 bg-white rounded border border-slate-200 shadow-inner relative group/preview">
                      <div className="relative">
                        <img 
                          src={stampImage} 
                          alt="Preview" 
                          className="h-48 w-48 object-contain filter hue-rotate-180 brightness-75 contrast-125" 
                        />
                        <div className="absolute inset-0 border-2 border-dashed border-[#d4af37]/20 rounded-full scale-110 pointer-events-none"></div>
                      </div>
                      <button 
                        onClick={() => setStampImage(null)}
                        className="absolute top-4 right-4 p-2 bg-slate-100 text-slate-400 hover:text-red-600 rounded-full transition-colors"
                        title="Clear image"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">Bureau Seal Preview (Authenticity Verified)</p>
                  </motion.div>
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
