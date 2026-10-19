"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";
import { useEffect, useRef, useState } from "react";
import { useOnboarding } from "@/app/context/OnboardingContext";
import { useSiteLayout } from "@/components/layout/SiteLayout";
import { readComments, writeComment, type PromptComment } from "@/lib/comments";
import CreatorIdentity from "@/components/profile/CreatorIdentity";
import { creatorProfileHref } from "@/lib/usernames";
import { MessageCircle, Send, Trash2 } from "lucide-react";
export default function PromptComments({
  creatorId,
  promptId,
  resource = false,
}: {
  creatorId: string;
  promptId: string;
  resource?: boolean;
}) {
 const { t, intlLocale } = useI18n();

  const { user, authReady } = useOnboarding(),
    { requestLogin } = useSiteLayout();
  const [items, setItems] = useState<PromptComment[]>([]),
    [loaded, setLoaded] = useState(false),
    [more, setMore] = useState(false),
    [loading, setLoading] = useState(false),
    [pending, setPending] = useState(false),
    [deleting, setDeleting] = useState(""),
    [confirm, setConfirm] = useState(""),
    [error, setError] = useState(""),
    [loadError, setLoadError] = useState(""),
    [text, setText] = useState(""),
    [attempt, setAttempt] = useState(0),
    [notice, setNotice] = useState("");
  const busy = useRef(false),
    draftId = useRef<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void readComments(creatorId, promptId, undefined, controller.signal)
      .then((rows) => {
        setItems(rows.slice(0, 20));
        setMore(rows.length > 20);
        setLoaded(true);
        setLoadError("");
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setLoaded(true);
          setLoadError("Não foi possível carregar os comentários.");
        }
      });
    return () => controller.abort();
  }, [creatorId, promptId, attempt]);
  async function loadMore() {
    if (loading) return;
    setLoading(true);
    setLoadError("");
    try {
      const rows = await readComments(creatorId, promptId, items.at(-1));
      setItems((current) => [
        ...current,
        ...rows
          .slice(0, 20)
          .filter((row) => !current.some((item) => item.id === row.id)),
      ]);
      setMore(rows.length > 20);
    } catch {
      setLoadError("Não foi possível carregar mais comentários.");
    } finally {
      setLoading(false);
    }
  }
  async function send() {
    if (!user || busy.current || !text.trim()) return;
    busy.current = true;
    setPending(true);
    setError("");
    setNotice("");
    try {
      draftId.current ??= crypto.randomUUID();
      await writeComment(user, creatorId, promptId, draftId.current, text);
      draftId.current = null;
      setText("");
      setAttempt((value) => value + 1);
      setNotice(t("Comentário enviado."));
    } catch (failure) {
      const message =
        failure && typeof failure === "object" && "message" in failure
          ? String(failure.message)
          : "";
      setError(
        message.startsWith("Aguarde")
          ? message
          : t("Não foi possível enviar. Confira sua sessão e tente novamente."),
      );
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  async function remove(id: string) {
    if (!user || deleting) return;
    setDeleting(id);
    setError("");
    try {
      await writeComment(user, creatorId, promptId, id, "", true);
      setItems((current) => current.filter((item) => item.id !== id));
      setConfirm("");
      setNotice(t("Comentário removido."));
    } catch {
      setError(t("Não foi possível remover. Tente novamente."));
    } finally {
      setDeleting("");
    }
  }
  return (
    <section className="prompt-comments" aria-labelledby="comments-heading">
      <div className="prompt-comments-heading">
        <MessageCircle size={21} />
        <h2 id="comments-heading">{t("Comentários")}</h2>
      </div>
      <p className="prompt-comments-intro">
        {resource
          ? t("Compartilhe sua experiência ou deixe uma pergunta sobre este recurso.")
          : t("Compartilhe como foi usar este prompt ou deixe uma pergunta para o criador.")}
      </p>
      {user ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
        >
          <label htmlFor={`comment-${promptId}`}>{t("Seu comentário")}</label>
          <textarea
            id={`comment-${promptId}`}
            maxLength={1500}
            rows={3}
            value={text}
            disabled={pending}
            onChange={(event) => {
              setText(event.target.value);
              draftId.current = null;
            }}
            placeholder={t("O que você achou do resultado?")}
          />
          <div className="prompt-comment-compose-actions">
            <span>{text.length}/1.500</span>
            <button
              type="submit"
              disabled={pending || !text.trim()}
              className="workflow-button"
            >
              <Send size={15} />
              {pending ? t("Enviando…") : t("Enviar comentário")}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          disabled={!authReady}
          className="workflow-button secondary"
          onClick={requestLogin}
        >
          {t("Entre para comentar")}</button>
      )}
      {error && (
        <p role="alert" className="settings-error">
          {t(error)}
        </p>
      )}
      <p role="status" className="prompt-comment-notice">
        {t(notice)}
      </p>
      {!loaded ? (
        <p role="status" className="py-6 text-sm text-muted">
          {t("Carregando comentários…")}</p>
      ) : (
        <>
          {loadError && (
            <div role="alert" className="py-4 text-sm text-muted">
              <p>{loadError}</p>
              <button
                type="button"
                className="mt-2 underline"
                onClick={() => setAttempt((value) => value + 1)}
              >
                {t("Tentar novamente")}</button>
            </div>
          )}
          {!loadError && !items.length && (
            <p className="prompt-comments-empty">
              {t("Ainda não há comentários. Seja o primeiro a participar.")}</p>
          )}
          <ol className="prompt-comment-list">
            {items.map((item) => (
              <li key={item.id}>
                <div className="prompt-comment-author">
                  <CreatorIdentity
                    name={item.author_name}
                    avatarUrl={item.avatar_url}
                    badges={item.badges}
                    username={item.username}
                    href={creatorProfileHref(item.actor_id, item.username)}
                  />
                  <time dateTime={item.created_at}>
                    {new Date(item.created_at).toLocaleDateString(intlLocale, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </time>
                </div>
                <p className="prompt-comment-body">{item.body}</p>
                {user &&
                  (user.uid === item.actor_id || user.uid === creatorId) && (
                    <div className="prompt-comment-moderation">
                      {confirm === item.id ? (
                        <>
                          <span>{t("Remover este comentário?")}</span>
                          <button
                            type="button"
                            disabled={Boolean(deleting)}
                            onClick={() => void remove(item.id)}
                          >
                            {deleting === item.id ? t("Removendo…") : t("Remover")}
                          </button>
                          <button
                            type="button"
                            disabled={Boolean(deleting)}
                            onClick={() => setConfirm("")}
                          >
                            {t("Cancelar")}</button>
                        </>
                      ) : (
                        <button
                          type="button"
                          aria-label={t("Excluir comentário")}
                          onClick={() => setConfirm(item.id)}
                        >
                          <Trash2 size={13} />
                          {t("Excluir")}</button>
                      )}
                    </div>
                  )}
              </li>
            ))}
          </ol>
          {more && (
            <button
              type="button"
              disabled={loading}
              className="workflow-button secondary"
              onClick={() => void loadMore()}
            >
              {loading ? t("Carregando…") : t("Carregar mais comentários")}
            </button>
          )}
        </>
      )}
    </section>
  );
}
