import express from 'express';
import { getBearerToken } from '../middleware/session.js';

const router = express.Router();

const ivyBaseUrl =
  process.env.IVY_API_BASE_URL || 'https://solve.ivy.homes';

const ivyApiKey = process.env.IVY_API_KEY;

async function forwardProjectRequest(req, res, ivyPath) {
  if (!ivyApiKey) {
    return res.status(500).json({
      message: 'IVY_API_KEY is not configured on the server',
    });
  }

  try {
    const target = new URL(ivyPath, ivyBaseUrl);

    for (const [key, value] of Object.entries(req.query)) {
      if (value !== undefined) {
        target.searchParams.set(key, value);
      }
    }

    const headers = {
      'X-API-Key': ivyApiKey,
      Accept: 'application/json',
    };

    const bearerToken = getBearerToken(req);
    if (bearerToken) {
      headers.Authorization = bearerToken;
    }

    const response = await fetch(target, {
      method: 'GET',
      headers,
    });

    const contentType = response.headers.get('content-type') || '';

    const data = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    res.status(response.status);

    if (contentType.includes('application/json')) {
      return res.json(data);
    }

    return res.send(data);
  } catch (error) {
    console.error('Ivy projects request failed:', error);

    return res.status(502).json({
      message: 'Unable to reach Ivy Homes API',
    });
  }
}

router.get('/', (req, res) => {
  forwardProjectRequest(req, res, '/v1/projects');
});

router.get('/:projectId', (req, res) => {
  forwardProjectRequest(
    req,
    res,
    `/v1/projects/${encodeURIComponent(req.params.projectId)}`
  );
});

export default router;
