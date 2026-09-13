import express from "express";
import {
  clearSessionCookie,
  readSessionFromCookie,
  sanitizeSession,
  writeSessionCookie,
} from "../middleware/session.js";

const router = express.Router();

const ivyBaseUrl = process.env.IVY_API_BASE_URL || "https://solve.ivy.homes";

const ivyApiKey = process.env.IVY_API_KEY;

async function forwardAuthRequest(req, res, ivyPath) {
  if (!ivyApiKey) {
    return res.status(500).json({
      message: "IVY_API_KEY is not configured on the server",
    });
  }

  try {
    const response = await fetch(new URL(ivyPath, ivyBaseUrl), {
      method: req.method,
      headers: {
        "X-API-Key": ivyApiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(req.body || {}),
    });

    const contentType = response.headers.get("content-type") || "";

    const data = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (response.ok && data?.access_token) {
      const session = writeSessionCookie(res, data);
      return res.status(response.status).json({ session: sanitizeSession(session) });
    }

    res.status(response.status);

    if (contentType.includes("application/json")) {
      return res.json(data);
    }

    return res.send(data);
  } catch (error) {
    console.error("Ivy auth request failed:", error);

    return res.status(502).json({
      message: "Unable to reach Ivy Homes API",
    });
  }
}

router.get("/session", (req, res) => {
  const session = readSessionFromCookie(req);

  if (!session?.access_token || !session?.user) {
    clearSessionCookie(res);
    return res.status(401).json({ message: "No active Ivy session" });
  }

  if (Number(session.expires_at || 0) <= Date.now()) {
    clearSessionCookie(res);
    return res.status(401).json({ message: "Session expired" });
  }

  return res.json({ session: sanitizeSession(session) });
});

router.post("/login", (req, res) => {
  return forwardAuthRequest(req, res, "/auth/login");
});

router.post("/refresh", (req, res) => {
  return forwardAuthRequest(req, res, "/auth/refresh");
});

router.post("/logout", (req, res) => {
  clearSessionCookie(res);
  return res.status(204).send();
});

export default router;
