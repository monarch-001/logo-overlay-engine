'use client';

import React from 'react';
import { Layers } from 'lucide-react';
import EditorSidebar from '@/components/editor/EditorSidebar';
import ThumbnailGallery from '@/components/editor/ThumbnailGallery';
import dynamic from 'next/dynamic';

const PreviewCanvas = dynamic(() => import('@/components/editor/PreviewCanvas'), {
  ssr: false,
});

export default function Dashboard() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-50">
      {/* App Header */}
      <header className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-xl z-30 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-sm font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Overlay Engine <span className="text-indigo-500 font-medium ml-1">Pro</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="px-3 py-1 bg-slate-800/50 border border-slate-700/50 rounded-full flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">System Ready</span>
           </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Professional Vertical Sidebar */}
        <EditorSidebar />

        {/* Workspace Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-950">
          {/* Main Canvas Workspace */}
          <main className="flex-1 relative overflow-hidden">
             <PreviewCanvas />
          </main>

          {/* Bottom Thumbnail Strip */}
          <ThumbnailGallery />
        </div>
      </div>
    </div>
  );
}
