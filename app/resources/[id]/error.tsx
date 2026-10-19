"use client";
import { useI18n } from "@/components/preferences/PreferencesProvider";

export default function Error({ reset }: { reset: () => void }) {
 const { t } = useI18n();

  return (
    <main className="catalog-page">
      <div className="catalog-empty">
        <h1>{t("Não foi possível abrir este recurso.")}</h1>
        <p>{t("Confira sua conexão e tente novamente em breve.")}</p>
        <button onClick={reset}>{t("Tentar novamente")}</button>
      </div>
    </main>
  );
}
