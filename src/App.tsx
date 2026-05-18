import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import UserPage from './components/UserPage';
import AdminPage from './components/AdminPage';
import Auth from './components/Auth';
import './index.css';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          // Check if user is admin
          const adminDoc = await getDoc(doc(db, 'admins', u.uid));
          if (adminDoc.exists()) {
            setIsAdmin(true);
          } else if (u.email === 'alnimr60@gmail.com') {
            // Auto-provision the first admin for the developer
            await setDoc(doc(db, 'admins', u.uid), { email: u.email });
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch (err) {
          console.error("Error fetching admin status:", err);
          setIsAdmin(false);
          // if it fails to create the admin doc due to write permissions, we can just skip
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-400 font-medium">Initializing...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Routes>
          <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
          <Route 
            path="/" 
            element={user ? <UserPage user={user} /> : <Navigate to="/auth" />} 
          />
          <Route 
            path="/admin" 
            element={user && isAdmin ? <AdminPage /> : <Navigate to="/" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}
