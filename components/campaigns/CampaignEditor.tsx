"use client";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, ImagePlus, Save, Trash2, Upload, Video } from "lucide-react";
import { AnimatedCheckbox } from "@/components/ui/animated-checkbox";
import { SelectField } from "@/components/ui/SelectField";
import { CampaignDateTimeField } from "./CampaignDateTimeField";
import { uploadCampaignMedia } from "@/lib/campaigns/client";
import type { MindUser } from "@/lib/backend";
import { useLocalTimeZone } from "@/lib/use-local-time-zone";
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
export function CampaignEditor({
  user,
  initial,
  onSave,
  onCancel,
}: {
  user: MindUser;
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
    [error, setError] = useState(""),
    [uploading, setUploading] = useState<"logo_url" | "image_url" | "video_url" | "">("");
  const locked = pending || Boolean(uploading);
  const original = useRef(JSON.stringify(draft));
  const lock = useRef(false),
    heading = useRef<HTMLHeadingElement>(null),
    mediaInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const update = <K extends keyof CampaignDraft>(
    key: K,
    value: CampaignDraft[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setError("");
    setConfirmed(false);
  };
  async function attachMedia(
    key: "logo_url" | "image_url" | "video_url",
    file?: File,
  ) {
    if (!file || pending || uploading) return;
    setUploading(key);
    setError("");
    try {
      update(key, await uploadCampaignMedia(user, file));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível enviar o arquivo.");
    } finally {
      setUploading("");
    }
  }
  const preview: PublicCampaign = { ...draft, id: initial?.id || "preview" };
  const timezone = useLocalTimeZone();
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
    if (uploading) {
      setError("Aguarde o envio do arquivo terminar.");
      return;
    }
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
      setError("Confira os arquivos anexados e o destino da divulgação.");
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
    if (uploading) {
      setError("Aguarde o envio do arquivo terminar.");
      return;
    }
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
      disabled={locked}
    />
  );
  const mediaField = (
    key: "logo_url" | "image_url" | "video_url",
    label: string,
    kind: "image" | "video",
    accept: string,
    hint?: string,
  ) => (
    <div className="campaign-field campaign-media-field">
      <span>{label}</span>
      <div className="campaign-media-upload">
        <div className={`campaign-media-preview${key === "logo_url" ? " is-logo" : ""}${kind === "video" ? " is-video" : ""}`}>
          {draft[key] ? kind === "video" ? (
            <video src={draft[key]} controls muted playsInline preload="metadata" aria-label="Prévia do vídeo anexado" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- Uploaded campaign assets use public Supabase Storage URLs.
            <img src={draft[key]} alt={key === "logo_url" ? "Prévia do logo do anunciante" : draft.image_alt || "Prévia da capa da campanha"} />
          ) : kind === "video" ? <Video size={24} aria-hidden="true" /> : <ImagePlus size={24} aria-hidden="true" />}
        </div>
        <div className="campaign-media-actions">
          <button type="button" className="workflow-button secondary" aria-label={`${draft[key] ? "Trocar" : "Anexar"} ${label.toLocaleLowerCase()}`} disabled={locked} onClick={() => mediaInputs.current[key]?.click()}>
            <Upload size={15} />
            {uploading === key ? "Enviando…" : draft[key] ? "Trocar arquivo" : "Anexar arquivo"}
          </button>
          {draft[key] && <button type="button" className="campaign-media-remove" aria-label={`Remover ${label.toLocaleLowerCase()}`} disabled={locked} onClick={() => update(key, "")}><Trash2 size={15} />Remover</button>}
          <input ref={(element) => { mediaInputs.current[key] = element; }} type="file" hidden tabIndex={-1} accept={accept} aria-label={`Anexar ${label.toLocaleLowerCase()}`} disabled={locked} onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; void attachMedia(key, file); }} />
        </div>
        {uploading === key && <p className="campaign-media-status" role="status">Enviando arquivo com segurança…</p>}
      </div>
      {hint && <small>{hint}</small>}
    </div>
  );
  return (
    <section className="campaign-editor">
      <button
        type="button"
        className="campaign-back"
        disabled={locked}
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
            title="Conferi o conteúdo, os arquivos e o período desta divulgação."
            checked={confirmed}
            disabled={locked}
            onCheckedChange={setConfirmed}
          />
          <div className="campaign-editor-actions">
            <button
              type="button"
              className="workflow-button"
              disabled={locked || !confirmed}
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
              disabled={locked}
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
                  disabled={locked}
                  onChange={(event) => update("name", event.target.value)}
                  placeholder="Ex.: MCPAI · divulgação de outubro"
                />,
                "Só a administração vê este nome.",
              )}
              <div className="campaign-field"><SelectField label="Tipo de divulgação" value={draft.kind} disabled={locked} onValueChange={(value) => update("kind", value as CampaignDraft["kind"])} options={[{value:"affiliate",label:"Link de afiliado"},{value:"sponsored",label:"Parceria paga"}]}/></div>
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
                    disabled={locked}
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
              {mediaField("logo_url", "Logo do anunciante (opcional)", "image", "image/jpeg,image/png,image/webp,image/avif", "JPG, PNG, WebP ou AVIF · até 8 MB.")}
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
                  disabled={locked}
                  onChange={(event) =>
                    update("description", event.target.value)
                  }
                  placeholder="Apresente a proposta sem prometer resultados que você não pode garantir."
                />,
                `${draft.description.length}/220 caracteres`,
              )}
              {mediaField("image_url", "Imagem de capa", "image", "image/jpeg,image/png,image/webp,image/avif", "Anexe uma imagem horizontal · JPG, PNG, WebP ou AVIF · até 8 MB.")}
              {field(
                "Descrição da imagem",
                input("image_alt", 160, "Descreva o que a capa mostra."),
                "Ajuda quem usa leitor de tela.",
              )}
              {mediaField("video_url", "Vídeo da campanha (opcional)", "video", "video/mp4,video/webm", "MP4 ou WebM · até 30 MB. O card reproduz no hover/foco; no hero, a pessoa escolhe quando assistir.")}
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
                <div className="campaign-field"><CampaignDateTimeField label="Começar em" name="starts_at" value={draft.starts_at} disabled={locked} onChange={(value) => update("starts_at", value)} /></div>
                <div className="campaign-field"><CampaignDateTimeField label="Encerrar em (opcional)" name="ends_at" required={false} value={draft.ends_at} disabled={locked} onChange={(value) => update("ends_at", value)} /></div>
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
                disabled={locked}
              >
                Revisar divulgação
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                className="workflow-button secondary"
                disabled={locked}
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
