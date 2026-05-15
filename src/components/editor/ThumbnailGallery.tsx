'use client';

import React, { useRef, useEffect, memo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useOverlayStore, OverlayImage } from '@/store/useOverlayStore';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X, CheckCircle2, Clock, Download } from 'lucide-react';

const ThumbnailItem = memo(({ 
  img, 
  isActive, 
  onClick, 
  onRemove 
}: { 
  img: OverlayImage; 
  isActive: boolean; 
  onClick: () => void;
  onRemove: (id: string) => void;
}) => {
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (img.resultUrl) {
      const link = document.createElement('a');
      link.href = img.resultUrl;
      link.download = `processed_${img.file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, x: -20 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      onClick={onClick}
      className={cn(
        "group relative min-w-[180px] h-[100px] rounded-xl overflow-hidden cursor-pointer transition-all duration-500 ring-2",
        isActive 
          ? "ring-indigo-500 shadow-[0_0_25px_-5px_rgba(79,70,229,0.5)] z-20 scale-105" 
          : "ring-slate-800 hover:ring-slate-600 opacity-50 hover:opacity-100 grayscale hover:grayscale-0"
      )}
    >
      <img 
        src={img.preview} 
        alt="Thumbnail" 
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        loading="lazy"
      />
      
      {/* Info Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center justify-between text-[9px] font-bold text-white uppercase tracking-tight">
          <span className="truncate max-w-[100px]">{img.file.name}</span>
          <span className="text-slate-400 px-1.5 py-0.5 bg-black/40 rounded">IMG</span>
        </div>
      </div>

      {/* Status Badges */}
      <div className="absolute top-2 left-2 flex gap-1">
        {img.status === 'completed' && (
          <>
            <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
            <button
              onClick={handleDownload}
              className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-600 transition-colors"
              title="Download processed image"
            >
              <Download className="w-3 h-3 text-white" />
            </button>
          </>
        )}
        {img.status === 'processing' && (
          <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg animate-spin">
            <Clock className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(img.id);
        }}
        className="absolute top-2 right-2 w-5 h-5 bg-red-500/90 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110 z-30 shadow-xl"
      >
        <X className="w-3 h-3 text-white" />
      </button>

      {/* Active Indicator Bar */}
      {isActive && (
        <motion.div 
          layoutId="active-indicator"
          className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500" 
        />
      )}
    </motion.div>
  );
});

ThumbnailItem.displayName = 'ThumbnailItem';

export default function ThumbnailGallery() {
  const images = useOverlayStore(useShallow((state) => state.images));
  const activeImageId = useOverlayStore((state) => state.activeImageId);
  const setActiveImageId = useOverlayStore((state) => state.setActiveImageId);
  const removeImage = useOverlayStore((state) => state.removeImage);
  const { logo, isExporting, exportProgress, setExporting, updateImageStatus, settings } = useOverlayStore();
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleExportAll = async () => {
    if (images.length === 0 || !logo.processed) return;
    
    // Logic similar to ExportManager
    setExporting(true, 0);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const logoBlob = await fetch(logo.processed).then(r => r.blob());
      const logoFile = new File([logoBlob], 'logo.png', { type: 'image/png' });

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        updateImageStatus(img.id, 'processing');
        
        try {
          const formData = new FormData();
          formData.append('image', img.file);
          formData.append('logo', logoFile);
          formData.append('settings', JSON.stringify(settings));

          const response = await fetch('/api/process', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) throw new Error(`Failed to process ${img.file.name}`);

          const resultBlob = await response.blob();
          const resultUrl = URL.createObjectURL(resultBlob);
          const fileName = `processed_${img.file.name.split('.')[0]}.png`;
          zip.file(fileName, resultBlob);
          
          updateImageStatus(img.id, 'completed', resultUrl);
        } catch (err) {
          console.error(err);
          updateImageStatus(img.id, 'error');
        }

        const progress = Math.round(((i + 1) / images.length) * 100);
        setExporting(true, progress);
      }

      const zipContent = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipContent);
      link.download = `overlay_export_${new Date().getTime()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(false, 0);
    }
  };

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (scrollRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        scrollRef.current.scrollLeft += e.deltaY;
      }
    };

    const el = scrollRef.current;
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false });
      return () => el.removeEventListener('wheel', handleWheel);
    }
  }, []);

  if (images.length === 0) return null;

  return (
    <div className="h-44 border-t border-slate-800 bg-slate-900/80 backdrop-blur-2xl px-6 flex items-center gap-6 relative z-10 shrink-0">
      <div className="flex flex-col min-w-[140px] gap-2 border-r border-slate-800 pr-6 mr-2">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] leading-none">Media Queue</span>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-white">{images.length}</span>
          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Items</span>
        </div>
        
        <button
          onClick={handleExportAll}
          disabled={images.length === 0 || !logo.processed || isExporting}
          className="mt-1 flex items-center gap-1.5 px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 disabled:bg-slate-800/50 rounded-md border border-indigo-500/20 disabled:border-slate-700/50 transition-colors group"
        >
           {isExporting ? (
             <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
           ) : (
             <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
           )}
           <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tight group-hover:text-white transition-colors">
             {isExporting ? `Exporting ${exportProgress}%` : 'Process & Export'}
           </span>
        </button>
      </div>


      <ScrollArea className="w-full h-full">
        <div ref={scrollRef} className="flex gap-4 py-6 overflow-x-auto no-scrollbar scroll-smooth">
          <AnimatePresence mode="popLayout">
            {images.map((img) => (
              <ThumbnailItem 
                key={img.id}
                img={img}
                isActive={activeImageId === img.id}
                onClick={() => setActiveImageId(img.id)}
                onRemove={removeImage}
              />
            ))}
          </AnimatePresence>
        </div>
        <ScrollBar orientation="horizontal" className="bg-slate-800" />
      </ScrollArea>
    </div>
  );
}
