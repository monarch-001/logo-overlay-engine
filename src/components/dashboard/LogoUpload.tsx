'use client';

import React, { useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Upload, X, Loader2, CheckCircle2, RefreshCcw } from 'lucide-react';
import { useOverlayStore } from '@/store/useOverlayStore';
import { removeBackground } from '@imgly/background-removal';
import { toast } from 'sonner';

export default function LogoUpload() {
  const { logo, setLogo } = useOverlayStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processLogo = useCallback(async (file: File) => {
    const originalUrl = URL.createObjectURL(file);
    setLogo({ original: originalUrl, processed: null, isProcessing: true });
    
    try {
      toast.info("Removing background...", { description: "Processing AI model in-browser" });
      const blob = await removeBackground(file, {
        publicPath: "https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/",
        progress: (status, progress) => {
          // Some stages report progress as bytes or sequential steps, 
          // we normalize it to a safe 0-100% display or simple status.
          const isFetch = status.startsWith('fetch:');
          const isCompute = status.startsWith('compute:');
          
          let displayProgress = "";
          if (isFetch && progress > 1) {
             // If fetch reports large numbers, it's likely bytes. 
             // Without knowing 'total', we just show the status.
             displayProgress = "Downloading model...";
          } else if (isCompute && progress > 1) {
             // If compute reports > 1, it might be stage steps (100, 200, 300)
             displayProgress = `Processing: ${status.split(':')[1]}...`;
          } else {
             displayProgress = `${status} (${(Math.min(1, progress) * 100).toFixed(0)}%)`;
          }
          console.log(`[AI] ${displayProgress}`);
        }
      });
      const processedUrl = URL.createObjectURL(blob);
      setLogo({ processed: processedUrl, isProcessing: false });
      toast.success("Logo processed!", { description: "Background removed successfully." });
    } catch (error) {
      console.error("Failed to remove background:", error);
      setLogo({ isProcessing: false });
      toast.error("Processing failed", { description: "Could not remove background from this image." });
    }
  }, [setLogo]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processLogo(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processLogo(file);
  };

  const onDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLogo({ original: null, processed: null, isProcessing: false });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Logo Configuration</h3>
        {logo.original && !logo.isProcessing && (
          <button 
            onClick={handleReset}
            className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors"
          >
            <RefreshCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>
      
      {!logo.original ? (
        <Card 
          onDrop={onDrop}
          onDragOver={onDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="p-4 bg-slate-900 border-slate-800 border-dashed border-2 hover:border-indigo-500/50 transition-colors cursor-pointer group relative overflow-hidden"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={onFileChange} 
          />
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-400 transition-colors" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-300">Upload your logo</p>
              <p className="text-xs text-slate-500 mt-1">Drag and drop or click to browse</p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-4 bg-slate-900 border-slate-800 overflow-hidden">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 text-center">
              <p className="text-[10px] uppercase text-slate-500 font-bold">Original</p>
              <div className="aspect-square bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center p-2">
                <img src={logo.original} alt="Original" className="max-w-full max-h-full object-contain" />
              </div>
            </div>
            
            <div className="space-y-2 text-center">
              <p className="text-[10px] uppercase text-slate-500 font-bold">Transparent</p>
              <div 
                className="aspect-square rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center p-2 relative bg-slate-800"
                style={{
                  backgroundImage: `
                    linear-gradient(45deg, #1e293b 25%, transparent 25%),
                    linear-gradient(-45deg, #1e293b 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #1e293b 75%),
                    linear-gradient(-45deg, transparent 75%, #1e293b 75%)
                  `,
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                }}
              >
                {logo.isProcessing ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm gap-2">
                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                    <span className="text-[10px] text-slate-400">AI REMOVING...</span>
                  </div>
                ) : logo.processed ? (
                  <>
                    <img src={logo.processed} alt="Processed" className="max-w-full max-h-full object-contain" />
                    <div className="absolute top-1 right-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
                    </div>
                  </>
                ) : (
                   <div className="text-slate-600 text-[10px]">FAILED</div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
