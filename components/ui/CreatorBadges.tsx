"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import { Tooltip } from "radix-ui";
import { badgeInfo, badgeKinds, type BadgeKind } from "@/lib/badges";
import { badgeTooltipDelayMs } from "@/lib/motion";
import "@/app/ui-tokens.css";
import "./creator-badges.css";

const VISIBLE_BADGE_LIMIT = 4;

export default function CreatorBadges({ badges = [], labeled = false, compact = false }: { badges?: BadgeKind[]; labeled?: boolean; compact?: boolean }) {
 const { t } = useI18n();

 const ordered = badgeKinds.filter(kind => badges.includes(kind));
 const visible = ordered.slice(0, VISIBLE_BADGE_LIMIT);
 const overflow = ordered.slice(VISIBLE_BADGE_LIMIT);
 const detail = (kind: BadgeKind) => {
  const info = badgeInfo[kind];
  return <span className="creator-badge-detail" key={kind}>
   <span aria-hidden="true" className="creator-badge-detail-icon" style={{ background: info.background }}><span className="creator-badge-detail-glyph" style={{ background: info.color, mask: `url(/badges/${info.icon}.svg) center / contain no-repeat`, WebkitMask: `url(/badges/${info.icon}.svg) center / contain no-repeat` }} /></span>
   <span className="creator-badge-detail-copy"><strong>{t(info.label)}</strong><span>{t(info.description)}</span></span>
  </span>;
 };

  return <Tooltip.Provider delayDuration={badgeTooltipDelayMs} skipDelayDuration={badgeTooltipDelayMs}><span className="creator-badges">{visible.map(kind => {
    const info = badgeInfo[kind];
    if (!info) return null;
    const label = t(info.label);
    const description = t(info.description);
    return <Tooltip.Root key={kind}><Tooltip.Trigger asChild>
     <span role="img" tabIndex={0} aria-label={t("{v0}: {v1}", { v0: label, v1: description })}
      className={`creator-badge ${!compact && (labeled || kind === "owner") ? "creator-badge-labeled" : ""}`}
      style={{ color: info.color, background: !compact && (labeled || kind === "owner") ? info.background : undefined }}>
      <span aria-hidden="true" className="creator-badge-icon" style={{ width: compact ? "var(--ui-badge-compact-size)" : "var(--ui-badge-icon-size)", height: compact ? "var(--ui-badge-compact-size)" : "var(--ui-badge-icon-size)", mask: `url(/badges/${info.icon}.svg) center / contain no-repeat`, WebkitMask: `url(/badges/${info.icon}.svg) center / contain no-repeat` }} />
      {(!compact && (labeled || kind === "owner")) && t(info.label)}
     </span>
    </Tooltip.Trigger><Tooltip.Portal><Tooltip.Content className="creator-badge-tooltip" side="top" align="center" sideOffset={8} collisionPadding={12}>
     <span className="creator-badge-tooltip-list">{detail(kind)}</span><Tooltip.Arrow className="creator-badge-tooltip-arrow" />
    </Tooltip.Content></Tooltip.Portal></Tooltip.Root>;
  })}{overflow.length > 0 && <Tooltip.Root><Tooltip.Trigger asChild>
   <span role="img" tabIndex={0} aria-label={t("Mais {v0} emblemas", { v0: overflow.length })} className="creator-badge-overflow">+{overflow.length}</span>
  </Tooltip.Trigger><Tooltip.Portal><Tooltip.Content className="creator-badge-tooltip creator-badge-overflow-tooltip" side="top" align="center" sideOffset={8} collisionPadding={12}>
   <span className="creator-badge-tooltip-list">{overflow.map(detail)}</span><Tooltip.Arrow className="creator-badge-tooltip-arrow" />
  </Tooltip.Content></Tooltip.Portal></Tooltip.Root>}</span></Tooltip.Provider>;
}
