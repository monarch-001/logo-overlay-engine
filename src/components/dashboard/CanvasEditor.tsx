'use client';

import { useShallow } from 'zustand/react/shallow';
import { useOverlayStore, AnchorPoint } from '@/store/useOverlayStore';
import { LayoutGrid, Maximize, ShieldCheck, Zap } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import TransformSlider from '@/components/editor/TransformSlider';

export default function CanvasEditor() {
  const settings = useOverlayStore(useShallow((state) => state.settings));
  const updateSettings = useOverlayStore((state) => state.updateSettings);

  const anchors: { label: string; value: AnchorPoint; icon: string }[] = [
    { label: 'TL', value: 'top-left', icon: '↖' },
    { label: 'TR', value: 'top-right', icon: '↗' },
    { label: 'BL', value: 'bottom-left', icon: '↙' },
    { label: 'BR', value: 'bottom-right', icon: '↘' },
    { label: 'C', value: 'center', icon: '·' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Placement Mode Toggle */}
      <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
             <Zap className={`w-4 h-4 transition-colors ${settings.placementMode === 'smart' ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]' : 'text-slate-500'}`} />
             <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Smart Placement</span>
          </div>
          <Switch 
            checked={settings.placementMode === 'smart'}
            onCheckedChange={(checked) => updateSettings({ placementMode: checked ? 'smart' : 'manual' })}
          />
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
          {settings.placementMode === 'smart' 
            ? "Automatically anchors the logo to safe-zones with intelligent scaling." 
            : "Free movement enabled. Manual adjustments will override anchor points."}
        </p>
      </div>

      {/* Anchor Points */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <LayoutGrid className="w-3 h-3" />
          Anchor Points
        </h3>
        <ToggleGroup 
          type="single" 
          value={settings.anchor as any} 
          onValueChange={(val) => val && updateSettings({ anchor: val as AnchorPoint })}
          className="grid grid-cols-5 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-900"
        >
          {anchors.map((a) => (
            <ToggleGroupItem 
              key={a.value} 
              value={a.value}
              className="h-10 text-[10px] font-black data-[state=on]:bg-indigo-600 data-[state=on]:text-white transition-all duration-300"
            >
              {a.icon}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="space-y-6">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Maximize className="w-3 h-3" />
          Transform
        </h3>
        
        <div className="space-y-4">
          <TransformSlider 
            label="Logo Scale"
            value={settings.scale}
            min={0.01}
            max={1}
            multiplier={100}
            unit="%"
            onChange={(val) => updateSettings({ scale: val })}
          />

          <TransformSlider 
            label="Opacity"
            value={settings.opacity}
            min={0}
            max={1}
            multiplier={100}
            unit="%"
            onChange={(val) => updateSettings({ opacity: val })}
          />

          <TransformSlider 
            label="Rotation"
            value={settings.rotation}
            min={0}
            max={360}
            unit="°"
            onChange={(val) => updateSettings({ rotation: val })}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <ShieldCheck className="w-3 h-3" />
          Safe Area
        </h3>
        <div className="space-y-4">
          <TransformSlider 
            label="Dynamic Margin"
            value={settings.padding}
            min={0}
            max={25}
            multiplier={1}
            unit="%"
            onChange={(val) => updateSettings({ padding: val })}
          />
          <p className="text-[9px] text-slate-600 italic font-medium">Margin is calculated relative to image resolution.</p>
        </div>
      </div>
    </div>
  );
}
