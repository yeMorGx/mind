import ContactPage from "@/components/contact/ContactPage";
export const metadata = { title: "For businesses · Mind", description: "Advertising, sponsorships, partnerships and Enterprise solutions for Mind." };
export default async function Page({ searchParams }: { searchParams: Promise<{ subject?: string }> }) { const { subject } = await searchParams; return <ContactPage kind="business" enterprise={subject === "enterprise"}/>; }
