let cache = { search: '', products: null, categories: null };

export function getPosProductsCache(search = '') {
  if (cache.products && cache.search === search) return cache.products;
  return null;
}

export function setPosProductsCache(search, products) {
  cache = { ...cache, search: search || '', products };
}

export function getPosCategoriesCache() {
  return cache.categories;
}

export function setPosCategoriesCache(categories) {
  cache = { ...cache, categories };
}

export function clearPosCache() {
  cache = { search: '', products: null, categories: null };
}
