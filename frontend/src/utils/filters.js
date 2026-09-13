const normalizeText = (value = "") =>
  String(value ?? "")
    .trim()
    .toLowerCase();

export function buildListingFilterQuery(filters = {}) {
  const query = {};

  const entries = {
    city_id: filters.city_id,
    property_type: filters.property_type,
    locality: filters.locality,
    bedrooms: filters.bedrooms,
    min_price: filters.min_price,
    max_price: filters.max_price,
    furnishing: filters.furnishing,
  };

  for (const [key, value] of Object.entries(entries)) {
    if (value === undefined || value === null || String(value).trim() === "") {
      continue;
    }

    query[key] = String(value);
  }

  return query;
}

export function filterListingsByCity(listings = [], city = "") {
  if (!city) return listings;
  return listings.filter(
    (listing) =>
      normalizeText(listing.location || listing.locality || listing.city) ===
      normalizeText(city),
  );
}

export function filterListingsByType(listings = [], type = "") {
  if (!type) return listings;
  return listings.filter(
    (listing) =>
      normalizeText(listing.type || listing.property_type) ===
      normalizeText(type),
  );
}

export function filterListingsByLocality(listings = [], locality = "") {
  if (!locality) return listings;

  const needle = normalizeText(locality);

  return listings.filter((listing) => {
    const value = normalizeText(
      listing.locality || listing.location || listing.address || listing.city,
    );
    return value.includes(needle);
  });
}

export function filterListingsByBedrooms(listings = [], bedrooms = "") {
  if (!bedrooms) return listings;

  const target = Number(bedrooms);
  if (!Number.isFinite(target)) return listings;

  return listings.filter((listing) => {
    const value = Number(
      listing.bedroom ??
        listing.bedrooms ??
        listing.beds ??
        listing.bhk ??
        listing.rooms ??
        0,
    );

    return Number.isFinite(value) && value === target;
  });
}

export function filterListingsByPrice(
  listings = [],
  minPrice = "",
  maxPrice = "",
) {
  const min =
    minPrice === "" || minPrice === undefined || minPrice === null
      ? null
      : Number(minPrice);
  const max =
    maxPrice === "" || maxPrice === undefined || maxPrice === null
      ? null
      : Number(maxPrice);

  if (
    (min !== null && !Number.isFinite(min)) ||
    (max !== null && !Number.isFinite(max))
  ) {
    return listings;
  }

  return listings.filter((listing) => {
    const value = Number(listing.price ?? listing.amount ?? listing.rent ?? 0);

    if (!Number.isFinite(value)) return false;
    if (min !== null && value < min) return false;
    if (max !== null && value > max) return false;

    return true;
  });
}

export function filterListingsByFurnishing(listings = [], furnishing = "") {
  if (!furnishing) return listings;

  const needle = normalizeText(furnishing);

  return listings.filter(
    (listing) => normalizeText(listing.furnishing) === needle,
  );
}

export function applyClientListingFilters(listings = [], filters = {}) {
  let next = [...listings];

  if (filters.locality) {
    next = filterListingsByLocality(next, filters.locality);
  }

  if (filters.bedrooms) {
    next = filterListingsByBedrooms(next, filters.bedrooms);
  }

  if (filters.min_price || filters.max_price) {
    next = filterListingsByPrice(
      next,
      filters.min_price || "",
      filters.max_price || "",
    );
  }

  if (filters.furnishing) {
    next = filterListingsByFurnishing(next, filters.furnishing);
  }

  return next;
}
