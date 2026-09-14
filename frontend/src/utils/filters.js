const normalizeText = (value = "") =>
  String(value ?? "")
    .trim()
    .toLowerCase();

export function buildListingFilterQuery(filters = {}) {
  const query = {};

  const entries = {
    property_type: filters.property_type,
    locality: filters.locality,
    bedrooms: filters.bedrooms,
    min_rent: filters.min_rent ?? filters.min_price,
    max_rent: filters.max_rent ?? filters.max_price,
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

export function buildProjectFilterQuery(filters = {}) {
  const query = {};

  const entries = {
    locality: filters.locality,
    developer_name: filters.developer_name,
    project_status: filters.project_status,
    price_min: filters.price_min ?? filters.min_price,
    price_max: filters.price_max ?? filters.max_price,
    project_id: filters.project_id ?? filters.project,
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

export function filterProjectsByLocality(projects = [], locality = "") {
  if (!locality) return projects;

  const needle = normalizeText(locality);
  return projects.filter((project) => {
    const value = normalizeText(
      project.locality || project.city || project.location || project.address,
    );
    return value.includes(needle);
  });
}

export function filterProjectsByDeveloperName(
  projects = [],
  developerName = "",
) {
  if (!developerName) return projects;

  const needle = normalizeText(developerName);
  return projects.filter((project) => {
    const value = normalizeText(project.developer_name || project.developer);
    return value.includes(needle);
  });
}

export function filterProjectsByProjectStatus(
  projects = [],
  projectStatus = "",
) {
  if (!projectStatus) return projects;

  const needle = normalizeText(projectStatus);
  return projects.filter((project) => {
    const value = normalizeText(
      project.project_status || project.status || project.stage,
    );
    return value.includes(needle);
  });
}

export function filterProjectsByPrice(
  projects = [],
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
    return projects;
  }

  return projects.filter((project) => {
    const lower = Number(project.price_min ?? Number.POSITIVE_INFINITY);
    const upper = Number(project.price_max ?? Number.NEGATIVE_INFINITY);

    if (!Number.isFinite(lower) || !Number.isFinite(upper)) {
      return false;
    }

    if (min !== null && upper < min) return false;
    if (max !== null && lower > max) return false;

    return true;
  });
}

export function filterProjectsByProjectId(projects = [], projectId = "") {
  if (!projectId) return projects;

  const needle = normalizeText(projectId);
  return projects.filter((project) => {
    const value = normalizeText(
      project.project_id || project.id || project._id,
    );
    return value.includes(needle);
  });
}

export function applyClientProjectFilters(projects = [], filters = {}) {
  let next = [...projects];

  if (filters.locality) {
    next = filterProjectsByLocality(next, filters.locality);
  }

  if (filters.developer_name) {
    next = filterProjectsByDeveloperName(next, filters.developer_name);
  }

  if (filters.project_status) {
    next = filterProjectsByProjectStatus(next, filters.project_status);
  }

  const minPrice = filters.price_min ?? filters.min_price ?? "";
  const maxPrice = filters.price_max ?? filters.max_price ?? "";
  if (minPrice || maxPrice) {
    next = filterProjectsByPrice(next, minPrice, maxPrice);
  }

  if (filters.project_id) {
    next = filterProjectsByProjectId(next, filters.project_id);
  }

  return next;
}

export function applyClientListingFilters(listings = [], filters = {}) {
  let next = [...listings];

  if (filters.locality) {
    next = filterListingsByLocality(next, filters.locality);
  }

  if (filters.bedrooms) {
    next = filterListingsByBedrooms(next, filters.bedrooms);
  }

  const minRent = filters.min_rent ?? filters.min_price ?? "";
  const maxRent = filters.max_rent ?? filters.max_price ?? "";
  if (minRent || maxRent) {
    next = filterListingsByPrice(next, minRent, maxRent);
  }

  if (filters.furnishing) {
    next = filterListingsByFurnishing(next, filters.furnishing);
  }

  return next;
}
