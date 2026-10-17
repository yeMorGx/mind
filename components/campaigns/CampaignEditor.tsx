"use client";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, Save } from "lucide-react";
import { AnimatedCheckbox } from "@/components/ui/animated-checkbox";
import SponsoredCard from "./SponsoredCard";
import SponsoredHero from "./SponsoredHero";
import type {
  Campaign,
  CampaignDraft,
  CampaignStatus,
  PublicCampaign,
} from "@/lib/campaigns/types";
import {
  campaignDestination,
  campaignMedia,
  CAMPAIGN_PLACEMENTS,
  type CampaignPlacement,
} from "@/lib/campaigns/types";
import "./campaign-manager.css";
const empty: CampaignDraft = {
  placements: ["prompts", "mcps", "markdown"],
  name: "",
  kind: "affiliate",
  advertiser: "",
  title: "",
  description: "",
  logo_url: "",
  image_url: "",
  image_alt: "",
  video_url: "",
  cta_label: "Conhecer",
  target_url: "",
  starts_at: null,
  ends_at: null,
};
const localDate = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};
const toDate = (value: string) =>
  value ? new Date(value).toISOString() : null;
export function CampaignEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Campaign;
  onSave: (
    draft: CampaignDraft,
    status: CampaignStatus,
    confirmed: boolean,
  ) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<CampaignDraft>(() =>
    initial
      ? { ...initial }
      : { ...empty, starts_at: new Date().toISOString() },
  );
  const [stage, setStage] = useState<"edit" | "review">("edit"),
    [confirmed, setConfirmed] = useState(false),
    [pending, setPending] = useState(false),
    [error, setError] = useState("");
  const original = useRef(JSON.stringify(draft));
  const lock = useRef(false),
    heading = useRef<HTMLHeadingElement>(null);
  const update = <K extends keyof CampaignDraft>(
    key: K,
    value: CampaignDraft[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setError("");
    setConfirmed(false);
  };
  const preview: PublicCampaign = { ...draft, id: initial?.id || "preview" };
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  function cancel() {
    if (
      JSON.stringify(draft) !== original.current &&
      !window.confirm("Sair sem salvar as alterações desta campanha?")
    )
      return;
    onCancel();
  }
  function review(event: FormEvent) {
    event.preventDefault();
    if (!draft.placements.length) {
      setError("Escolha ao menos um lugar para a divulgação aparecer.");
      return;
    }
    if (
      !draft.advertiser.trim() ||
      !draft.title.trim() ||
      !draft.description.trim() ||
      !draft.cta_label.trim() ||
      !draft.image_alt.trim() ||
      !draft.image_url ||
      !draft.target_url ||
      !draft.starts_at
    ) {
      setError(
        "Preencha anunciante, título, descrição, capa, descrição da imagem, botão, destino e início para ativar.",
      );
      return;
    }
    if (
      !campaignDestination(draft.target_url) ||
      !campaignMedia(draft.image_url) ||
      (draft.logo_url && !campaignMedia(draft.logo_url)) ||
      (draft.video_url && !campaignMedia(draft.video_url))
    ) {
      setError("Confira os links HTTPS da mídia e o destino da divulgação.");
      return;
    }
    if (
      draft.ends_at &&
      (Date.parse(draft.ends_at) <= Date.parse(draft.starts_at) ||
        Date.parse(draft.ends_at) <= Date.now())
    ) {
      setError("A data final precisa ser futura e depois do início.");
      return;
    }
    setConfirmed(false);
    setStage("review");
    setError("");
    window.scrollTo({ top: 0, behavior: "instant" });
    requestAnimationFrame(() => heading.current?.focus());
  }
  async function save(status: CampaignStatus) {
    if (lock.current) return;
    if (status === "active" && !confirmed) return;
    if (!draft.name.trim()) {
      setError("Dê um nome à campanha.");
      return;
    }
    if (
      status !== "active" &&
      initial?.status === "active" &&
      !window.confirm(
        "Salvar e pausar retira esta campanha do Explorar. Continuar?",
      )
    )
      return;
    lock.current = true;
    setPending(true);
    setError("");
    try {
      await onSave(draft, status, status === "active" && confirmed);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Não foi possível salvar. Tente novamente.",
      );
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  const field = (label: string, children: ReactNode, hint?: string) => (
    <label className="campaign-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
  const input = (
    key: keyof CampaignDraft,
    max: number,
    placeholder = "",
    type = "text",
  ) => (
    <input
      type={type}
      maxLength={max}
      value={String(draft[key] ?? "")}
      onChange={(event) => update(key, event.target.value)}
      placeholder={placeholder}
      disabled={pending}
    />
  );
  return (
    <section className="campaign-editor">
      <button
        type="button"
        className="campaign-back"
        disabled={pending}
        onClick={
          stage === "review"
            ? () => {
                setStage("edit");
                setError("");
              }
            : cancel
        }
      >
        <ArrowLeft size={16} />
        {stage === "review" ? "Voltar aos detalhes" : "Todas as campanhas"}
      </button>
      <div className="campaign-page-heading">
        <div>
          <h1 ref={heading} tabIndex={-1}>
            {stage === "review"
              ? "Confira antes de colocar no ar."
              : initial
                ? "Editar campanha"
                : "Nova campanha"}
          </h1>
          <p>
            {stage === "review"
              ? "Confira como a divulgação aparece nos espaços escolhidos."
              : "Monte a divulgação, escolha o período e revise antes de ativar."}
          </p>
        </div>
        <span className="campaign-step">
          {stage === "review" ? "Revisão" : "Detalhes"}
        </span>
      </div>
      {stage === "review" ? (
        <div className="campaign-review">
          <CampaignPreview campaign={preview} />
          <dl className="campaign-review-details">
            <div>
              <dt>Campanha</dt>
              <dd>{draft.name}</dd>
            </div>
            <div>
              <dt>Onde aparece</dt>
              <dd>
                {draft.placements.map((p) => CAMPAIGN_PLACEMENTS[p]).join(", ")}
              </dd>
            </div>
            <div>
              <dt>Destino do botão</dt>
              <dd>
                <a
                  href={campaignDestination(draft.target_url) || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {draft.target_url}
                </a>
              </dd>
            </div>
            <div>
              <dt>Início</dt>
              <dd>
                {new Date(draft.starts_at!).toLocaleString("pt-BR")} ·{" "}
                {timezone}
              </dd>
            </div>
            <div>
              <dt>Fim</dt>
              <dd>
                {draft.ends_at
                  ? new Date(draft.ends_at).toLocaleString("pt-BR")
                  : "Sem data final"}
              </dd>
            </div>
          </dl>
          <AnimatedCheckbox
            title="Conferi o conteúdo, o link e o período desta divulgação."
            checked={confirmed}
            disabled={pending}
            onCheckedChange={setConfirmed}
          />
          <div className="campaign-editor-actions">
            <button
              type="button"
              className="workflow-button"
              disabled={pending || !confirmed}
              onClick={() => void save("active")}
            >
              <Check size={16} />
              {pending
                ? "Salvando…"
                : draft.starts_at && Date.parse(draft.starts_at) > Date.now()
                  ? "Confirmar agendamento"
                  : "Confirmar ativação"}
            </button>
            <button
              type="button"
              className="workflow-button secondary"
              disabled={pending}
              onClick={() => setStage("edit")}
            >
              Editar detalhes
            </button>
          </div>
        </div>
      ) : (
        <div className="campaign-edit-layout">
          <form onSubmit={review} className="campaign-form">
            <div className="campaign-form-section">
              <h2>Organização</h2>
              {field(
                "Nome interno da campanha",
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  value={draft.name}
                  disabled={pending}
                  onChange={(event) => update("name", event.target.value)}
                  placeholder="Ex.: MCPAI · divulgação de outubro"
                />,
                "Só a administração vê este nome.",
              )}
              {field(
                "Tipo de divulgação",
                <select
                  value={draft.kind}
                  disabled={pending}
                  onChange={(event) =>
                    update("kind", event.target.value as CampaignDraft["kind"])
                  }
                >
                  <option value="affiliate">Link de afiliado</option>
                  <option value="sponsored">Parceria paga</option>
                </select>,
              )}
              <fieldset className="campaign-placements">
                <legend>Onde a campanha aparece</legend>
                {(
                  Object.entries(CAMPAIGN_PLACEMENTS) as [
                    CampaignPlacement,
                    string,
                  ][]
                ).map(([value, label]) => (
                  <AnimatedCheckbox
                    key={value}
                    title={label}
                    checked={draft.placements.includes(value)}
                    disabled={pending}
                    onCheckedChange={(checked) =>
                      update(
                        "placements",
                        checked
                          ? [...draft.placements, value]
                          : draft.placements.filter((p) => p !== value),
                      )
                    }
                  />
                ))}
                <p className="campaign-hint">
                  Cards entram na grade com a identificação Patrocinado. O hero
                  é opcional; se marcar os dois, a posição alterna entre
                  visitas.
                </p>
              </fieldset>
            </div>
            <div className="campaign-form-section">
              <h2>Anunciante e conteúdo</h2>
              {field(
                "Nome do anunciante",
                input("advertiser", 80, "Ex.: MCPAI"),
              )}
              {field(
                "Logo (URL HTTPS, opcional)",
                input("logo_url", 2048, "https://…", "url"),
              )}
              {field(
                "Título",
                input("title", 96, "O que essa ferramenta tem para oferecer?"),
              )}
              {field(
                "Descrição",
                <textarea
                  maxLength={220}
                  rows={3}
                  value={draft.description}
                  disabled={pending}
                  onChange={(event) =>
                    update("description", event.target.value)
                  }
                  placeholder="Apresente a proposta sem prometer resultados que você não pode garantir."
                />,
                `${draft.description.length}/220 caracteres`,
              )}
              {field(
                "Imagem de capa (URL HTTPS)",
                input("image_url", 2048, "https://…", "url"),
                "Use uma imagem horizontal hospedada por você ou pelo anunciante.",
              )}
              {field(
                "Descrição da imagem",
                input("image_alt", 160, "Descreva o que a capa mostra."),
                "Ajuda quem usa leitor de tela.",
              )}
              {field(
                "Vídeo (URL HTTPS, opcional)",
                input("video_url", 2048, "https://…/video.mp4", "url"),
                "MP4 ou WebM direto. O card reproduz no hover/foco; no hero, a pessoa escolhe quando assistir.",
              )}
            </div>
            <div className="campaign-form-section">
              <h2>Destino e período</h2>
              {field(
                "Texto do botão",
                input("cta_label", 32, "Conhecer a ferramenta"),
              )}
              {field(
                "Link do botão",
                input("target_url", 2048, "https://… ou /resources/…"),
                "Cole o link de afiliado completo, com seus parâmetros de acompanhamento.",
              )}
              <div className="campaign-field-row">
                {field(
                  "Começar em",
                  <input
                    type="datetime-local"
                    value={localDate(draft.starts_at)}
                    disabled={pending}
                    onChange={(event) =>
                      update("starts_at", toDate(event.target.value))
                    }
                  />,
                )}
                {field(
                  "Encerrar em (opcional)",
                  <input
                    type="datetime-local"
                    value={localDate(draft.ends_at)}
                    disabled={pending}
                    onChange={(event) =>
                      update("ends_at", toDate(event.target.value))
                    }
                  />,
                )}
              </div>
              <p className="campaign-hint">
                Horário do seu navegador: {timezone}. Ao terminar o período, a
                divulgação sai do ar automaticamente.
              </p>
            </div>
            <div className="campaign-editor-actions">
              <button
                type="submit"
                className="workflow-button"
                disabled={pending}
              >
                Revisar divulgação
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                className="workflow-button secondary"
                disabled={pending}
                onClick={() =>
                  void save(initial?.status === "active" ? "paused" : "draft")
                }
              >
                <Save size={16} />
                {pending
                  ? "Salvando…"
                  : initial?.status === "active"
                    ? "Salvar e pausar"
                    : "Salvar rascunho"}
              </button>
            </div>
          </form>
          <aside className="campaign-live-preview">
            <h2>Prévia dos espaços</h2>
            <p>
              Prévia ilustrativa. Só aparece para visitantes após a ativação.
            </p>
            <CampaignPreview campaign={preview} />
          </aside>
        </div>
      )}
      {error && (
        <p className="campaign-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

function CampaignPreview({ campaign }: { campaign: PublicCampaign }) {
  const card = campaign.placements.some((p) => p !== "hero");
  return (
    <>
      {card && (
        <div className="campaign-card-preview">
          <SponsoredCard campaign={campaign} preview />
        </div>
      )}
      {campaign.placements.includes("hero") && (
        <SponsoredHero campaign={campaign} preview />
      )}
      {!card && !campaign.placements.includes("hero") && (
        <p className="campaign-hint">Escolha onde a divulgação vai aparecer.</p>
      )}
    </>
  );
}
