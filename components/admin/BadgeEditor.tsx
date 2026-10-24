"use client";

import type { FormEvent } from "react";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import { AnimatedCheckbox } from "@/components/ui/animated-checkbox";
import CreatorBadges from "@/components/ui/CreatorBadges";
import CreatorIdentity from "@/components/profile/CreatorIdentity";
import { badgeInfo, editableBadgeKinds, type BadgeKind } from "@/lib/badges";

type Props = {
  person: { public_id: string; name: string; username: string; avatar?: string };
  badges: BadgeKind[];
  onBadgesChange: (badges: BadgeKind[]) => void;
  reason: string;
  onReasonChange: (reason: string) => void;
  pending: boolean;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
};

export default function BadgeEditor({ person, badges, onBadgesChange, reason, onReasonChange, pending, onSubmit, onCancel }: Props) {
  const { t } = useI18n();
  return <form className="admin-badge-editor" onSubmit={onSubmit} aria-busy={pending}>
    <h2>{t("Editar emblemas")} · {person.name}</h2>
    <div className="admin-badge-layout">
      <fieldset disabled={pending} className="admin-badge-options">
        <legend>{t("Emblemas disponíveis")}</legend>
        {editableBadgeKinds.map(kind => <AnimatedCheckbox
          key={kind}
          className="admin-badge-choice"
          disabled={pending}
          checked={badges.includes(kind)}
          onCheckedChange={checked => onBadgesChange(checked ? [...badges, kind] : badges.filter(value => value !== kind))}
        >
          <span className="admin-badge-option-title"><span aria-hidden="true"><CreatorBadges badges={[kind]} compact /></span><strong>{t(badgeInfo[kind].label)}</strong></span>
          <span className="admin-badge-option-description">{t(badgeInfo[kind].description)}</span>
        </AnimatedCheckbox>)}
      </fieldset>
      <section className="admin-badge-preview" aria-label={t("Prévia ao vivo")}>
        <h3>{t("Prévia ao vivo")}</h3>
        <CreatorIdentity name={person.name} username={person.username} avatarUrl={person.avatar} badges={badges} href={`/u/${person.public_id}`} target="_blank" rel="noopener noreferrer" />
        <p>{t("Assim os emblemas aparecem ao lado do nome nos cards e comentários.")}</p>
        {badges.length ? <CreatorBadges badges={badges} labeled /> : <p>{t("Selecione um emblema para visualizar.")}</p>}
        <p>{t("A prévia não altera o perfil. Salve para aplicar.")}</p>
      </section>
    </div>
    <p>{t("Permissões administrativas são gerenciadas separadamente dos emblemas.")}</p>
    <label>{t("Motivo da alteração")}<textarea disabled={pending} placeholder={t("Explique o motivo desta alteração.")} required minLength={5} maxLength={500} value={reason} onChange={event => onReasonChange(event.target.value)} /></label>
    <div className="admin-badge-actions"><button className="workflow-button" disabled={pending}>{t("Salvar emblemas")}</button><button type="button" className="workflow-button secondary" disabled={pending} onClick={onCancel}>{t("Cancelar")}</button></div>
  </form>;
}
