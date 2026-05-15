import { create } from 'zustand';

export type OverlayImage = {
  id: string;
  file: File;
  preview: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  resultUrl?: string;
  progress?: number;
  width?: number;
  height?: number;
  settings?: CanvasSettings;
};

export type AnchorPoint = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'custom';

export type CanvasSettings = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  padding: number; // This acts as the "Safe Margin" percentage
  anchor: AnchorPoint;
  placementMode: 'manual' | 'smart';
};

interface OverlayState {
  logo: {
    original: string | null;
    processed: string | null;
    isProcessing: boolean;
    width?: number;
    height?: number;
  };
  images: OverlayImage[];
  activeImageId: string | null;
  settings: CanvasSettings;
  batchMode: boolean;
  isExporting: boolean;
  exportProgress: number;
  
  // Actions
  setLogo: (logo: Partial<OverlayState['logo']>) => void;
  addImages: (files: File[]) => void;
  removeImage: (id: string) => void;
  setActiveImageId: (id: string | null) => void;
  updateImageStatus: (id: string, status: OverlayImage['status'], resultUrl?: string, progress?: number) => void;
  setExporting: (isExporting: boolean, progress?: number) => void;
  updateSettings: (settings: Partial<CanvasSettings>) => void;
  setBatchMode: (mode: boolean) => void;
  reset: () => void;
}

const initialSettings: CanvasSettings = {
  x: 50,
  y: 50,
  scale: 0.15,
  rotation: 0,
  opacity: 1,
  padding: 5, // 5% default safe margin
  anchor: 'bottom-right',
  placementMode: 'smart',
};

export const useOverlayStore = create<OverlayState>((set) => ({
  logo: {
    original: null,
    processed: null,
    isProcessing: false,
  },
  images: [],
  activeImageId: null,
  settings: initialSettings,
  batchMode: true,
  isExporting: false,
  exportProgress: 0,

  setLogo: (logo) => set((state) => ({ logo: { ...state.logo, ...logo } })),

  addImages: (files) => set((state) => {
    const newImages = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      status: 'idle' as const,
      settings: { ...state.settings },
    }));
    
    const updatedImages = [...state.images, ...newImages];
    return { 
      images: updatedImages,
      activeImageId: state.activeImageId || (updatedImages.length > 0 ? updatedImages[0].id : null)
    };
  }),

  removeImage: (id) => set((state) => {
    const filteredImages = state.images.filter((img) => img.id !== id);
    let nextActiveId = state.activeImageId;
    if (state.activeImageId === id) {
      nextActiveId = filteredImages.length > 0 ? filteredImages[0].id : null;
    }
    return { 
      images: filteredImages,
      activeImageId: nextActiveId
    };
  }),

  setActiveImageId: (id) => set({ activeImageId: id }),

  updateImageStatus: (id, status, resultUrl, progress) => set((state) => ({
    images: state.images.map((img) => 
      img.id === id ? { ...img, status, resultUrl, progress } : img
    ),
  })),

  setExporting: (isExporting, progress = 0) => set({ isExporting, exportProgress: progress }),

  updateSettings: (newSettings) => set((state) => {
    const currentSettings = (!state.batchMode && state.activeImageId)
      ? state.images.find(img => img.id === state.activeImageId)?.settings || state.settings
      : state.settings;

    const merged = { ...currentSettings, ...newSettings };
    
    // Defensive validation for all numeric fields
    const validated = { ...merged };
    const validate = (val: unknown, fallback: number, min: number, max: number) => {
      if (typeof val !== 'number' || !Number.isFinite(val)) {
        return fallback;
      }
      return Math.min(Math.max(val, min), max);
    };

    validated.x = validate(merged.x, currentSettings.x, -100, 200);
    validated.y = validate(merged.y, currentSettings.y, -100, 200);
    validated.scale = validate(merged.scale, currentSettings.scale, 0.001, 5);
    validated.rotation = validate(merged.rotation, currentSettings.rotation, -3600, 3600);
    validated.opacity = validate(merged.opacity, currentSettings.opacity, 0, 1);
    validated.padding = validate(merged.padding, currentSettings.padding, 0, 50);

    if (!state.batchMode && state.activeImageId) {
      return {
        images: state.images.map(img => 
          img.id === state.activeImageId ? { ...img, settings: validated } : img
        )
      };
    }

    return { settings: validated };
  }),

  setBatchMode: (batchMode) => set((state) => {
    if (!batchMode) {
      // When turning OFF batch mode, sync current global settings to all images
      // so they start their independent editing from the current state.
      return { 
        batchMode,
        images: state.images.map(img => ({ ...img, settings: { ...state.settings } }))
      };
    }
    return { batchMode };
  }),

  reset: () => set({
    logo: { original: null, processed: null, isProcessing: false },
    images: [],
    activeImageId: null,
    settings: initialSettings,
    batchMode: true,
    isExporting: false,
    exportProgress: 0,
  }),
}));
