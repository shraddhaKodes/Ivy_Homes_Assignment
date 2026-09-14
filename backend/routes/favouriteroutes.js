import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import express from "express";
import {
  clearSessionCookie,
  getBearerToken,
  readSessionFromCookie,
} from "../middleware/session.js";

const router = express.Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storePath = path.join(__dirname, "..", "data", "saved-listings.json");

const ivyBaseUrl = process.env.IVY_API_BASE_URL || "https://solve.ivy.homes";

const ivyApiKey = process.env.IVY_API_KEY;

function getListingId(listing = {}) {
  return listing.id || listing.listing_id || listing._id || "";
}

function getUserKey(user = {}) {
  const identity = user.email || user.id || user.user_id || user.username;
  if (!identity) return "";

  return crypto
    .createHash("sha256")
    .update(String(identity).trim().toLowerCase())
    .digest("hex");
}

function getSession(req, res) {
  const session = readSessionFromCookie(req);

  if (!session?.user || !session?.access_token) {
    clearSessionCookie(res);
    return null;
  }

  return session;
}

async function readStore() {
  try {
    return JSON.parse(await fs.readFile(storePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      return { users: {} };
    }

    throw error;
  }
}

async function writeStore(store) {
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`);
}

function getUserSavedList(store, userKey) {
  if (!store.users[userKey]) {
    store.users[userKey] = [];
  }

  return store.users[userKey];
}

async function fetchListingSnapshot(req, listingId) {
  if (!ivyApiKey) return null;

  const bearerToken = getBearerToken(req);
  if (!bearerToken) return null;

  const response = await fetch(
    new URL(`/v1/listings/${encodeURIComponent(listingId)}`, ivyBaseUrl),
    {
      method: "GET",
      headers: {
        "X-API-Key": ivyApiKey,
        Authorization: bearerToken,
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) return null;

  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json") ? response.json() : null;
}

router.get("/", async (req, res, next) => {
  try {
    const session = getSession(req, res);
    if (!session) {
      return res.status(401).json({ message: "No active Ivy session" });
    }

    const userKey = getUserKey(session.user);
    if (!userKey) {
      return res.status(401).json({ message: "Session has no user identity" });
    }

    const store = await readStore();
    return res.json({ favourites: getUserSavedList(store, userKey) });
  } catch (error) {
    return next(error);
  }
});

router.get("/ids", async (req, res, next) => {
  try {
    const session = getSession(req, res);
    if (!session) {
      return res.status(401).json({ message: "No active Ivy session" });
    }

    const userKey = getUserKey(session.user);
    if (!userKey) {
      return res.status(401).json({ message: "Session has no user identity" });
    }

    const store = await readStore();
    const ids = getUserSavedList(store, userKey).map((item) => item.listing_id);

    return res.json({ listing_ids: ids });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const session = getSession(req, res);
    if (!session) {
      return res.status(401).json({ message: "No active Ivy session" });
    }

    const userKey = getUserKey(session.user);
    if (!userKey) {
      return res.status(401).json({ message: "Session has no user identity" });
    }

    const listingId = String(req.body?.listing_id || "").trim();
    if (!listingId) {
      return res.status(400).json({ message: "listing_id is required" });
    }

    const store = await readStore();
    const savedList = getUserSavedList(store, userKey);
    const existing = savedList.find(
      (item) => String(item.listing_id) === listingId,
    );

    if (existing) {
      return res.json({ favourite: existing, duplicate: true });
    }

    let listing = req.body?.listing || null;

    if (!listing || String(getListingId(listing)) !== listingId) {
      listing = await fetchListingSnapshot(req, listingId);
    }

    const favourite = {
      id: listingId,
      favourite_id: listingId,
      listing_id: listingId,
      saved_at: new Date().toISOString(),
      listing: listing || { id: listingId, listing_id: listingId },
    };

    savedList.unshift(favourite);
    await writeStore(store);

    return res.status(201).json({ favourite, duplicate: false });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const session = getSession(req, res);
    if (!session) {
      return res.status(401).json({ message: "No active Ivy session" });
    }

    const userKey = getUserKey(session.user);
    if (!userKey) {
      return res.status(401).json({ message: "Session has no user identity" });
    }

    const favouriteId = String(req.params.id || "").trim();
    const store = await readStore();
    const savedList = getUserSavedList(store, userKey);
    const nextList = savedList.filter(
      (item) =>
        String(item.id) !== favouriteId &&
        String(item.favourite_id) !== favouriteId &&
        String(item.listing_id) !== favouriteId,
    );

    if (nextList.length === savedList.length) {
      return res.status(404).json({ message: "Saved listing not found" });
    }

    store.users[userKey] = nextList;
    await writeStore(store);

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;
