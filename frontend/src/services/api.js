function resolveApiBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";
  const url = new URL(configured);
  const pageHost = window.location.hostname;

  if (
    ["localhost", "127.0.0.1"].includes(url.hostname) &&
    ["localhost", "127.0.0.1"].includes(pageHost)
  ) {
    url.hostname = pageHost;
  }

  return url.toString().replace(/\/$/, "");
}

export const API_BASE_URL = resolveApiBaseUrl();

let currentSession = null;

export function getSession() {
  return currentSession;
}

export function setSession(session) {
  currentSession = session || null;
}

export function clearSession() {
  currentSession = null;
}

function buildUrl(path, query = {}) {
  const url = new URL(`${API_BASE_URL}${path}`);

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => url.searchParams.append(key, String(item)));
      return;
    }

    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

function isJsonResponse(response) {
  const type = response.headers.get("content-type") || "";
  return type.includes("application/json");
}

async function parseResponse(response) {
  if (isJsonResponse(response)) {
    return response.json();
  }

  return response.text();
}

function normalizeError(payload, fallback = "Request failed") {
  if (payload && typeof payload === "object") {
    if (payload.message) return payload.message;
    if (payload.error) return payload.error;
  }

  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  return fallback;
}

export async function request(path, options = {}) {
  const {
    method = "GET",
    body,
    query = {},
    headers = {},
  } = options;

  const hasJsonBody = body !== undefined && body !== null && method !== "GET";
  const reqHeaders = {
    Accept: "application/json",
    ...headers,
  };

  if (hasJsonBody) {
    reqHeaders["Content-Type"] = "application/json";
  }

  let response;

  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers: reqHeaders,
      body: hasJsonBody ? JSON.stringify(body) : undefined,
      credentials: "include",
    });
  } catch {
    throw new Error(
      `Cannot reach backend at ${API_BASE_URL}. Start the backend server and check VITE_API_BASE_URL.`,
    );
  }

  const payload = await parseResponse(response);

  if (!response.ok) {
    const message = normalizeError(payload, "Request failed");
    throw new Error(message);
  }

  return payload;
}

export function login(credentials) {
  return request("/api/auth/login", {
    method: "POST",
    body: credentials,
  }).then((payload) => payload?.session || payload);
}

export function logout() {
  return request("/api/auth/logout", {
    method: "POST",
  });
}

export async function restoreSession() {
  const payload = await request("/api/auth/session", {
    method: "GET",
  });

  if (payload?.session?.user) {
    const normalized = {
      ...payload.session,
      expires_in: Number(payload.session.expires_in || 1800),
      expires_at: payload.session.expires_at || Date.now() + 1800 * 1000,
    };

    setSession(normalized);
    return normalized;
  }

  clearSession();
  return null;
}

export function checkHealth() {
  return request("/api/health");
}

export function listListings(params = {}) {
  return request("/api/listings", { query: params });
}

export function getListing(listingId) {
  return request(`/api/listings/${encodeURIComponent(listingId)}`);
}

export function getSimilarListings(listingId) {
  return request(`/api/listings/${encodeURIComponent(listingId)}/similar`);
}

export function listRentals(params = {}) {
  return request("/api/rentals", { query: params });
}

export function getRental(listingId) {
  return request(`/api/rentals/${encodeURIComponent(listingId)}`);
}

export function listProjects(params = {}) {
  return request("/api/projects", { query: params });
}

export function getProject(projectId) {
  return request(`/api/projects/${encodeURIComponent(projectId)}`);
}

export function getFavourites() {
  return request("/api/favourites");
}

export function getFavouriteIds() {
  return request("/api/favourites/ids");
}

export function addFavourite(listingId, listing = null) {
  return request("/api/favourites", {
    method: "POST",
    body: { listing_id: listingId, listing },
  });
}

export function removeFavourite(id) {
  return request(`/api/favourites/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function getAnalyticsSummary() {
  return request("/api/analytics/summary");
}

export function createPaginationPayload(page, limit = 50) {
  return {
    limit,
    offset: Number(page - 1) * limit,
  };
}
