"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import { badgeInfo, type BadgeKind } from "@/lib/firebase/badges";
export default function CreatorBadges({ badges = [], labeled = false, compact = false }: { badges?: BadgeKind[]; labeled?: boolean; compact?: boolean }) {
 const { t } = useI18n();

  return <span className="inline-flex flex-wrap items-center gap-2">{badges.map(kind => {
    const info = badgeInfo[kind];
    return <span key={kind} title={t("{v0}: {v1}", {v0: (t(info.label)), v1: (t(info.description))})} aria-label={t(info.label)}
      className={`inline-flex shrink-0 items-center gap-1.5 ${!compact && (labeled || kind === "owner") ? "rounded-full px-2.5 py-1 text-xs font-semibold" : ""}`}
      style={{ color: info.color, background: !compact && (labeled || kind === "owner") ? info.background : undefined }}>
      <span aria-hidden="true" className={`inline-block bg-current ${compact ? "size-[18px]" : "size-6"}`} style={{ mask: `url(/badges/${info.icon}.svg) center / contain no-repeat`, WebkitMask: `url(/badges/${info.icon}.svg) center / contain no-repeat` }} />
      {(!compact && (labeled || kind === "owner")) && t(info.label)}
    </span>;
  })}</span>;
}
