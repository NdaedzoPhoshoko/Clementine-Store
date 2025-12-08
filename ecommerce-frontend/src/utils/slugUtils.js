export const createProductSlug = (name, id) => {
  const safeName = name
    ? name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
        .replace(/^-+|-+$/g, '') // Trim hyphens from start and end
    : 'product';
  return `${safeName}-p-${id}`;
};

export const extractIdFromSlug = (slug) => {
  if (!slug) return null;
  const parts = slug.split('-p-');
  if (parts.length < 2) {
      // If no -p- separator, assume the whole string might be the ID (legacy support)
      return slug;
  }
  return parts[parts.length - 1];
};

export const extractNameFromSlug = (slug) => {
    if (!slug) return '';
    const parts = slug.split('-p-');
    if (parts.length < 2) return slug.replace(/-/g, ' ');
    return parts.slice(0, parts.length - 1).join('-p-').replace(/-/g, ' ');
}
