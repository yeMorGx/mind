export const badgeKinds = ["owner", "verified", "moderator", "creator", "partner", "team", "ambassador", "contributor", "pioneer", "educator", "developer"] as const;
export type BadgeKind = typeof badgeKinds[number];
export const badgeInfo: Record<BadgeKind, { label: string; icon: string; color: string; background: string; description: string }> = {
  owner: { label: "Fundador do Mind", icon: "crown", color: "#a66805", background: "#fff3cc", description: "Conta do proprietário do Mind." },
  verified: { label: "Conta verificada", icon: "verified", color: "#1687f8", background: "#e9f4ff", description: "Identidade reconhecida e verificada pela equipe Mind." },
  moderator: { label: "Moderador", icon: "shield_person", color: "#138574", background: "#e0f7f1", description: "Integrante da equipe de moderação." },
  creator: { label: "Criador de conteúdo", icon: "video_camera_front", color: "#7857d7", background: "#f0eaff", description: "Criador de conteúdo reconhecido pela equipe." },
  partner: { label: "Parceiro patrocinado", icon: "handshake", color: "#c55424", background: "#fff0e7", description: "Criador com parceria ou patrocínio confirmado pelo Mind." },
  team: { label: "Equipe Mind", icon: "groups", color: "var(--ui-badge-team)", background: "var(--ui-badge-team-bg)", description: "Integrante reconhecido da equipe Mind." },
  ambassador: { label: "Embaixador", icon: "campaign", color: "var(--ui-badge-ambassador)", background: "var(--ui-badge-ambassador-bg)", description: "Representa e aproxima a comunidade Mind." },
  contributor: { label: "Colaborador", icon: "volunteer_activism", color: "var(--ui-badge-contributor)", background: "var(--ui-badge-contributor-bg)", description: "Contribui com recursos e iniciativas para a comunidade." },
  pioneer: { label: "Pioneiro", icon: "rocket_launch", color: "var(--ui-badge-pioneer)", background: "var(--ui-badge-pioneer-bg)", description: "Participante reconhecido dos primeiros passos do Mind." },
  educator: { label: "Educador", icon: "school", color: "var(--ui-badge-educator)", background: "var(--ui-badge-educator-bg)", description: "Compartilha conhecimento e ajuda outras pessoas a criar com IA." },
  developer: { label: "Desenvolvedor", icon: "code", color: "var(--ui-badge-developer)", background: "var(--ui-badge-developer-bg)", description: "Cria ferramentas, integrações e recursos para a comunidade." },
};

export const editableBadgeKinds = badgeKinds.filter((kind): kind is Exclude<BadgeKind, "owner"> => kind !== "owner");
