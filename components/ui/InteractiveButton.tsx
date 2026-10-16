import { ArrowUpRight } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

export default function InteractiveButton({ children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={`interactive-button ${className}`} {...props}><span className="interactive-button-dot" aria-hidden="true"/><span>{children}</span><ArrowUpRight size={17} aria-hidden="true"/></button>;
}
