"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import CreatorBadges from "@/components/ui/CreatorBadges";
import type { CreatorProfile } from "@/lib/firebase/publication";

const Lanyard = dynamic(() => import("@/components/ui/Lanyard"), { ssr: false });

export default function CreatorLanyard({ profile, href }: { profile: CreatorProfile; href: string }) {
  const [texture, setTexture] = useState("");
  const router = useRouter();
  const owner = profile.badges?.includes("owner");
  useEffect(() => {
    let alive = true;
    const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 720;
    const context = canvas.getContext("2d");
    if (!context) return;
    function paint(image?: HTMLImageElement) {
      if (!context || !alive) return;
      context.fillStyle = "#f7f7f9"; context.fillRect(0, 0, 512, 720);
      context.fillStyle = "#151519"; context.font = "bold 34px sans-serif"; context.fillText("MIND", 44, 92);
      context.fillStyle = "#e8e5ef"; context.fillRect(44, 126, 424, 424);
      if (image) {
        const side = Math.min(image.naturalWidth, image.naturalHeight);
        context.drawImage(image, (image.naturalWidth-side)/2, (image.naturalHeight-side)/2, side, side, 44, 126, 424, 424);
      } else { context.fillStyle = "#5d547a"; context.font = "bold 150px sans-serif"; context.textAlign = "center"; context.fillText(Array.from(profile.name)[0]?.toUpperCase() || "M", 256, 391); context.textAlign = "left"; }
      context.fillStyle = "#151519"; context.font = "bold 30px sans-serif";
      let name = profile.name; while (context.measureText(name).width > 424 && name.length > 1) name = name.slice(0,-2) + "…";
      context.fillText(name, 44, 606);
      context.fillStyle = owner ? "#a66805" : "#696474"; context.font = "20px sans-serif"; context.fillText(owner ? "FUNDADOR DO MIND" : "CRIADOR DE PROMPTS", 44, 650);
      try { setTexture(canvas.toDataURL("image/png")); } catch { /* The visible profile link remains available if a remote avatar blocks canvas access. */ }
    }
    paint();
    if (profile.avatarUrl) {
      const image = new Image(); image.crossOrigin = "anonymous"; image.onload = () => paint(image); image.src = profile.avatarUrl;
    }
    return () => { alive = false; };
  }, [profile.name, profile.avatarUrl, owner]);

  return <aside aria-label="Criador do prompt" className="creator-lanyard-shell">
    <div className="creator-lanyard-scene">
      <div className="creator-lanyard-fallback" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- Profile photo fallback when WebGL is unavailable. */}
        {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : <span>{Array.from(profile.name)[0]?.toUpperCase()}</span>}
      </div>
      <Lanyard frontImage={texture || undefined} backImage={texture || undefined} size={0.52} strapLength={0.25} breeze={0.18} damping={0.7} intro={false}
        metal={owner ? "gold" : "silver"} strapColor={owner ? "#4e3b18" : "#25232f"} onCardClick={() => router.push(href)} />
    </div>
    <Link href={href} className="mx-3 block rounded-xl px-3 py-3 text-center focus-visible:outline-2 focus-visible:outline-white">
      <span className="block text-sm font-medium">{profile.name}</span>
      <span className="mt-2 flex justify-center"><CreatorBadges badges={profile.badges} /></span>
      <span className="mt-2 inline-flex items-center gap-1 text-xs text-white/60">Ver perfil do criador <ArrowUpRight size={13} /></span>
    </Link>
  </aside>;
}
