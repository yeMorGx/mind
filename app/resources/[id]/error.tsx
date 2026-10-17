"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="catalog-page">
      <div className="catalog-empty">
        <h1>Não foi possível abrir este recurso.</h1>
        <p>Confira sua conexão e tente novamente em breve.</p>
        <button onClick={reset}>Tentar novamente</button>
      </div>
    </main>
  );
}
