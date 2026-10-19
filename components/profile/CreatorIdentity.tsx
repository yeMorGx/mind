"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import {forwardRef,useState,type ComponentPropsWithoutRef} from "react";
import Link from "next/link";
import CreatorBadges from "@/components/ui/CreatorBadges";
import type {BadgeKind} from "@/lib/firebase/badges";
type Props={name:string;avatarUrl?:string;href:string;badges?:BadgeKind[];username?:string;by?:boolean}&Omit<ComponentPropsWithoutRef<typeof Link>,"href"|"children">;
const CreatorIdentity=forwardRef<HTMLAnchorElement,Props>(function CreatorIdentity({name,avatarUrl,href,badges,username,by=false,className="",...props},ref){
 const { t } = useI18n();

 const [failed,setFailed]=useState<string|null>(null);
 return <Link {...props} ref={ref} href={href} className={`creator-identity ${className}`} title={username?t("{v0} · @{v1}", {v0: (name), v1: (username)}):name}>
  {/* eslint-disable-next-line @next/next/no-img-element -- Public creator avatars include optimized data URLs. */}
  {avatarUrl&&failed!==avatarUrl?<img src={avatarUrl} alt="" loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(avatarUrl)}/>:<span className="creator-identity-initial" aria-hidden="true">{Array.from(name.trim())[0]?.toUpperCase()||t("M")}</span>}
  <span className="creator-identity-text"><span className="creator-identity-name-row"><span className="creator-identity-name">{by&&<span className="creator-identity-by">{t("por")}{" "}</span>}{name}</span><CreatorBadges badges={badges} compact/></span>{username&&<span className="creator-identity-handle">@{username}</span>}</span>
 </Link>;
});
export default CreatorIdentity;
