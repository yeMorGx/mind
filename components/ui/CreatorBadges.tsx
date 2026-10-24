"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import { badgeInfo, badgeKinds, type BadgeKind } from "@/lib/badges";
import "@/app/ui-tokens.css";
export default function CreatorBadges({ badges = [], labeled = false, compact = false }: { badges?: BadgeKind[]; labeled?: boolean; compact?: boolean }) {
 const { t } = useI18n();

  return <span className="inline-flex flex-wrap items-center gap-2">{badgeKinds.filter(kind => badges.includes(kind)).map(kind => {
    const info = badgeInfo[kind];
    if (!info) return null;
    return <span key={kind} title={t("{v0}: {v1}", {v0: (t(info.label)), v1: (t(info.description))})} aria-label={t(info.label)}
      className={`inline-flex shrink-0 items-center gap-1.5 ${!compact && (labeled || kind === "owner") ? "rounded-full px-2.5 py-1 text-xs font-semibold" : ""}`}
      style={{ color: info.color, background: !compact && (labeled || kind === "owner") ? info.background : undefined }}>
      <span aria-hidden="true" className="inline-block bg-current" style={{ width: compact ? "var(--ui-badge-compact-size)" : "var(--ui-badge-icon-size)", height: compact ? "var(--ui-badge-compact-size)" : "var(--ui-badge-icon-size)", mask: `url(/badges/${info.icon}.svg) center / contain no-repeat`, WebkitMask: `url(/badges/${info.icon}.svg) center / contain no-repeat` }} />
      {(!compact && (labeled || kind === "owner")) && t(info.label)}
    </span>;
  })}</span>;
}
