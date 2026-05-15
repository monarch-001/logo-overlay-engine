'use client';

import React, { useRef } from 'react';
import { Card } from '@/components/ui/card';
import { ImageIcon, Plus, X, Image as ImageIconLucide } from 'lucide-react';
import { useOverlayStore } from '@/store/useOverlayStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function BatchUpload() {
  const { images, addImages, removeImage } = useOverlayStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    addImages(Array.from(files));
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e: React.DragEvent) => e.preventDefault();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Batch Images</h3>
        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-800 rounded-full text-indigo-400">
          {images.length} Files
        </span>
      </div>

      <Card 
        onDrop={onDrop}
        onDragOver={onDragOver}
        onClick={() => fileInputRef.current?.click()}
        className="p-4 bg-slate-900 border-slate-800 border-dashed border-2 hover:border-indigo-500/50 transition-colors cursor-pointer group"
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple 
          accept="image/*" 
          onChange={onFileChange} 
        />
        <div className="flex flex-col items-center justify-center py-4 gap-2">
          <Plus className="w-6 h-6 text-slate-500 group-hover:text-indigo-400 transition-colors" />
          <p className="text-xs text-slate-400">Add images or drag folder</p>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence>
          {images.map((img) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative aspect-square rounded-lg bg-slate-900 border border-slate-800 group overflow-hidden"
            >
              <img src={img.preview} alt="Preview" className="w-full h-full object-cover" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(img.id);
                }}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
