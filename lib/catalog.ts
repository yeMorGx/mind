export type CatalogItem = { title: string; content: string; description: string; category: string; model: string; images: { role: string }[] };
export function catalogCategory(item: CatalogItem) { return item.category.trim() || (item.images.length ? "Imagem" : "Texto"); }
export function normalizeCatalogSearch(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR"); }
export function matchesCatalog(item: CatalogItem, search: string, category: string, model: string, creator = "") {
  const terms = normalizeCatalogSearch(search.trim()).split(/\s+/).filter(Boolean);
  const text = normalizeCatalogSearch(`${item.title} ${item.content} ${item.description} ${item.category} ${item.model} ${creator}`);
  return terms.every(term => text.includes(term))
    && (!category || catalogCategory(item) === category) && (!model || item.model === model);
}
