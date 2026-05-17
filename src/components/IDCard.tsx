import { motion } from 'motion/react';
import { Shield, Globe2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface IDCardProps {
  name: string;
  role: string;
  dept: string;
  photo: string | null;
  stamps: string[];
}

export default function IDCard({ name, role, dept, photo, stamps }: IDCardProps) {
  const [stampImages, setStampImages] = useState<string[]>([]);

  useEffect(() => {
    const fetchStamps = async () => {
      const images: string[] = [];
      for (const id of stamps) {
        const sDoc = await getDoc(doc(db, 'stamps', id));
        if (sDoc.exists()) {
          images.push(sDoc.data().imageUrl);
        }
      }
      setStampImages(images);
    };
    if (stamps.length > 0) fetchStamps();
  }, [stamps]);

  // Generate MRZ line
  const nameClean = name.toUpperCase().replace(/[^A-Z]/g, '<');
  const roleClean = role.toUpperCase().replace(/[^A-Z]/g, '<');
  const mrz1 = `P<PASSPORT<<${nameClean}<<<<<<<<<<<<<<<<<<`;
  const mrz2 = `${(dept.slice(0,3) + "1234567").toUpperCase()}<<<${roleClean}<<<<<<<<<<<`;

  return (
    <div className="relative group w-full flex justify-center">
      {/* Outer Binding Shadow - Hidden on small mobile */}
      <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-8 h-[90%] bg-slate-900/10 rounded-full blur-xl -z-10 hidden sm:block"></div>
      
      <div className="w-full max-w-[350px] sm:max-w-[500px] flex items-center justify-center">
        <motion.div 
          layout
          className="relative w-full h-[520px] sm:h-[340px] rounded-lg shadow-2xl overflow-hidden flex flex-col sm:flex-row border-2 border-[#d4c5a0] font-serif transition-all"
        >
          {/* Layered Background System for maximum screenshot fidelity */}
          <div className="absolute inset-0 bg-[#f9f5e3] z-0" />
          
          {/* The intricate stripes (The Border) */}
          <div className="absolute inset-0 pointer-events-none opacity-20 z-0"
               style={{ 
                 backgroundImage: 'repeating-linear-gradient(45deg, #d4af37, #d4af37 10px, transparent 10px, transparent 20px)'
               }} />
          
          {/* Inner Mask to reveal only the perimeter stripes */}
          <div className="absolute inset-[10px] sm:inset-[16px] bg-[#f9f5e3] z-0" 
               style={{
                 backgroundImage: `
                   radial-gradient(circle at 2px 2px, rgba(0,0,0,0.02) 1px, transparent 0),
                   linear-gradient(rgba(212, 197, 160, 0.1) 1px, transparent 1px),
                   linear-gradient(90deg, rgba(212, 197, 160, 0.1) 1px, transparent 1px)
                 `,
                 backgroundSize: '10px 10px, 40px 40px, 40px 40px'
               }}
          />

          {/* Info Column */}
          <div className="flex-1 p-5 sm:p-6 relative z-10 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-900/10 pb-3 sm:pb-4 mb-4 sm:mb-4">
              <div>
                <h2 className="text-[7px] sm:text-[10px] font-bold tracking-[0.3em] uppercase text-slate-800">Department of Excellence</h2>
                <h1 className="text-sm sm:text-xl font-bold uppercase text-slate-900 tracking-tight">Identity Passport</h1>
              </div>
              <Globe2 className="text-slate-400 w-6 h-6 sm:w-8 sm:h-8" strokeWidth={1.5} />
            </div>

            <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 flex-1">
              {/* Photo - Centered on mobile */}
              <div className="w-32 h-40 sm:w-28 sm:h-36 bg-slate-200 border-2 border-slate-300 rounded shadow-inner overflow-hidden flex-shrink-0 grayscale mx-auto sm:mx-0">
                {photo ? (
                  <img src={photo} alt="Passport Photo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 opacity-50">
                    <Shield className="w-10 h-10" />
                  </div>
                )}
              </div>

              {/* Fields */}
              <div className="flex-1 space-y-3 sm:space-y-3 text-center sm:text-left">
                <div>
                  <p className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Surname / Given Names</p>
                  <p className="text-sm sm:text-base font-bold text-slate-900 uppercase leading-none">{name || "SPECIMEN"}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Nationality / Dept</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 uppercase leading-none">{dept || "GLOBAL"}</p>
                  </div>
                  <div>
                    <p className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Designation / Role</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 uppercase leading-none">{role || "OFFICIAL"}</p>
                  </div>
                </div>

                {/* Stamps Section (Internal to Passport) */}
                <div className="pt-2 relative h-12 sm:h-16 flex justify-center sm:justify-end">
                   {stampImages.map((src, i) => (
                    <motion.div 
                      initial={{ scale: 0, rotate: -20, opacity: 0 }}
                      animate={{ scale: 1, rotate: (i * 15) - 30, opacity: 0.6 }}
                      key={i} 
                      className="absolute top-0 w-10 h-10 sm:w-12 sm:h-12 pointer-events-none"
                      style={{ 
                        right: i % 2 === 0 ? `${i * 15}px` : 'auto',
                        left: i % 2 !== 0 ? `${i * 15}px` : 'auto',
                        top: `${(i % 3) * 5}px` 
                      }}
                    >
                      <img src={src} alt="Tax Stamp" className="w-full h-full object-contain filter hue-rotate-180 brightness-50" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* MRZ Zone */}
            <div className="mt-auto font-mono text-[7px] sm:text-[10px] leading-tight text-slate-500 tracking-widest pt-4 border-t border-slate-900/5 overflow-hidden whitespace-nowrap">
              <div className="truncate">{mrz1}</div>
              <div className="truncate">{mrz2}</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
