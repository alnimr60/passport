import { useState } from 'react';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { LogIn, Loader2 } from 'lucide-react';
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center"
      >
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <LogIn size={32} />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">ID Card Designer</h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Design your personalized ID card and join the session.
        </p>
        <button
          onClick={handleLogin}
          disabled={loggingIn}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-70 disabled:cursor-not-allowed transition-colors shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {loggingIn ? (
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          ) : (
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              alt="Google" 
              className="w-5 h-5"
            />
          )}
          {loggingIn ? "Connecting..." : "Sign in with Google"}
        </button>
      </motion.div>
    </div>
  );
}
