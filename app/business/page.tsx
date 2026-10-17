import ContactPage from "@/components/contact/ContactPage";
export const metadata = { title: "Para empresas · Mind", description: "Divulgação, patrocínios, parcerias e propostas Enterprise para o Mind." };
export default async function Page({ searchParams }: { searchParams: Promise<{ subject?: string }> }) { const { subject } = await searchParams; return <ContactPage kind="business" enterprise={subject === "enterprise"}/>; }
