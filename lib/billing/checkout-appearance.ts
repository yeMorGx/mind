import type Stripe from "stripe";
import type { Cadence } from "./plans";

/** Hosted Checkout supports a curated set of branding options, not arbitrary CSS. */
export function checkoutAppearance(cadence: Cadence) {
  return {
    branding_settings: {
      display_name: "Mind",
      background_color: "#fafafa",
      button_color: "#17181a",
      border_style: "rounded",
      font_family: "inter",
      icon: {
        type: "url",
        url: "https://mind-lemon.vercel.app/brand/mind-checkout-icon.png",
      },
    },
    submit_type: "subscribe",
    custom_text: {
      submit: {
        message: `Assinatura ${cadence === "yearly" ? "anual" : "mensal"} com renovação automática. Você pode cancelar a renovação em Minha assinatura, no Mind.`,
      },
      after_submit: {
        message: "Após a confirmação do pagamento, volte ao Mind para ativar seu ticket e continuar criando.",
      },
    },
  } satisfies Pick<Stripe.Checkout.SessionCreateParams, "branding_settings" | "submit_type" | "custom_text">;
}
