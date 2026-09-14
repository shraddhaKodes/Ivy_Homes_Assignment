const SESSION_COOKIE = "ivy_session";

function parseCookies(req) {
  const cookies = {};
  const raw = req.headers.cookie || "";

  raw.split(";").forEach((part) => {
    const trimmed = part.trim();
    if (!trimmed) return;

    const equal = trimmed.indexOf("=");
    if (equal === -1) return;

    const key = trimmed.slice(0, equal);
    const value = trimmed.slice(equal + 1);

    try {
      cookies[key] = decodeURIComponent(value);
    } catch {
      cookies[key] = value;
    }
  });

  return cookies;
}

function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  const configuredSecure = process.env.COOKIE_SECURE;

  return {
    httpOnly: true,
    sameSite:
      process.env.COOKIE_SAME_SITE || (isProduction ? "none" : "lax"),
    secure:
      configuredSecure === undefined
        ? isProduction
        : configuredSecure === "true",
    path: "/",
  };
}

export function readSessionFromCookie(req) {
  const raw = parseCookies(req)[SESSION_COOKIE];
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function writeSessionCookie(res, session, existingSession = null) {
  const expiresIn = Number(session.expires_in || 900);

  const safeSession = {
    access_token: session.access_token,
    refresh_token:
      session.refresh_token || existingSession?.refresh_token || null,
    token_type: session.token_type || "Bearer",
    expires_in: expiresIn,
    expires_at: Date.now() + expiresIn * 1000,
    refresh_url:
      session.refresh_url || existingSession?.refresh_url || "/auth/refresh",
    user: session.user || existingSession?.user || null,
  };

  // Cookie lifetime should cover the refresh token/session,
  // not just the short-lived access token.
  const cookieMaxAge =
    Number(process.env.SESSION_COOKIE_MAX_AGE_MS) ||
    24 * 60 * 60 * 1000;

  res.cookie(SESSION_COOKIE, JSON.stringify(safeSession), {
    ...getCookieOptions(),
    maxAge: cookieMaxAge,
  });

  return safeSession;
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, getCookieOptions());
}

export function sanitizeSession(session) {
  if (!session) return null;

  return {
    user: session.user || null,
    expires_in: session.expires_in,
    expires_at: session.expires_at,
    token_type: session.token_type || "Bearer",
  };
}

export function getBearerToken(req) {
  const header = req.headers.authorization;
  if (header) return header;

  const session = readSessionFromCookie(req);

  if (!session?.access_token) return null;

  return `${session.token_type || "Bearer"} ${session.access_token}`;
}