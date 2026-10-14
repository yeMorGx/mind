"use client";
import {useState} from "react";
import Link from "next/link";
import CreatorBadges from "@/components/ui/CreatorBadges";
import type {BadgeKind} from "@/lib/firebase/badges";
export default function CreatorIdentity({name,avatarUrl,href,badges,username,by=false}:{name:string;avatarUrl?:string;href:string;badges?:BadgeKind[];username?:string;by?:boolean}){
 const [failed,setFailed]=useState<string|null>(null);
 return <Link href={href} className="creator-identity" title={username?`${name} · @${username}`:name}>
  {/* eslint-disable-next-line @next/next/no-img-element -- Public creator avatars include optimized data URLs. */}
  {avatarUrl&&failed!==avatarUrl?<img src={avatarUrl} alt="" loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(avatarUrl)}/>:<span className="creator-identity-initial" aria-hidden="true">{Array.from(name.trim())[0]?.toUpperCase()||"M"}</span>}
  <span className="creator-identity-text"><span className="creator-identity-name">{by&&<span className="creator-identity-by">por </span>}{name}</span>{username&&<span className="creator-identity-handle">@{username}</span>}</span>
  <CreatorBadges badges={badges} compact/>
 </Link>;
}
