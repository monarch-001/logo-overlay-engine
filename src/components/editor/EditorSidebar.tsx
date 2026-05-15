'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Wand2, Image as ImageIcon, LayoutGrid, Maximize, ShieldCheck, Download, Settings2 } from 'lucide-react';
import LogoUpload from '@/components/dashboard/LogoUpload';
import BatchUpload from '@/components/dashboard/BatchUpload';
import CanvasEditor from '@/components/dashboard/CanvasEditor';
import ExportManager from '@/components/dashboard/ExportManager';
import { useOverlayStore } from '@/store/useOverlayStore';
import { Separator } from '@/components/ui/separator';

export default function EditorSidebar() {
  const logo = useOverlayStore((state) => state.logo);

  return (
    <aside className="w-[380px] border-r border-slate-800 bg-slate-900/50 flex flex-col h-screen overflow-hidden shrink-0 z-40">
      {/* Sticky Header */}
      <div className="p-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Settings2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 uppercase tracking-tighter">
              Editor Configuration
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">V2.0 Core Engine</p>
          </div>
        </div>
      </div>

      {/* Independently Scrollable Area */}
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6 pb-20">
          <Accordion type="multiple" defaultValue={['logo', 'batch', 'transform']} className="space-y-4">
            <AccordionItem value="logo" className="border-none bg-slate-950/30 rounded-2xl p-2 px-4 transition-all hover:bg-slate-950/50">
              <AccordionTrigger className="hover:no-underline py-3 group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                    <Wand2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">Logo Asset</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <LogoUpload />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="batch" className="border-none bg-slate-950/30 rounded-2xl p-2 px-4 transition-all hover:bg-slate-950/50">
              <AccordionTrigger className="hover:no-underline py-3 group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">Batch Media</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <BatchUpload />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="transform" className={cn(
              "border-none bg-slate-950/30 rounded-2xl p-2 px-4 transition-all hover:bg-slate-950/50",
              !logo.processed && "opacity-50 grayscale pointer-events-none"
            )}>
              <AccordionTrigger className="hover:no-underline py-3 group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                    <Maximize className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">Smart Transform</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <CanvasEditor />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </ScrollArea>

      {/* Sticky Bottom Actions */}
      <div className="p-6 border-t border-slate-800 bg-slate-900/80 backdrop-blur-xl shrink-0">
        <ExportManager />
      </div>
    </aside>
  );
}

