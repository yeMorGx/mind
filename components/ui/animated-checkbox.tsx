"use client";
// Adapted from Spell UI (MIT); native input preserves forms and keyboard behavior.
import { motion, useReducedMotion } from "framer-motion";
import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import "./animated-checkbox.css";
type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "title" | "children"> & {
 title?: ReactNode; children?: ReactNode; onCheckedChange?: (checked: boolean) => void;
};
export function AnimatedCheckbox({ title, children, checked, defaultChecked = false, className, onCheckedChange, onChange, disabled, ...props }: Props) {
 const [inner, setInner] = useState(defaultChecked), reduce = useReducedMotion();
 const active = checked ?? inner;
 return <label className={cn("animated-checkbox", className)} data-disabled={disabled || undefined}>
  <input {...props} type="checkbox" checked={active} disabled={disabled} onChange={event => { setInner(event.target.checked); onCheckedChange?.(event.target.checked); onChange?.(event); }}/>
  <span className="animated-checkbox-box" aria-hidden="true"><svg viewBox="0 0 20 20"><motion.path d="M 0 4.5 L 3.182 8 L 10 0" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" transform="translate(5 6)" initial={false} animate={{pathLength:active?1:0,opacity:active?1:0}} transition={{pathLength:{ease:"easeOut",duration:reduce?0:.3},opacity:{duration:0}}}/></svg></span>
  <span className="animated-checkbox-label">{children ?? title}</span>
 </label>;
}
