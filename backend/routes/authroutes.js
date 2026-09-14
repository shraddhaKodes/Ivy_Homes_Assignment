import express from "express";
import {
  clearSessionCookie,
  readSessionFromCookie,
  sanitizeSession,
  writeSessionCookie,
} from "../middleware/session.js";

const router = express.Router();

const ivyBaseUrl =
  process.env.IVY_API_BASE_URL || "https://solve.ivy.homes";

const ivyApiKey = process.env.IVY_API_KEY;

async function ivyRequest(path, options = {}) {
  if (!ivyApiKey) {
    throw new Error("IVY_API_KEY is not configured");
  }

  return fetch(new URL(path, ivyBaseUrl), {
    ...options,
    headers: {
      "X-API-Key": ivyApiKey,
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });
}

router.post("/login", async (req, res) => {
  try {
    const response = await ivyRequest("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body || {}),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    if (!data?.access_token) {
      return res.status(502).json({
        message: "Ivy login response did not contain an access token",
      });
    }

    const session = writeSessionCookie(res, data);

    return res.status(response.status).json({
      session: sanitizeSession(session),
    });
  } catch (error) {
    console.error("Ivy login failed:", error);

    return res.status(502).json({
      message: "Unable to reach Ivy Homes API",
    });
  }
});

router.post("/refresh", async (req, res) => {
  const session = readSessionFromCookie(req);

  if (!session?.refresh_token) {
    clearSessionCookie(res);

    return res.status(401).json({
      message: "No refresh token available",
    });
  }

  try {
    const response = await ivyRequest("/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh_token: session.refresh_token,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      clearSessionCookie(res);

      return res.status(response.status).json(data);
    }

    if (!data?.access_token) {
      clearSessionCookie(res);

      return res.status(502).json({
        message: "Ivy refresh response did not contain an access token",
      });
    }

    const updatedSession = writeSessionCookie(
      res,
      data,
      session
    );

    return res.json({
      session: sanitizeSession(updatedSession),
    });
  } catch (error) {
    console.error("Ivy refresh failed:", error);

    return res.status(502).json({
      message: "Unable to refresh Ivy session",
    });
  }
});

router.get("/session", (req, res) => {
  const session = readSessionFromCookie(req);

  if (!session?.access_token || !session?.user) {
    clearSessionCookie(res);

    return res.status(401).json({
      message: "No active Ivy session",
    });
  }

  return res.json({
    session: sanitizeSession(session),
  });
});

router.post("/logout", async (req, res) => {
  const session = readSessionFromCookie(req);

  try {
    if (session?.access_token) {
      await ivyRequest("/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
    }
  } catch (error) {
    console.error("Ivy logout request failed:", error);
  }

  clearSessionCookie(res);

  return res.status(204).send();
});

export default router;