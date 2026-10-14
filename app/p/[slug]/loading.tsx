export default function PromptLoading() {
  return (
    <main className="min-h-[calc(100dvh-4.5rem)] bg-background px-5 py-12 text-foreground sm:px-8" aria-busy="true" aria-label="Carregando página do prompt">
      <p role="status" className="sr-only">Carregando o prompt e suas imagens.</p>
      <div aria-hidden="true" className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="h-5 w-32 rounded bg-foreground/5" />
          <div className="h-14 w-3/4 rounded-xl bg-foreground/10" />
          <div className="h-16 rounded-xl bg-foreground/5" />
          <div className="aspect-[4/3] rounded-2xl bg-foreground/5" />
        </div>
        <div className="space-y-5 lg:pt-16">
          <div className="h-96 rounded-2xl border border-border bg-foreground/[0.025]" />
          <div className="h-48 rounded-2xl border border-border bg-foreground/[0.025]" />
        </div>
      </div>
    </main>
  );
}
