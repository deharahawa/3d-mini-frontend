"use client";

import React, { useState, useCallback, useRef } from "react";
import { UploadCloud } from "lucide-react";

interface HeroUploadProps {
  onUploadStart: (file: File, gender: "boy" | "girl", bodyStyle: string) => void;
}

export default function HeroUpload({ onUploadStart }: HeroUploadProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [gender, setGender] = useState<"boy" | "girl">("boy");
  const [bodyStyle, setBodyStyle] = useState<string>("casual");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadStart(e.target.files[0], gender, bodyStyle);
    }
  }, [onUploadStart, gender, bodyStyle]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsHovered(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadStart(e.dataTransfer.files[0], gender, bodyStyle);
    }
  }, [onUploadStart, gender, bodyStyle]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsHovered(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="flex flex-col items-start w-full">
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
        Sua Foto. <br /> Sua Miniatura 3D.
      </h1>
      <p className="text-zinc-400 text-lg leading-relaxed mb-6">
        Faça upload de uma selfie e deixe nossa IA esculpir um colecionável estilo Funko 100% pronto para impressão 3D colorida.
      </p>

      {/* Gender Selection */}
      <div className="flex items-center space-x-4 mb-4">
        <span className="text-zinc-400 font-medium">Gênero:</span>
        <button 
          onClick={() => setGender("boy")}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${gender === "boy" ? "bg-purple-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
        >
          Masculino
        </button>
        <button 
          onClick={() => setGender("girl")}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${gender === "girl" ? "bg-pink-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
        >
          Feminino
        </button>
      </div>

      {/* Body Style Selection */}
      <div className="flex items-center space-x-4 mb-8">
        <span className="text-zinc-400 font-medium">Estilo do Roupa:</span>
        <select 
          value={bodyStyle} 
          onChange={(e) => setBodyStyle(e.target.value)}
          className="bg-zinc-800 text-zinc-200 px-4 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-purple-500 font-semibold transition-all"
        >
          <option value="casual">Casual (Jeans & Hoodie)</option>
          <option value="medico">Médico (Jaleco)</option>
          <option value="terno">Executivo (Terno)</option>
          <option value="wolverine">Wolverine (Easter Egg)</option>
        </select>
      </div>

      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileInput} 
        accept="image/jpeg, image/png, image/webp"
      />

      <div 
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`group relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-2xl transition-all cursor-pointer w-full overflow-hidden
          ${isHovered ? 'border-purple-500 bg-purple-900/20' : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-purple-500/50'}
        `}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <UploadCloud className={`w-12 h-12 mb-4 transition-colors ${isHovered ? 'text-purple-400' : 'text-zinc-500 group-hover:text-purple-400'}`} />
        <p className="font-semibold text-zinc-300">Clique para selecionar ou arraste a foto</p>
        <p className="text-sm text-zinc-500 mt-2">JPG, PNG ou WEBP (Max 5MB)</p>
      </div>
    </div>
  );
}
