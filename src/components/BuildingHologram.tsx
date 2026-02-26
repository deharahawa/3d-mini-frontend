import React from 'react';
import { motion } from 'framer-motion';

export default function BuildingHologram() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-zinc-950">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]" />
      
      {/* Base Platform */}
      <motion.div 
        className="absolute top-[60%] w-64 h-24 border border-purple-500/50 rounded-[100%] bg-zinc-900/50 shadow-[0_0_50px_rgba(168,85,247,0.2)]"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1 }}
      />
      <motion.div 
        className="absolute top-[62%] w-48 h-16 border-2 border-pink-500/40 rounded-[100%] shadow-[inset_0_0_20px_rgba(236,72,153,0.3)]"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
      />
      
      {/* Hologram Core Container */}
      <div className="relative bottom-[5%] w-64 h-64 flex items-center justify-center perspective-1000">
        
        {/* Orbiting Tech Rings */}
        <motion.div
           animate={{ rotateY: 360, rotateX: 15 }}
           transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
           className="absolute w-32 h-32 border border-dashed border-purple-400/80 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)]"
        />
        <motion.div
           animate={{ rotateY: -360, rotateX: -20 }}
           transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
           className="absolute w-40 h-40 border border-pink-400/50 border-t-pink-400 rounded-full shadow-[inset_0_0_10px_rgba(236,72,153,0.5)]"
        />
        <motion.div
           animate={{ rotateZ: 360, scale: [0.9, 1.1, 0.9] }}
           transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
           className="absolute w-24 h-24 border-2 border-purple-500/30 rounded-full"
        />

        {/* Central Energy Core */}
        <motion.div
           animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
           transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
           className="absolute w-12 h-12 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full blur-md opacity-80"
        />
        <motion.div
           animate={{ scale: [1, 1.5, 1], rotate: 180 }}
           transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
           className="absolute w-6 h-6 bg-white rounded-full blur-sm"
        />
        
        {/* Scanning Laser effect */}
        <motion.div
          animate={{ y: [-80, 80, -80] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute w-48 h-0.5 bg-pink-400 shadow-[0_0_15px_rgba(236,72,153,1)] z-10 flex justify-center"
        >
          {/* Laser beam connecting with base */}
          <div className="w-full h-16 bg-gradient-to-b from-pink-500/40 to-transparent -translate-y-16" />
        </motion.div>
      </div>

      <div className="absolute bottom-16 flex flex-col items-center">
         <motion.div 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center gap-2"
         >
           <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
           <p className="text-purple-300 font-bold tracking-widest uppercase text-xs md:text-sm">
             Materializando Partículas...
           </p>
         </motion.div>
      </div>
{/* 
      <style dangerouslySetInnerHTML={{__html:`
        .perspective-1000 {
          perspective: 1000px;
        }
      `}} /> */}
    </div>
  );
}
