export function formatPrice(price) {
  return `$${Number(price || 0).toLocaleString()}`;
}

export function formatListingType(type = "Property") {
  return type.toString().trim() || "Property";
}
