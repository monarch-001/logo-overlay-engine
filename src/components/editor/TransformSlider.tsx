'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useDebouncedCallback } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface TransformSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  multiplier?: number; // e.g. 100 for percentage
  onChange: (val: number) => void;
  className?: string;
}

export default function TransformSlider({
  label,
  value,
  min,
  max,
  step = 0.01,
  unit = '',
  multiplier = 1,
  onChange,
  className,
}: TransformSliderProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local value when external value changes (but not during active dragging)
  useEffect(() => {
    if (!isDragging) {
      setLocalValue(value);
    }
  }, [value, isDragging]);

  const debouncedOnChange = useDebouncedCallback((val: number) => {
    onChange(val);
  }, 16); // 16ms for roughly 60fps responsiveness

  const handleSliderChange = (vals: number | number[]) => {
    // Robustly handle the values array from the slider primitive
    const rawVal = Array.isArray(vals) ? vals[0] : vals;
    
    if (typeof rawVal !== 'number' || !Number.isFinite(rawVal)) {
       return;
    }

    const newVal = rawVal / multiplier;
    setLocalValue(newVal);
    debouncedOnChange(newVal);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = parseFloat(e.target.value) / multiplier;
    if (Number.isFinite(newVal)) {
      setLocalValue(newVal);
      onChange(newVal); // Immediate update for manual input for better precision feel
    }
  };

  const displayValue = Math.round(localValue * multiplier * 100) / 100;

  return (
    <div 
      className={cn("group space-y-3 p-1 rounded-xl transition-all duration-300", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-between items-center px-0.5">
        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-slate-200 transition-colors">
          {label}
        </Label>
        
        <div className="flex items-center gap-1.5 bg-slate-950/50 px-2 py-0.5 rounded-md border border-slate-800/50 group-hover:border-indigo-500/30 transition-all">
          <input
            ref={inputRef}
            type="number"
            value={displayValue}
            onChange={handleInputChange}
            className="w-10 bg-transparent text-[10px] text-indigo-400 font-mono text-right outline-none focus:text-white transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-[9px] text-slate-600 font-bold uppercase">{unit}</span>
        </div>
      </div>

      <div className="relative pt-1">
        {/* Animated Background Glow */}
        <AnimatePresence>
          {(isHovered || isDragging) && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute -inset-x-2 -inset-y-3 bg-indigo-500/5 rounded-xl blur-md pointer-events-none"
            />
          )}
        </AnimatePresence>

        <Slider 
          value={[localValue * multiplier]} 
          min={min * multiplier} 
          max={max * multiplier} 
          step={step * multiplier}
          onValueChange={handleSliderChange}
          onPointerDown={() => setIsDragging(true)}
          onPointerUp={() => {
            setIsDragging(false);
            onChange(localValue); // Final sync
          }}
          className={cn(
            "transition-opacity duration-200",
            isDragging ? "opacity-100" : "opacity-90 hover:opacity-100"
          )}
        />
        
        {/* Value Tooltip Bubble */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: -25, scale: 1 }}
              exit={{ opacity: 0, y: 0, scale: 0.8 }}
              style={{ 
                left: `${((localValue - min) / (max - min)) * 100}%`,
                transform: 'translateX(-50%)'
              }}
              className="absolute pointer-events-none z-50 px-2 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-md shadow-xl shadow-indigo-500/40 whitespace-nowrap"
            >
              {displayValue}{unit}
              <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-indigo-600" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
