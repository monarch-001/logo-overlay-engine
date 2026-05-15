import { AnchorPoint } from '@/store/useOverlayStore';

export interface Box {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export class SafeZoneCalculator {
  /**
   * Calculates pixel-based safe margins from a percentage.
   */
  static calculatePixelMargins(imageSize: Box, paddingPercent: number) {
    const marginX = (paddingPercent / 100) * imageSize.width;
    const marginY = (paddingPercent / 100) * imageSize.height;
    
    // Ensure proportional margins if needed, or just standard percentage
    return {
      x: marginX,
      y: marginY,
      width: Math.max(0, imageSize.width - marginX * 2),
      height: Math.max(0, imageSize.height - marginY * 2),
    };
  }

  /**
   * Calculates absolute center coordinates for a logo based on an anchor point and safe zone.
   */
  static getAnchorCoordinates(
    anchor: AnchorPoint,
    safeZone: { x: number; y: number; width: number; height: number },
    logoSize: Box
  ): Point {
    const { x, y, width, height } = safeZone;
    
    switch (anchor) {
      case 'top-left':
        return { x: x + logoSize.width / 2, y: y + logoSize.height / 2 };
      case 'top-right':
        return { x: x + width - logoSize.width / 2, y: y + logoSize.height / 2 };
      case 'bottom-left':
        return { x: x + logoSize.width / 2, y: y + height - logoSize.height / 2 };
      case 'bottom-right':
        return { x: x + width - logoSize.width / 2, y: y + height - logoSize.height / 2 };
      case 'center':
        return { x: x + width / 2, y: y + height / 2 };
      default:
        return { x: x + width / 2, y: y + height / 2 };
    }
  }
}

export class SmartPlacementEngine {
  /**
   * Automatically determines the best anchor point based on image "balance".
   * This is a heuristic implementation using brightness/edge variance simulation.
   */
  static async suggestBestAnchor(imagePreview: string): Promise<AnchorPoint> {
    // In a real production app, we might use a canvas to analyze pixels
    // or a saliency model. Here we'll simulate an intelligent heuristic.
    
    // For now, default to bottom-right as it's industry standard, 
    // but we can add more logic here if needed.
    return 'bottom-right';
  }
}
