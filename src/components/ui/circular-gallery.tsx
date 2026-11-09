"use client";

import React from "react";
// Re-export or forward to CircularGallery JSX component
import CircularGalleryComponent from "./circular-gallery.jsx";

export interface CircularGalleryItem {
  image: string;
  text?: string;
  description?: string;
  alt?: string;
  id?: string;
  [key: string]: any;
}

export interface CircularGalleryProps extends React.HTMLAttributes<HTMLDivElement> {
  items?: CircularGalleryItem[];
  bend?: number;
  textColor?: string;
  borderRadius?: number;
  font?: string;
  fontUrl?: string;
  scrollSpeed?: number;
  scrollEase?: number;
  itemSize?: number;
  itemAspect?: number;
  gap?: number;
  wave?: number;
  fadeEdges?: number;
  shadow?: number;
  grayscale?: boolean;
  showTitles?: boolean;
  snap?: boolean;
  autoScroll?: number;
  openOnClick?: boolean;
  intro?: boolean;
  onItemClick?: (item: CircularGalleryItem, index: number) => void;
  onActiveChange?: (index: number) => void;
  dpr?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const CircularGallery: React.FC<CircularGalleryProps> = (props) => {
  return <CircularGalleryComponent {...props} />;
};

export default CircularGallery;
