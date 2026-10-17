"use client";
/* eslint-disable @next/next/no-img-element -- Creator images include optimized data URLs and external account avatars. */
import Link from "next/link";
import { useState } from "react";
import { Plug } from "lucide-react";
import CreatorIdentity from "@/components/profile/CreatorIdentity";
import { creatorProfileHref } from "@/lib/usernames";
import { LikeButton } from "@/components/social/SocialControls";
import type { CatalogResource } from "@/lib/resources";
import ResourceClients from "./ResourceClients";
import MarkdownCardPreview from "./MarkdownCardPreview";
export default function ResourceCard({
  resource,
}: {
  resource: CatalogResource;
}) {
  const doc = resource.document;
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <article className="catalog-public-card wireframe-prompt-card resource-card"
      onPointerEnter={event => { if (event.pointerType === "mouse") setHovered(true); }}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
    >
      <Link
        href={`/resources/${resource.id}`}
        className="catalog-card-cover resource-card-cover"
        aria-label={`Abrir ${doc.title}`}
      >
        {doc.coverUrl ? (
          <>
            <img src={doc.coverUrl} alt="" loading="lazy" />
            {resource.kind === "markdown" && <div className="resource-markdown-cover-preview"><MarkdownCardPreview fileName={doc.fileName} content={doc.content} active={hovered || focused}/></div>}
          </>
        ) : resource.kind === "markdown" ? (
          <MarkdownCardPreview fileName={doc.fileName} content={doc.content} active={hovered || focused}/>
        ) : (
          <div className="resource-mcp-preview">
            <Plug size={36} strokeWidth={1.4} />
            <strong>{doc.title}</strong>
            <span>{doc.developer || "Servidor MCP"}</span>
            <code>
              {doc.transport === "remote"
                ? "Conexão remota"
                : "Instalação local"}
            </code>
          </div>
        )}
        {(doc.coverUrl || resource.kind === "mcp") && <span className="resource-cover-label">
          {resource.kind === "markdown" ? doc.fileName : "MCP"}
        </span>}
      </Link>
      <div className="prompt-card-details">
        <div className="prompt-card-creator-row">
          <CreatorIdentity
            {...resource.creator}
            href={creatorProfileHref(
              resource.creator_id,
              resource.creator.username,
            )}
          />
          <LikeButton
            creatorId={resource.creator_id}
            promptId={`resource_${resource.id}`}
          />
        </div>
        <Link href={`/resources/${resource.id}`} className="mt-2 block">
          <h2 className="line-clamp-2 break-words text-base font-semibold leading-6">
            {doc.title}
          </h2>
        </Link>
        <p className="prompt-card-summary">{doc.summary}</p>
        <ResourceClients clients={doc.clients} compact/>
      </div>
    </article>
  );
}
