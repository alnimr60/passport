import { useState } from 'react';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Loader2, Shield, Lock, FileText } from 'lucide-react';
import { motion } from 'motion/react';

export default function Auth() {
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (loggingIn) return;
    setLoggingIn(true);
    
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
        console.error('Login failed', error);
      }
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f1eee1] font-serif relative overflow-hidden p-4"
         style={{
           backgroundImage: `
             linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
             linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
           `,
           backgroundSize: '100px 100px'
         }}
    >
      {/* Paper texture overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Document Card styling similar to IDCard/UserPage */}
        <div className="bg-white p-10 shadow-2xl border border-slate-200 text-center relative overflow-hidden">
          
          {/* Inner border line */}
          <div className="absolute inset-2 border-2 border-slate-900/10 pointer-events-none" />

          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-[#1a2d42]" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-[#1a2d42]" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-[#1a2d42]" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-[#1a2d42]" />

          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
            className="mb-8 flex justify-center relative"
          >
            <div className="w-20 h-20 bg-slate-50 border-2 border-[#1a2d42] flex items-center justify-center text-[#1a2d42] relative z-10 shadow-md">
              <Shield size={36} strokeWidth={1.5} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="font-sans"
          >
            <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 mb-2">State Registry</h2>
            <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Identity Bureau</h1>
            
            <div className="w-16 h-[1px] bg-[#d4af37] mx-auto my-6" />
            
            <p className="text-slate-500 text-sm mb-10 leading-relaxed italic font-serif">
              Secure authentication required to access official records and generate identification documents.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={handleLogin}
              disabled={loggingIn}
              className="w-full relative group overflow-hidden bg-[#1a2d42] hover:bg-[#233b56] transition-all border border-[#1a2d42] rounded-sm p-0.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
              <div className="flex items-center justify-center gap-3 py-3.5 px-4 rounded-sm font-bold text-[#d4af37] uppercase tracking-widest text-[11px] relative z-10 font-sans">
                {loggingIn ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#d4af37]" />
                ) : (
                  <>
                    <img 
                      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                      alt="Google" 
                      className="w-4 h-4 opacity-100 bg-white rounded-full p-[2px]"
                    />
                    <div className="w-[1px] h-4 bg-[#d4af37]/30 mx-1" />
                    <span>Authenticate via Google</span>
                  </>
                )}
              </div>
            </button>
            
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-[9px] text-slate-400 uppercase tracking-widest font-sans font-semibold">
              <div className="flex items-center gap-1.5">
                <Lock size={10} className="text-slate-300" />
                <span>Encrypted</span>
              </div>
              <span className="hidden sm:inline text-slate-300">•</span>
              <div className="flex items-center gap-1.5">
                <FileText size={10} className="text-slate-300" />
                <span>Official Record</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
