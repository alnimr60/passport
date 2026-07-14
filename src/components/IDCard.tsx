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
      
      {/* Premium Leather Passport Cover Wrapper */}
      <div className="w-full max-w-[360px] sm:max-w-[840px] md:max-w-[920px] p-2 sm:p-4 bg-[#142232] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.45)] border-4 border-[#1b2b3d] relative">
        <motion.div 
          layout
          className="relative w-full h-auto bg-[#fcf9ee] rounded-xl overflow-hidden flex flex-col sm:flex-row border border-[#d4c5a0]/80 font-serif transition-all"
          style={{
            backgroundImage: `
              radial-gradient(circle at 2px 2px, rgba(0,0,0,0.015) 1px, transparent 0),
              repeating-linear-gradient(45deg, rgba(212, 197, 160, 0.02) 0px, rgba(212, 197, 160, 0.02) 1px, transparent 1px, transparent 20px)
            `,
            backgroundSize: '10px 10px, 100% 100%'
          }}
        >
          {/* PAGE 1: BIOGRAPHICAL DATA PAGE (Pristine & Clean - Left/Top) */}
          <div className="flex-1 p-5 sm:p-7 relative z-10 flex flex-col justify-between min-h-[440px] border-b sm:border-b-0 sm:border-r border-[#d4c5a0]/30">
            {/* Guilloche Border pattern for Biographical page */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.15] z-0"
                 style={{ 
                   backgroundImage: 'repeating-linear-gradient(45deg, #d4af37, #d4af37 10px, transparent 10px, transparent 20px)',
                   clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 12px 12px, 12px calc(100% - 12px), calc(100% - 12px) calc(100% - 12px), calc(100% - 12px) 12px, 12px 12px)'
                 }}></div>

            <div className="relative z-10 flex flex-col h-full justify-between">
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-900/10 pb-3 mb-4">
                <div>
                  <h2 className="text-[7px] sm:text-[9px] font-bold tracking-[0.25em] uppercase text-slate-700">Department of Excellence</h2>
                  <h1 className="text-xs sm:text-base font-bold uppercase text-slate-900 tracking-tight">Identity Passport</h1>
                </div>
                <Globe2 className="text-slate-400 w-6 h-6 sm:w-7 sm:h-7" strokeWidth={1.5} />
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[130px_1fr] gap-4 sm:gap-5 flex-grow text-left">
                {/* Photo */}
                <div className="w-[120px] h-[155px] sm:w-[130px] sm:h-[170px] bg-slate-200 border-2 border-slate-300 rounded shadow-inner overflow-hidden flex-shrink-0 grayscale">
                  {photo ? (
                    <img src={photo} alt="Passport Photo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 opacity-50">
                      <Shield className="w-10 h-10" />
                    </div>
                  )}
                </div>

                {/* Fields */}
                <div className="flex flex-col justify-between space-y-2 py-0.5">
                  <div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Surname / Given Names</p>
                    <p className="text-sm sm:text-base font-bold text-slate-900 uppercase leading-tight">{name || "SPECIMEN"}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Nationality</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 uppercase leading-none">{nationality || "GLOBAL"}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Birth Date</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 uppercase leading-none">{birthDate || "01/01/1970"}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Residential Address</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 uppercase truncate max-w-[170px] sm:max-w-[210px] leading-tight">{address || "CENTRAL ARCHIVE"}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Faculty</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 uppercase truncate leading-none">{faculty || "EXCELLENCE"}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Year</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 uppercase leading-none">{year || "I"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* MRZ Zone */}
              <div className="mt-4 font-mono text-[5.5px] sm:text-[7.5px] leading-tight text-slate-600 tracking-[0.16em] sm:tracking-[0.18em] pt-3 border-t border-slate-900/10 whitespace-nowrap overflow-hidden">
                <div className="opacity-85">{mrz1}</div>
                <div className="opacity-85">{mrz2}</div>
              </div>
            </div>
          </div>

          {/* 3D SPINE BOOK BINDING EFFECT */}
          {/* Vertical Spine for Desktop */}
          <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-dashed border-l border-slate-400/30 -translate-x-1/2 hidden sm:block z-20" />
          <div className="absolute left-1/2 top-0 bottom-0 w-8 bg-gradient-to-r from-black/[0.08] via-black/[0.18] to-transparent -translate-x-1/2 hidden sm:block z-10 pointer-events-none" />
          <div className="absolute left-1/2 top-0 bottom-0 w-8 bg-gradient-to-l from-black/[0.08] via-black/[0.18] to-transparent translate-x-[-100%] hidden sm:block z-10 pointer-events-none" />
          
          {/* Horizontal Spine for Portrait Mobile */}
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-dashed border-t border-slate-400/30 -translate-y-1/2 block sm:hidden z-20" />
          <div className="absolute top-1/2 left-0 right-0 h-8 bg-gradient-to-b from-black/[0.08] via-black/[0.18] to-transparent -translate-y-1/2 block sm:hidden z-10 pointer-events-none" />
          <div className="absolute top-1/2 left-0 right-0 h-8 bg-gradient-to-t from-black/[0.08] via-black/[0.18] to-transparent translate-y-[-100%] block sm:hidden z-10 pointer-events-none" />

          {/* PAGE 2: VISA / STAMPS REGISTRY PAGE (Right/Bottom) */}
          <div className="flex-1 p-5 sm:p-7 relative z-10 flex flex-col justify-between min-h-[440px] bg-[#faf6e5]">
            {/* Subtle Security watermark and background dot pattern for stamps page */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.035]" 
                 style={{ 
                   backgroundImage: 'radial-gradient(circle, #000 15%, transparent 16%)', 
                   backgroundSize: '16px 16px' 
                 }}></div>
            <div className="absolute inset-4 pointer-events-none border border-[#d4c5a0]/30 rounded-lg flex items-center justify-center">
              <div className="opacity-[0.05] text-center select-none flex flex-col items-center">
                <Globe2 className="w-40 h-40 text-slate-800" strokeWidth={1} />
                <span className="text-base font-bold font-serif uppercase tracking-[0.35em] mt-2">Endorsements</span>
              </div>
            </div>

            <div className="relative z-10 flex flex-col h-full justify-between flex-grow">
              {/* Visa Header */}
              <div className="flex items-center justify-between border-b border-slate-900/5 pb-2.5 mb-3">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.25em]">Page 02</span>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em] font-serif">Visas / Endorsements</span>
                <span className="text-[8px] font-mono text-slate-400 font-bold">N° 9821-E</span>
              </div>

              {/* Spacious Stamp Canvas Area */}
              <div className="relative flex-grow min-h-[300px] w-full">
                {stampImages.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400/60 p-4 border border-dashed border-[#d4c5a0]/30 rounded bg-white/20">
                    <p className="text-xs uppercase tracking-[0.15em] font-bold mb-1">Visa Registry Empty</p>
                    <p className="text-[9px] text-center italic max-w-[200px] leading-relaxed">Official stamps will be authorized and appended here by oversight hosts.</p>
                  </div>
                ) : (
                  stampImages.map((src, i) => {
                    // Generate a unique seed based on index and image URL
                    const seedStr = (name || "ID") + i + src;
                    let hash = 0;
                    for(let j = 0; j < seedStr.length; j++) {
                      hash = Math.imul(31, hash) + seedStr.charCodeAt(j) | 0;
                    }
                    hash = Math.abs(hash);

                    // Map to rows and columns dynamically
                    const colCount = 2;
                    const row = Math.floor(i / colCount);
                    const col = i % colCount;

                    // Compute percentages with pseudo-random offsets to look naturally stamped
                    const randX = (hash % 100) / 100;
                    const randY = ((hash >> 4) % 100) / 100;
                    const randRot = ((hash >> 8) % 100) / 100;
                    const randScale = ((hash >> 12) % 100) / 100;
                    const randOpacity = ((hash >> 16) % 100) / 100;

                    // Base placement coordinates inside Visa Page (percentages ensure it scales perfectly)
                    const leftPct = 15 + col * 46 + (randX * 12 - 6); 
                    const topPct = 12 + row * 26 + (randY * 10 - 5);  

                    // Custom tilt: rubber stamps are never perfectly aligned! Limit tilt to beautiful angles (-22 to 22 deg)
                    const rotation = (randRot * 44) - 22;

                    // Randomized scale and opacity for authentic ink feel
                    const scale = 0.82 + (randScale * 0.22); 
                    const opacity = 0.76 + (randOpacity * 0.12); // Range: 0.76 to 0.88 opacity for realistic faded ink absorption

                    return (
                      <motion.div 
                        initial={{ scale: 0, rotate: -30, opacity: 0 }}
                        animate={{ scale: scale, rotate: rotation, opacity: opacity }}
                        key={src + i} 
                        className="absolute pointer-events-none flex items-center justify-center select-none"
                        style={{ 
                          left: `${leftPct}%`,
                          top: `${topPct}%`,
                          transform: 'translate(-50%, -50%)', 
                          transformOrigin: 'center center'
                        }}
                      >
                        <img 
                          src={src} 
                          alt="Official Stamp" 
                          className="max-w-[125px] max-h-[105px] w-auto h-auto object-contain filter mix-blend-multiply brightness-[0.55] contrast-[1.3] saturate-[1.4]"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Page Footer */}
              <div className="mt-4 pt-2.5 border-t border-slate-900/5 flex items-center justify-between text-[8px] font-mono text-slate-400">
                <span className="uppercase tracking-widest">Bureau Archival Records</span>
                <span>SECURE RECORD</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
