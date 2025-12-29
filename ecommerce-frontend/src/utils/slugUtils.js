export const createProductSlug = (name, id) => {
  const safeName = name
    ? name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
        .replace(/^-+|-+$/g, '') // Trim hyphens from start and end
    : 'product';
  return `${safeName}-p-${id}`;
};

export const createCategorySlug = (name, id) => {
  const safeName = name
    ? name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    : 'category';
  return `${safeName}-c-${id}`;
};

export const extractIdFromSlug = (slug) => {
  if (!slug) return null;
  const trySplit = (s, sep) => {
    const parts = s.split(sep);
    if (parts.length < 2) return null;
    return parts[parts.length - 1];
  };
  const fromProduct = trySplit(slug, '-p-');
  if (fromProduct != null) return fromProduct;
  const fromCategory = trySplit(slug, '-c-');
  if (fromCategory != null) return fromCategory;
  return slug;
};

export const extractNameFromSlug = (slug) => {
    if (!slug) return '';
    const splitBy = (s, sep) => {
      const parts = s.split(sep);
      if (parts.length < 2) return null;
      return parts.slice(0, parts.length - 1).join(sep);
    };
    const p = splitBy(slug, '-p-');
    const c = splitBy(slug, '-c-');
    const base = p ?? c ?? slug;
    return base.replace(/-/g, ' ');
}
