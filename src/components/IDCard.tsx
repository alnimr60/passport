import { motion } from 'motion/react';
import { Shield, Globe2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface IDCardProps {
  name: string;
  nationality: string;
  birthDate: string;
  address: string;
  faculty: string;
  year: string;
  photo: string | null;
  stamps: string[];
}

export default function IDCard({ name, nationality, birthDate, address, faculty, year, photo, stamps }: IDCardProps) {
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
  const nameClean = (name || "SPECIMEN").toUpperCase().replace(/\s+/g, '<');
  const facultyClean = (faculty || "EXCELLENCE").toUpperCase().slice(0, 3);
  const nationalityCode = (nationality || "GLB").toUpperCase().slice(0, 3);
  const yearClean = (year || "I").toUpperCase();
  
  const mrz1 = `P<PASSPORT<<${nameClean}<<<<<<<<<<<<<<<<<<<<<<<<`.slice(0, 44);
  const mrz2 = `${nationalityCode}1234567<<<${nationalityCode}<${yearClean}<${facultyClean}<<<<<<<<<<<<`.slice(0, 44);

  return (
    <div className="relative group w-full flex justify-center">
      {/* Outer Binding Shadow - Hidden on small mobile */}
      <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-8 h-[90%] bg-slate-900/10 rounded-full blur-xl -z-10 hidden sm:block"></div>
      
      <div className="w-full max-w-[350px] sm:max-w-[600px] flex items-center justify-center">
        <motion.div 
          layout
          className="relative w-full h-[560px] sm:h-[400px] bg-[#f9f5e3] rounded-lg shadow-2xl overflow-hidden flex flex-col border-2 border-[#d4c5a0] font-serif transition-all"
          style={{
            backgroundImage: `
              radial-gradient(circle at 2px 2px, rgba(0,0,0,0.02) 1px, transparent 0),
              repeating-linear-gradient(45deg, rgba(212, 197, 160, 0.04) 0px, rgba(212, 197, 160, 0.04) 1px, transparent 1px, transparent 20px),
              linear-gradient(rgba(212, 197, 160, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(212, 197, 160, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '10px 10px, 100% 100%, 40px 40px, 40px 40px'
          }}
        >
          {/* Intricate Border Decor - Safe implementation for PNG export with perfect alignment */}
          <div className="absolute inset-0 pointer-events-none opacity-20 z-0"
               style={{ 
                 backgroundImage: 'repeating-linear-gradient(45deg, #d4af37, #d4af37 10px, transparent 10px, transparent 20px)',
                 clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 12px 12px, 12px calc(100% - 12px), calc(100% - 12px) calc(100% - 12px), calc(100% - 12px) 12px, 12px 12px)'
               }}></div>

          {/* Info Column */}
          <div className="flex-1 p-5 sm:p-7 relative z-10 flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-900/10 pb-3 sm:pb-4 mb-4">
              <div>
                <h2 className="text-[7px] sm:text-[10px] font-bold tracking-[0.3em] uppercase text-slate-800">Department of Excellence</h2>
                <h1 className="text-sm sm:text-xl font-bold uppercase text-slate-900 tracking-tight">Identity Passport</h1>
              </div>
              <Globe2 className="text-slate-400 w-6 h-6 sm:w-8 sm:h-8" strokeWidth={1.5} />
            </div>

            <div className="grid grid-cols-[140px_1fr] sm:flex sm:flex-row gap-x-4 gap-y-4 sm:gap-8 flex-1 content-start sm:content-stretch">
              {/* Photo */}
              <div className="col-start-1 row-start-1 row-span-2 w-[140px] h-[180px] sm:w-40 sm:h-52 bg-slate-200 border-2 border-slate-300 rounded shadow-inner overflow-hidden flex-shrink-0 grayscale">
                {photo ? (
                  <img src={photo} alt="Passport Photo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 opacity-50">
                    <Shield className="w-10 h-10" />
                  </div>
                )}
              </div>

              {/* Fields */}
              <div className="contents sm:flex sm:flex-1 sm:flex-col sm:justify-between sm:space-y-2 sm:pb-2 text-left">
                
                <div className="self-end sm:self-auto pb-1 sm:pb-0">
                  <p className="text-[11px] sm:text-[8px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5 sm:mb-0">Surname / Given Names</p>
                  <p className="text-[17px] leading-[1.1] sm:text-base font-bold text-slate-900 uppercase">{name || "SPECIMEN"}</p>
                </div>
                
                <div className="grid grid-cols-1 gap-y-3 sm:grid-cols-2 sm:gap-4 self-start sm:self-auto">
                  <div>
                    <p className="text-[11px] sm:text-[8px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5 sm:mb-0">Nationality</p>
                    <p className="text-[14px] sm:text-sm font-bold text-slate-800 uppercase leading-none">{nationality || "GLOBAL"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-[8px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5 sm:mb-0">Birth Date</p>
                    <p className="text-[14px] sm:text-sm font-bold text-slate-800 uppercase leading-none">{birthDate || "01/01/1970"}</p>
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1 mt-3 sm:mt-0">
                  <p className="text-[11px] sm:text-[8px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5 sm:mb-0">Address</p>
                  <p className="text-[14px] sm:text-sm font-bold text-slate-800 uppercase leading-none truncate w-full sm:max-w-[280px]">{address || "CENTRAL ARCHIVE"}</p>
                </div>

                <div className="col-span-2 sm:col-span-1 grid grid-cols-2 gap-4 mt-2 sm:mt-0">
                  <div>
                    <p className="text-[11px] sm:text-[8px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5 sm:mb-0">Faculty</p>
                    <p className="text-[14px] sm:text-sm font-bold text-slate-800 uppercase leading-none truncate">{faculty || "EXCELLENCE"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-[8px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5 sm:mb-0">Year</p>
                    <p className="text-[14px] sm:text-sm font-bold text-slate-800 uppercase leading-none">{year || "I"}</p>
                  </div>
                </div>

                {/* Stamps Section (Internal to Passport) */}
                <div className="col-span-2 sm:col-span-1 pt-4 sm:pt-1 relative h-16 flex justify-start">
                   {stampImages.map((src, i) => (
                    <motion.div 
                      initial={{ scale: 0, rotate: -20, opacity: 0 }}
                      animate={{ scale: 1, rotate: (i * 15) - 30, opacity: 0.6 }}
                      key={i} 
                      className="absolute top-0 w-16 h-16 sm:w-10 sm:h-10 pointer-events-none"
                      style={{ 
                        left: `${i * 24}px`,
                        top: `${(i % 3) * 2}px` 
                      }}
                    >
                      <img src={src} alt="Tax Stamp" className="w-full h-full object-contain filter hue-rotate-180 brightness-50" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* MRZ Zone - Optimized for all screens */}
            <div className="mt-auto font-mono text-[6.5px] sm:text-[9.5px] leading-[1.1] text-slate-600 tracking-[0.15em] sm:tracking-[0.2em] pt-4 border-t border-slate-900/10 whitespace-nowrap overflow-hidden">
              <div className="opacity-90">{mrz1}</div>
              <div className="opacity-90">{mrz2}</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
