"use client";
import { useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { RotateCcw, X, ZoomIn } from "lucide-react";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import type { ProfileCrop, ProfileImageField } from "@/lib/profile-media";
import "@/app/ui-tokens.css";
import "./profile-image-cropper.css";
export default function ProfileImageCropper({source,field,pending,error,onCancel,onApply}:{source:string;field:ProfileImageField;pending:boolean;error:string;onCancel:()=>void;onApply:(crop:ProfileCrop)=>void}) {
 const {t}=useI18n();
 const dialog=useRef<HTMLDialogElement>(null);
 const [crop,setCrop]=useState({x:0,y:0}),[zoom,setZoom]=useState(1),[area,setArea]=useState<Area|null>(null);
 const [imageError,setImageError]=useState("");
 useEffect(()=>{dialog.current?.showModal();},[]);
 return <dialog ref={dialog} className="profile-crop-dialog" aria-labelledby="profile-crop-title" onCancel={event=>{event.preventDefault();if(!pending)onCancel();}}>
  <div className="profile-crop-heading"><div><h2 id="profile-crop-title">{field==="avatarUrl"?t("Ajustar foto do perfil"):t("Ajustar capa")}</h2><p>{t("Arraste a imagem e ajuste o zoom para escolher o recorte.")}</p></div><button type="button" className="site-icon-button" disabled={pending} onClick={onCancel} aria-label={t("Fechar")}><X size={18}/></button></div>
  <div className="profile-crop-stage" data-banner={field==="bannerUrl"||undefined} aria-busy={pending} inert={pending}>
   {source&&<Cropper image={source} crop={crop} zoom={zoom} aspect={field==="avatarUrl"?1:4} cropShape={field==="avatarUrl"?"round":"rect"} showGrid={field==="bannerUrl"} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={setArea} onMediaLoaded={media=>{if(media.naturalWidth*media.naturalHeight>40000000)setImageError(t("Esta imagem tem resolução muito alta. Reduza-a antes de adicionar."));}} keyboardStep={10} restrictPosition zoomWithScroll={!pending} style={{containerStyle:{pointerEvents:pending?"none":"auto"}}}/>}
  </div>
  <div className="profile-crop-tools"><label><ZoomIn size={18}/><span>{t("Zoom")}</span><input type="range" min={1} max={3} step={0.01} value={zoom} disabled={pending} onChange={event=>setZoom(Number(event.target.value))}/></label><button type="button" className="workflow-button secondary" disabled={pending} onClick={()=>{setZoom(1);setCrop({x:0,y:0});}}><RotateCcw size={18}/>{t("Redefinir")}</button></div>
  {(error||imageError)&&<p className="profile-crop-error" role="alert">{t(error||imageError)}</p>}
  <div className="profile-crop-actions"><button type="button" className="workflow-button secondary" disabled={pending} onClick={onCancel}>{t("Cancelar")}</button><button type="button" className="workflow-button" disabled={pending||!area||Boolean(imageError)} onClick={()=>area&&onApply({x:area.x/100,y:area.y/100,width:area.width/100,height:area.height/100})}>{pending?t("Enviando imagem…"):t("Aplicar recorte")}</button></div>
 </dialog>;
}
