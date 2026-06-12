/**
 * Property type definitions
 */

export type YardShape = 'rectangle' | 'l-shape' | 'u-shape' | 'strip' | 'custom';

export type GridScale = 0.5 | 1 | 2; // feet per square

export interface Property {
  id: string;
  name: string;
  userId: string;
  dimensions: {
    width: number; // in feet
    depth: number; // in feet
  };
  shape: YardShape;
  gridScale: GridScale; // feet per square
  createdAt: string;
  updatedAt: string;
}

export interface PropertyPlacement {
  id: string;
  propertyId: string;
  productId: string;
  productType: string;
  x: number; // percentage position (0-100)
  y: number; // percentage position (0-100)
  width: number; // in grid squares
  height: number; // in grid squares
  rotation: number; // degrees
  nickname?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePropertyData {
  name: string;
  dimensions: {
    width: number;
    depth: number;
  };
  shape: YardShape;
  gridScale: GridScale;
}

export interface UpdatePropertyData {
  name?: string;
  dimensions?: {
    width: number;
    depth: number;
  };
  shape?: YardShape;
  gridScale?: GridScale;
}

export interface CreatePlacementData {
  productId: string;
  productType: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  nickname?: string;
}

export interface UpdatePlacementData {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  nickname?: string;
}
