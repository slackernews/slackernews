import type { NextApiRequest, NextApiResponse } from "next";
import { listApiTokens, createApiToken, deleteApiToken } from "../../../lib/apiToken";
import { loadSession, loadSessionFromRequest, getApiTokenJwt } from "../../../lib/session";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sess = await loadSessionFromRequest(req);
  if (!sess) {
    res.status(401).send({ error: 'Unauthorized' });
    return;
  }

  // API-token authentication is allowed only for GET (reading tokens).
  // POST (create) and DELETE (revoke) require a web session (cookie auth)
  // to prevent privilege escalation where a compromised API token could
  // generate unlimited additional tokens.
  if (sess.isApiToken && req.method !== 'GET') {
    res.status(403).send({ error: 'Token management requires web session authentication' });
    return;
  }

  if (req.method === 'GET') {
    try {
      const tokens = await listApiTokens(sess.user.id);
      res.status(200).send({ tokens });
    } catch (err) {
      console.error('Error listing tokens:', err);
      res.status(500).send({ error: 'Internal server error' });
    }
    return;
  }

  if (req.method === 'POST') {
    if (!req.body || typeof req.body !== 'object') {
      res.status(400).send({ error: 'Invalid request body' });
      return;
    }

    const { name } = req.body;
    if (typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).send({ error: 'Token name is required' });
      return;
    }

    try {
      const { token } = await createApiToken(sess.user.id, name.trim(), sess.accessToken);
      const jwt = await getApiTokenJwt(sess.user.id, token.id);
      // Strip sensitive accessToken from response
      const publicToken = {
        id: token.id,
        userId: token.userId,
        name: token.name,
        createdAt: token.createdAt,
        lastUsedAt: token.lastUsedAt,
      };
      res.status(201).send({ token: publicToken, jwt });
    } catch (err) {
      console.error('Error creating token:', err);
      res.status(500).send({ error: 'Internal server error' });
    }
    return;
  }

  if (req.method === 'DELETE') {
    const id = typeof req.query.id === 'string' ? req.query.id : Array.isArray(req.query.id) ? req.query.id[0] : undefined;
    if (!id) {
      res.status(400).send({ error: 'Token ID is required' });
      return;
    }

    try {
      const deleted = await deleteApiToken(id, sess.user.id);
      if (!deleted) {
        res.status(404).send({ error: 'Token not found' });
        return;
      }

      res.status(204).end();
    } catch (err) {
      console.error('Error deleting token:', err);
      res.status(500).send({ error: 'Internal server error' });
    }
    return;
  }

  res.status(405).send({ error: 'Method not allowed' });
}
