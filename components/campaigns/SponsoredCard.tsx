"use client";
/* eslint-disable @next/next/no-img-element -- Advertiser-owned HTTPS media loads directly. */
import { useI18n } from "@/components/preferences/PreferencesProvider";
import { useRef, useState } from "react";
import { ArrowUpRight, ImageOff } from "lucide-react";
import {
  campaignDestination,
  campaignMedia,
  type PublicCampaign,
} from "@/lib/campaigns/types";
import { trackCampaignEvent, useCampaignExposure } from "./campaign-tracking";
import CampaignVisibility from "./CampaignVisibility";
import CampaignCoupon from "./CampaignCoupon";
import "./campaigns.css";
export default function SponsoredCard({
  campaign,
  preview = false,
}: {
  campaign: PublicCampaign;
  preview?: boolean;
}) {
  return (
    <CampaignVisibility endsAt={campaign.ends_at} preview={preview}>
      <CardContent campaign={campaign} preview={preview} />
    </CampaignVisibility>
  );
}
function CardContent({
  campaign,
  preview,
}: {
  campaign: PublicCampaign;
  preview: boolean;
}) {
 const { t } = useI18n();

  const video = useRef<HTMLVideoElement>(null),
    root = useCampaignExposure(campaign.id, preview, video);
  const [imageFailed, setImageFailed] = useState(false),
    [logoFailed, setLogoFailed] = useState(false),
    [playing, setPlaying] = useState(false);
  const target = campaignDestination(campaign.target_url),
    external = Boolean(target?.startsWith("https://"));
  const image = campaignMedia(campaign.image_url),
    logo = campaignMedia(campaign.logo_url),
    source = campaignMedia(campaign.video_url);
  const link = {
    href: preview ? undefined : target || undefined,
    target: !preview && external ? "_blank" : undefined,
    rel: external ? "sponsored noopener noreferrer" : undefined,
    onClick: () => {
      if (!preview) trackCampaignEvent(campaign.id, "click");
    },
  };
  function play() {
    if (
      source &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      void video.current?.play().catch(() => {});
  }
  function stop() {
    video.current?.pause();
    if (video.current) video.current.currentTime = 0;
    setPlaying(false);
  }
  return (
    <article
      ref={root}
      className="catalog-public-card wireframe-prompt-card sponsored-card"
      aria-label={t("Patrocinado por {v0}", {v0: (campaign.advertiser || "anunciante")})}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") play();
      }}
      onPointerLeave={stop}
      onFocusCapture={play}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) stop();
      }}
    >
      <a
        {...link}
        className="catalog-card-cover"
        aria-label={t("{v0}: {v1}{v2}", {v0: (campaign.cta_label || "Conhecer"), v1: (campaign.title || "divulgação"), v2: (external ? " (abre em outra aba)" : "")})}
      >
        {image && !imageFailed ? (
          <img
            src={image}
            alt={campaign.image_alt || ""}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="sponsored-card-empty">
            <ImageOff size={28} />
            <span>
              {preview ? t("Adicione uma capa") : t("Conheça o anunciante")}
            </span>
          </div>
        )}
        {source && (
          <video
            ref={video}
            src={source}
            muted
            playsInline
            loop
            preload="none"
            aria-hidden="true"
            tabIndex={-1}
            className="sponsored-card-video"
            data-playing={playing || undefined}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onError={() => setPlaying(false)}
          />
        )}
        <span className="sponsored-card-label">{t("Patrocinado")}</span>
      </a>
      <div className="prompt-card-details">
        <div className="sponsored-card-advertiser">
          {logo && !logoFailed ? (
            <img
              src={logo}
              alt=""
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <span className="sponsored-card-initial" aria-hidden="true">
              {campaign.advertiser.slice(0, 1) || t("M")}
            </span>
          )}
          <span>{campaign.advertiser || t("Nome do anunciante")}</span>
          <ArrowUpRight size={16} aria-hidden="true" />
        </div>
        <a {...link} className="mt-2 block">
          <h2 className="line-clamp-2 break-words text-base font-semibold leading-6">
            {campaign.title || t("O título da sua divulgação")}
          </h2>
        </a>
        <p className="prompt-card-summary">
          {campaign.description ||
            t("Uma breve descrição da ferramenta ou parceria.")}
        </p>
        <CampaignCoupon code={campaign.coupon_code} />
        {campaign.kind === "affiliate" && (
          <p className="sponsored-card-affiliate">
            {t("Link de afiliado · Podemos receber uma comissão.")}</p>
        )}
      </div>
    </article>
  );
}
