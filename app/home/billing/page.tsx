import BillingPage from "@/components/billing/BillingPage";
export const metadata = { title: "Assinatura · Mind", robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) { const { checkout } = await searchParams; return <BillingPage success={checkout === "success"}/>; }
