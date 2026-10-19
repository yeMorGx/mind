"use client";
/* eslint-disable @next/next/no-img-element -- Advertiser-owned HTTPS media loads directly without server-side URL fetching. */
import { useI18n } from "@/components/preferences/PreferencesProvider";
import { useRef, useState } from "react";
import { ArrowUpRight, ExternalLink, ImageOff, VolumeX } from "lucide-react";
import type { PublicCampaign } from "@/lib/campaigns/types";
import { campaignDestination, campaignMedia } from "@/lib/campaigns/types";
import { trackCampaignEvent, useCampaignExposure } from "./campaign-tracking";
import CampaignVisibility from "./CampaignVisibility";
import CampaignCoupon from "./CampaignCoupon";
import "./campaigns.css";
export default function SponsoredHero({
  campaign,
  preview = false,
}: {
  campaign: PublicCampaign;
  preview?: boolean;
}) {
  return (
    <CampaignVisibility endsAt={campaign.ends_at} preview={preview}>
      <HeroContent campaign={campaign} preview={preview} />
    </CampaignVisibility>
  );
}
function HeroContent({
  campaign,
  preview,
}: {
  campaign: PublicCampaign;
  preview: boolean;
}) {
 const { t } = useI18n();

  const video = useRef<HTMLVideoElement>(null),
    element = useCampaignExposure(campaign.id, preview, video);
  const [imageFailed, setImageFailed] = useState(false),
    [logoFailed, setLogoFailed] = useState(false),
    [playing, setPlaying] = useState(false),
    [videoFailed, setVideoFailed] = useState(false);
  const target = campaignDestination(campaign.target_url),
    external = Boolean(target?.startsWith("https://"));
  const image = campaignMedia(campaign.image_url),
    logo = campaignMedia(campaign.logo_url),
    source = campaignMedia(campaign.video_url);
  return (
    <aside
      ref={element}
      className="sponsored-hero"
      aria-label={preview ? t("Prévia da divulgação") : t("Destaque patrocinado")}
    >
      <div className="sponsored-copy">
        <div className="sponsored-topline">
          <div className="sponsored-brand">
            {logo && !logoFailed ? (
              <img
                src={logo}
                alt=""
                referrerPolicy="no-referrer"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <span className="sponsored-brand-initial" aria-hidden="true">
                {campaign.advertiser?.slice(0, 1) || t("M")}
              </span>
            )}
            <span>{campaign.advertiser || t("Nome do anunciante")}</span>
          </div>
          <div className="sponsored-disclosure">
            {campaign.kind === "affiliate" ? t("Link de afiliado") : t("Patrocinado")}
          </div>
        </div>
        <h2>{campaign.title || t("O título da sua divulgação aparece aqui.")}</h2>
        <p className="sponsored-description">
          {campaign.description ||
            t("Conte em poucas palavras o que a pessoa vai encontrar ao acessar.")}
        </p>
        {preview ? (
          <span className="sponsored-cta" aria-disabled="true">
            {campaign.cta_label || t("Conhecer")}
            <ArrowUpRight size={18} />
          </span>
        ) : (
          target && (
            <a
              className="sponsored-cta"
              href={target}
              target={external ? "_blank" : undefined}
              rel={external ? "sponsored noopener noreferrer" : undefined}
              onClick={() => trackCampaignEvent(campaign.id, "click")}
            >
              {campaign.cta_label}
              <ArrowUpRight size={18} />
              {external && (
                <span className="sr-only"> {t("(abre em outra aba)")}</span>
              )}
            </a>
          )
        )}
        <CampaignCoupon code={campaign.coupon_code} />
        <p className="sponsored-note">
          {campaign.kind === "affiliate"
            ? t("Podemos receber uma comissão se você contratar pelo link.")
            : t("Divulgação em parceria com {v0}.", {v0: (campaign.advertiser || "o anunciante")})}
        </p>
      </div>
      <div className="sponsored-media">
        {image && !imageFailed ? (
          <img
            className="sponsored-cover"
            src={image}
            alt={campaign.image_alt || ""}
            fetchPriority="high"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="sponsored-media-fallback">
            <ImageOff size={28} />
            <span>
              {preview
                ? t("Adicione a imagem da campanha")
                : t("Conheça o anunciante")}
            </span>
          </div>
        )}
        {source && !videoFailed && (
          <>
            <video
              ref={video}
              className="sponsored-video"
              src={source}
              poster={image || undefined}
              muted
              playsInline
              controls={playing}
              preload="none"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
              onError={() => {
                setVideoFailed(true);
                setPlaying(false);
              }}
              aria-label={t("Vídeo de {v0}", {v0: (campaign.advertiser)})}
            />
            {!playing && (
              <button
                type="button"
                className="sponsored-play"
                onClick={() =>
                  void video.current?.play().catch(() => setVideoFailed(true))
                }
              >
                <VolumeX size={16} />
                {t("Assistir sem som")}</button>
            )}
          </>
        )}
        {!preview && external && (
          <span className="sponsored-media-caption">
            <ExternalLink size={13} />
            {t("Site do anunciante")}</span>
        )}
      </div>
    </aside>
  );
}
