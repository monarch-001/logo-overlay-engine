'use client';

import React, { useEffect, useState, useRef, useMemo, memo } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer, Rect, Group } from 'react-konva';
import useImage from 'use-image';
import { useShallow } from 'zustand/react/shallow';
import { useOverlayStore } from '@/store/useOverlayStore';
import { SafeZoneCalculator } from '@/lib/placement/SafeZoneCalculator';
import { Wand2, Plus, Zap, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CanvasSettings } from '@/store/useOverlayStore';

interface LogoComponentProps {
  url: string;
  settings: CanvasSettings;
  onTransform: (settings: Partial<CanvasSettings>) => void;
  containerSize: { width: number; height: number };
  offset: { x: number; y: number };
}

const LogoComponent = memo(({ url, settings, onTransform, containerSize, offset }: LogoComponentProps) => {
  const [image] = useImage(url);
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [image]);

  if (!image) return null;

  // Calculate position based on mode
  const safeZone = SafeZoneCalculator.calculatePixelMargins(containerSize, settings.padding);
  
  let absX, absY;
  
  if (settings.placementMode === 'smart') {
    const logoBaseWidth = containerSize.width * settings.scale;
    const logoBaseHeight = logoBaseWidth / (image.width / image.height);
    const coords = SafeZoneCalculator.getAnchorCoordinates(
      settings.anchor, 
      safeZone, 
      { width: logoBaseWidth, height: logoBaseHeight }
    );
    absX = coords.x + offset.x;
    absY = coords.y + offset.y;
  } else {
    absX = (settings.x / 100) * containerSize.width + offset.x;
    absY = (settings.y / 100) * containerSize.height + offset.y;
  }
  
  const baseWidth = containerSize.width * settings.scale;
  const aspectRatio = image.width / image.height;
  const baseHeight = baseWidth / aspectRatio;

  return (
    <Group>
      <KonvaImage
        image={image}
        ref={shapeRef}
        x={absX}
        y={absY}
        width={baseWidth}
        height={baseHeight}
        offsetX={baseWidth / 2}
        offsetY={baseHeight / 2}
        rotation={settings.rotation}
        opacity={settings.opacity}
        draggable={settings.placementMode === 'manual'}
        perfectDrawEnabled={false} // Performance optimization for dragging
        onDragMove={(e) => {
          onTransform({
            x: ((e.target.x() - offset.x) / containerSize.width) * 100,
            y: ((e.target.y() - offset.y) / containerSize.height) * 100,
            anchor: 'custom'
          });
        }}
        onTransform={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const newWidth = node.width() * scaleX;
          const newScale = newWidth / containerSize.width;
          
          onTransform({
            scale: newScale,
            rotation: node.rotation(),
            x: ((node.x() - offset.x) / containerSize.width) * 100,
            y: ((node.y() - offset.y) / containerSize.height) * 100,
          });
          
          node.scaleX(1);
          node.scaleY(1);
        }}
      />
      <Transformer
        ref={trRef}
        rotateEnabled={true}
        enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
        borderStroke="#4f46e5"
        anchorStroke="#4f46e5"
        anchorFill="#ffffff"
        anchorSize={8}
        ignoreStroke={true}
        boundBoxFunc={(oldBox, newBox) => {
          if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
            return oldBox;
          }
          return newBox;
        }}
      />
    </Group>
  );
});

LogoComponent.displayName = 'LogoComponent';

export default function PreviewCanvas() {
  const { logo, settings, updateSettings } = useOverlayStore(useShallow((state) => ({
    logo: state.logo,
    settings: state.settings,
    updateSettings: state.updateSettings,
  })));
  
  const images = useOverlayStore((state) => state.images);
  const activeImageId = useOverlayStore((state) => state.activeImageId);

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);

  const activeImage = useMemo(() => images.find(img => img.id === activeImageId) || images[0], [images, activeImageId]);
  const [bgImage] = useImage(activeImage?.preview || '');

  const handleDownloadCurrent = () => {
    if (stageRef.current) {
      const dataURL = stageRef.current.toDataURL({
        pixelRatio: 2, // High quality
      });
      const link = document.createElement('a');
      link.download = `overlay_${activeImage?.file.name || 'image'}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (images.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-6 p-12 text-center animate-in fade-in zoom-in-95 duration-700">
        <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center border border-slate-800 shadow-2xl relative group">
          <div className="absolute inset-0 bg-indigo-500/10 rounded-3xl animate-pulse group-hover:bg-indigo-500/20 transition-colors" />
          <Plus className="w-10 h-10 text-slate-700 group-hover:text-indigo-500 transition-colors" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-200">No images uploaded</h3>
          <p className="text-sm text-slate-500 max-w-xs">
            Upload a batch of images in the sidebar to begin your branding workflow.
          </p>
        </div>
      </div>
    );
  }

  let stagePos = { x: 0, y: 0 };
  let stageSize = { width: containerSize.width, height: containerSize.height };

  if (bgImage && containerSize.width > 0) {
    const padding = 80;
    const availableWidth = containerSize.width - padding * 2;
    const availableHeight = containerSize.height - padding * 2;
    
    const scaleX = availableWidth / bgImage.width;
    const scaleY = availableHeight / bgImage.height;
    const stageScale = Math.min(scaleX, scaleY);
    
    stageSize = {
      width: bgImage.width * stageScale,
      height: bgImage.height * stageScale,
    };

    stagePos = {
      x: (containerSize.width - stageSize.width) / 2,
      y: (containerSize.height - stageSize.height) / 2,
    };
  }

  const safeZone = SafeZoneCalculator.calculatePixelMargins(stageSize, settings.padding);

  return (
    <div ref={containerRef} className="w-full h-full relative flex items-center justify-center bg-slate-950 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.05),transparent)] pointer-events-none" />
      
      {containerSize.width > 0 && (
        <Stage
          ref={stageRef}
          width={containerSize.width}
          height={containerSize.height}
          className="shadow-2xl"
        >
          {/* Static Background Layer */}
          <Layer listening={false}>
            {bgImage && (
              <Rect
                x={stagePos.x}
                y={stagePos.y}
                width={stageSize.width}
                height={stageSize.height}
                fill="#111827"
                shadowBlur={30}
                shadowColor="black"
                shadowOpacity={0.5}
              />
            )}

            {bgImage && (
              <KonvaImage
                image={bgImage}
                x={stagePos.x}
                y={stagePos.y}
                width={stageSize.width}
                height={stageSize.height}
              />
            )}

            {/* Smart Safe Area Guides */}
            {bgImage && (
               <Group opacity={0.3}>
                  <Rect
                    x={stagePos.x + safeZone.x}
                    y={stagePos.y + safeZone.y}
                    width={safeZone.width}
                    height={safeZone.height}
                    stroke="#4f46e5"
                    strokeWidth={1}
                    dash={[8, 4]}
                  />
                  {['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'].map((a) => {
                    const coords = SafeZoneCalculator.getAnchorCoordinates(a as any, safeZone, { width: 0, height: 0 });
                    return (
                      <Rect
                        key={a}
                        x={stagePos.x + coords.x - 3}
                        y={stagePos.y + coords.y - 3}
                        width={6}
                        height={6}
                        fill={settings.anchor === a ? "#4f46e5" : "#334155"}
                        rotation={45}
                        opacity={settings.anchor === a ? 1 : 0.5}
                      />
                    );
                  })}
               </Group>
            )}
          </Layer>

          {/* Interactive Logo Layer */}
          <Layer>
            {logo.processed && (
              <LogoComponent
                url={logo.processed}
                settings={settings}
                containerSize={stageSize}
                offset={stagePos}
                onTransform={(newSettings: any) => {
                  updateSettings(newSettings);
                }}
              />
            )}
          </Layer>
        </Stage>
      )}

      {/* Floating Mode Indicator & Actions */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
         <div className={cn(
           "px-3 py-1.5 rounded-full border flex items-center gap-2 transition-all duration-300 pointer-events-auto",
           settings.placementMode === 'smart' 
            ? "bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)]" 
            : "bg-slate-800/50 border-slate-700/50 text-slate-400"
         )}>
           <Zap className={cn("w-3 h-3", settings.placementMode === 'smart' && "animate-pulse")} />
           <span className="text-[10px] font-bold uppercase tracking-widest">
             {settings.placementMode === 'smart' ? 'Smart Placement Active' : 'Manual Placement'}
           </span>
         </div>

         <div className="flex gap-2 pointer-events-auto">
            <button
              onClick={handleDownloadCurrent}
              disabled={!logo.processed}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              Download Current
            </button>
         </div>
      </div>
      
      {!logo.processed && logo.original && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-md z-20">
           <div className="bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 text-center">
             <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center relative">
               <Wand2 className="w-8 h-8 text-indigo-500 animate-spin" />
               <div className="absolute inset-0 border-2 border-indigo-500 rounded-2xl animate-ping opacity-20" />
             </div>
             <div className="space-y-1">
               <h4 className="font-bold text-slate-200">AI Processing</h4>
               <p className="text-xs text-slate-500">Removing logo background...</p>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}

