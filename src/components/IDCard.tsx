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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    if (stamps.length > 0) {
      fetchStamps();
    } else {
      setStampImages([]);
    }
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
          className="relative w-full h-auto min-h-[640px] sm:min-h-[440px] bg-[#f9f5e3] rounded-lg shadow-2xl overflow-hidden flex flex-col border-2 border-[#d4c5a0] font-serif transition-all"
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

              </div>
            </div>

            {/* MRZ Zone - Optimized for all screens */}
            <div className="mt-auto font-mono text-[6.5px] sm:text-[9.5px] leading-[1.1] text-slate-600 tracking-[0.15em] sm:tracking-[0.2em] pt-4 border-t border-slate-900/10 whitespace-nowrap overflow-hidden">
              <div className="opacity-90">{mrz1}</div>
              <div className="opacity-90">{mrz2}</div>
            </div>
          </div>

          {/* Stamps Overlay (Beautifully and realistically distributed across the entire passport page) */}
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
            {stampImages.map((src, i) => {
              // Generate a unique layout per user using name & index as seed
              const seedStr = (name || "ID") + i + src;
              let hash = 0;
              for (let j = 0; j < seedStr.length; j++) {
                hash = Math.imul(31, hash) + seedStr.charCodeAt(j) | 0;
              }
              hash = Math.abs(hash);

              // 24 strategic, balanced spots strictly in the right-hand area (avoiding the left photo zone)
              const baseSpotsDesktop = [
                { x: 54, y: 18 }, { x: 68, y: 18 }, { x: 82, y: 18 },
                { x: 58, y: 32 }, { x: 72, y: 32 }, { x: 86, y: 32 },
                { x: 54, y: 46 }, { x: 68, y: 46 }, { x: 82, y: 46 },
                { x: 58, y: 60 }, { x: 72, y: 60 }, { x: 86, y: 60 },
                { x: 54, y: 74 }, { x: 68, y: 74 }, { x: 82, y: 74 },
                { x: 91, y: 22 }, { x: 91, y: 40 }, { x: 91, y: 58 }, { x: 91, y: 74 },
                { x: 62, y: 25 }, { x: 78, y: 25 }, { x: 62, y: 53 }, { x: 78, y: 53 }
              ];

              // Beautifully balanced mobile spots distributing stamps across full width below the photo and fields
              const baseSpotsMobile = [
                // Below photo & fields - completely empty bottom area of the passport (y = 48% to 86%)
                // Row 1 (y = 48% - full width)
                { x: 16, y: 48 }, { x: 38, y: 49 }, { x: 60, y: 48 }, { x: 82, y: 49 },
                // Row 2 (y = 58% - full width)
                { x: 18, y: 58 }, { x: 42, y: 59 }, { x: 66, y: 58 }, { x: 88, y: 59 },
                // Row 3 (y = 68% - full width)
                { x: 15, y: 68 }, { x: 36, y: 69 }, { x: 58, y: 68 }, { x: 80, y: 69 },
                // Row 4 (y = 78% - full width)
                { x: 18, y: 78 }, { x: 40, y: 79 }, { x: 62, y: 78 }, { x: 84, y: 79 },
                // Row 5 (y = 85% - full width, just above MRZ)
                { x: 16, y: 85 }, { x: 38, y: 86 }, { x: 60, y: 85 }, { x: 82, y: 86 },

                // Filler gaps in bottom area
                { x: 28, y: 53 }, { x: 72, y: 53 }, { x: 28, y: 73 }, { x: 72, y: 73 },

                // Right of the photo area (y < 46%, x >= 50%) - used as overflow
                { x: 58, y: 16 }, { x: 74, y: 16 }, { x: 88, y: 16 },
                { x: 58, y: 26 }, { x: 76, y: 26 }, { x: 90, y: 26 },
                { x: 58, y: 36 }, { x: 74, y: 36 }, { x: 88, y: 36 }
              ];

              const baseSpots = isMobile ? baseSpotsMobile : baseSpotsDesktop;

              // Pick spot by wrapping global index
              const spotIndex = i % baseSpots.length;
              const spot = baseSpots[spotIndex];

              // Add deterministic jitter (offset) of +/- 3% so each user's layout is slightly unique
              const jitterX = ((hash % 7) - 3);
              const jitterY = (((hash >> 4) % 7) - 3);

              // Pseudo-random rotation, scaling, and opacity
              // Ensure we don't declare randRot twice if it's already there
              const randRot = ((hash >> 8) % 100) / 100;
              const randScale = ((hash >> 12) % 100) / 100;
              const randOpacity = ((hash >> 16) % 100) / 100;

              // Ensure stamps don't touch top-left photo zone on mobile, but otherwise have full range
              const minLeft = (isMobile && spot.y >= 46) ? 8 : 50;
              const leftPercent = Math.max(minLeft, Math.min(92, spot.x + jitterX));
              const maxTop = isMobile ? 89 : 82;
              const topPercent = Math.max(12, Math.min(maxTop, spot.y + jitterY));

              // Real immigration officers stamp with small natural rotations
              const rotation = (randRot * 50) - 25; // -25 to +25 degrees (realistic angle)
              
              // Scale dynamically based on the total stamp count to avoid massive overlap
              const sizeMultiplier = stampImages.length > 12 ? 0.65 : (stampImages.length > 8 ? 0.8 : 1.0);
              const scale = (0.85 + (randScale * 0.2)) * sizeMultiplier;
              
              const opacity = 0.32 + (randOpacity * 0.13); // 0.32 to 0.45 opacity variance (a little more transparent)

              // Dynamically adjust max image sizing classes based on count
              const imgSizeClass = stampImages.length > 12 
                ? "max-w-[65px] max-h-[50px] sm:max-w-[85px] sm:max-h-[70px]" 
                : stampImages.length > 8 
                  ? "max-w-[75px] max-h-[60px] sm:max-w-[100px] sm:max-h-[85px]" 
                  : "max-w-[90px] max-h-[75px] sm:max-w-[125px] sm:max-h-[105px]";

              return (
                <motion.div 
                  initial={{ scale: 0, rotate: -15, opacity: 0 }}
                  animate={{ scale: scale, rotate: rotation, opacity: opacity }}
                  key={src + i} 
                  className="absolute pointer-events-none flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
                  style={{ 
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`,
                    transformOrigin: '50% 50%'
                  }}
                >
                  <img 
                    src={src} 
                    alt="Stamp" 
                    className={`${imgSizeClass} w-auto h-auto object-contain filter mix-blend-multiply brightness-[0.82] contrast-[1.15] saturate-[1.2] select-none`}
                  />
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
