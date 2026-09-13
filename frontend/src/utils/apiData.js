export function getCollection(payload) {
  if (Array.isArray(payload)) return payload;

  return (
    payload?.results ||
    payload?.data ||
    payload?.items ||
    payload?.listings ||
    payload?.rentals ||
    payload?.projects ||
    payload?.favourites ||
    []
  );
}

export function getTotal(payload, fallback = 0) {
  return payload?.total || payload?.count || payload?.total_count || fallback;
}

export function pickValue(item = {}, keys = [], fallback = "Not available") {
  for (const key of keys) {
    const value = item[key];

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return fallback;
}

export function formatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString() : value;
}

export function formatMoney(value) {
  if (value === undefined || value === null || value === "") return "Price on request";
  if (typeof value === "string" && Number.isNaN(Number(value))) return value;

  return `Rs ${Number(value).toLocaleString("en-IN")}`;
}

export function formatProjectPrice(value) {
  if (value === undefined || value === null || value === "") return "";
  const number = Number(value);

  if (!Number.isFinite(number)) return value;

  return number >= 10 ? `Rs ${number} L` : `Rs ${number} Cr`;
}

export function formatRange(min, max, formatter = (value) => value) {
  const hasMin = min !== undefined && min !== null && min !== "";
  const hasMax = max !== undefined && max !== null && max !== "";

  if (hasMin && hasMax) return `${formatter(min)} - ${formatter(max)}`;
  if (hasMin) return formatter(min);
  if (hasMax) return formatter(max);

  return "Not listed";
}

export function titleCase(value) {
  return String(value || "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
