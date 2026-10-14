export type CatalogItem = { title: string; content: string; description: string; category: string; model: string; images: { role: string }[] };
export function catalogCategory(item: CatalogItem) { return item.category.trim() || (item.images.length ? "Imagem" : "Texto"); }
export function matchesCatalog(item: CatalogItem, search: string, category: string, model: string, creator = "") {
  const term = search.trim().toLocaleLowerCase("pt-BR");
  return (!term || `${item.title} ${item.content} ${item.description} ${item.category} ${item.model} ${creator}`.toLocaleLowerCase("pt-BR").includes(term))
    && (!category || catalogCategory(item) === category) && (!model || item.model === model);
}
