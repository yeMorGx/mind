import type { CSSProperties, ReactNode, ReactElement } from "react";
export interface PixelCardProps {
 variant?: "default" | "blue" | "yellow" | "pink"; colors?: string | string[];
 gap?: number; speed?: number; pixelSize?: number; shape?: "square" | "circle" | "diamond";
 origin?: "center" | "pointer"; revealDuration?: number; spotlight?: number; glow?: number;
 glowColor?: string; opacity?: number; fade?: number; trigger?: "hover" | "click" | "always";
 clickPulse?: boolean; intro?: boolean; introDelay?: number; noFocus?: boolean;
 theme?: "dark" | "light"; radius?: number; className?: string; style?: CSSProperties;
 children?: ReactNode; labelledBy?: string;
}
export default function PixelCard(props: PixelCardProps): ReactElement;
