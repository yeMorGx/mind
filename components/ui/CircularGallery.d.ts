import type { CSSProperties } from "react";
export type GalleryItem = { image: string; text?: string; description?: string; alt?: string };
export type CircularGalleryProps = {
  items?: GalleryItem[];
  bend?: number;
  autoScroll?: number;
  showTitles?: boolean;
  itemSize?: number;
  itemAspect?: number;
  borderRadius?: number;
  scrollEase?: number;
  wave?: number;
  dpr?: number;
  intro?: boolean;
  className?: string;
  style?: CSSProperties;
};
export default function CircularGallery(props: CircularGalleryProps): React.JSX.Element;
