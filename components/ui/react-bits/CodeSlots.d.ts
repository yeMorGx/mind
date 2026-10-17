import type { ComponentType } from "react";
declare const CodeSlots: ComponentType<{value?:string;onChange?:(code:string)=>void;onComplete?:(code:string)=>void;status?:"idle"|"error"|"success";disabled?:boolean;autoFocus?:boolean;id?:string;required?:boolean;ariaLabel?:string;className?:string}>;
export default CodeSlots;
