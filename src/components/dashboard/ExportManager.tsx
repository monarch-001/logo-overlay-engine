'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useOverlayStore } from '@/store/useOverlayStore';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import JSZip from 'jszip';

export default function ExportManager() {
  const { 
    images, 
    logo, 
    settings, 
    isExporting, 
    exportProgress, 
    setExporting,
    updateImageStatus 
  } = useOverlayStore();

  const handleExport = async () => {
    if (images.length === 0 || !logo.processed) {
      toast.error("Missing data", { description: "Please upload a logo and at least one image." });
      return;
    }

    setExporting(true, 0);
    toast.info("Starting batch process", { description: `Processing ${images.length} images...` });

    try {
      // 1. Check for Directory Picker support (Laptop/Desktop feature)
      let dirHandle: any = null;
      const supportsFileSystemAccess = 'showDirectoryPicker' in window;
      
      if (supportsFileSystemAccess) {
        try {
          dirHandle = await (window as any).showDirectoryPicker({
            mode: 'readwrite',
            startIn: 'pictures'
          });
        } catch (e) {
          console.warn("Directory picker cancelled or failed, falling back to ZIP");
        }
      }

      const zip = !dirHandle ? new JSZip() : null;
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
          
          const now = new Date();
          const timestamp = now.toISOString().replace(/[-T:]/g, '').split('.')[0] + '_' + now.getMilliseconds();
          const baseName = img.file.name.split('.')[0];
          const fileName = `processed_${baseName}_${timestamp}.png`;
          
          if (dirHandle) {
            // DIRECT SAVE TO SYSTEM FOLDER
            const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(resultBlob);
            await writable.close();
          } else if (zip) {
            // FALLBACK TO ZIP (for Mobile/Safari)
            zip.file(fileName, resultBlob);
          }
          
          updateImageStatus(img.id, 'completed', URL.createObjectURL(resultBlob));
        } catch (err) {
          console.error(err);
          updateImageStatus(img.id, 'error');
        }

        const progress = Math.round(((i + 1) / images.length) * 100);
        setExporting(true, progress);
      }

      if (zip) {
        toast.info("Generating ZIP archive...");
        const zipContent = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipContent);
        link.download = `overlay_export_${new Date().getTime()}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast.success(dirHandle ? "Saved to folder!" : "Export complete!", { 
        description: dirHandle ? "All images saved directly to your system." : "All images processed and downloaded as ZIP." 
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export failed", { description: "An error occurred during batch processing." });
    } finally {
      setExporting(false, 0);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      {isExporting && (
        <div className="w-48 space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
            <span>Processing Batch...</span>
            <span>{exportProgress}%</span>
          </div>
          <Progress value={exportProgress} className="h-1 bg-slate-800" />
        </div>
      )}
      
      <Button 
        onClick={handleExport}
        disabled={images.length === 0 || !logo.processed || isExporting}
        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-lg shadow-indigo-500/20 disabled:bg-slate-800 disabled:text-slate-500"
      >
        {isExporting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Export Batch ({images.length})
          </>
        )}
      </Button>
    </div>
  );
}
