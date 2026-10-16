import "@/components/catalog/explore-enhancements.css";

export default function Loading() {
  return <main className="catalog-page explore-page" aria-busy="true" aria-label="Carregando prompts">
    <p className="sr-only" role="status">Carregando prompts…</p>
    <div className="explore-loading-heading image-skeleton" aria-hidden="true"/>
    <div className="explore-loading-grid" aria-hidden="true">{Array.from({length:6},(_,index)=><div key={index}><div className="explore-loading-cover image-skeleton"/><div className="explore-loading-details"><span className="image-skeleton"/><span className="image-skeleton"/></div></div>)}</div>
  </main>;
}
