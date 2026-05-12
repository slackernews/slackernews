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
  const isApiTokenAuth = req.headers?.authorization?.startsWith('Bearer ');
  if (isApiTokenAuth && req.method !== 'GET') {
    res.status(403).send({ error: 'Token management requires web session authentication' });
    return;
  }

  if (req.method === 'GET') {
    const tokens = await listApiTokens(sess.user.id);
    res.status(200).send({ tokens });
    return;
  }

  if (req.method === 'POST') {
    const { name } = req.body;
    if (typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).send({ error: 'Token name is required' });
      return;
    }

    const { token } = await createApiToken(sess.user.id, name.trim(), sess.accessToken);
    const jwt = await getApiTokenJwt(sess.user.id, token.id);
    res.status(201).send({ token, jwt });
    return;
  }

  if (req.method === 'DELETE') {
    const id = typeof req.query.id === 'string' ? req.query.id : Array.isArray(req.query.id) ? req.query.id[0] : undefined;
    if (!id) {
      res.status(400).send({ error: 'Token ID is required' });
      return;
    }

    const deleted = await deleteApiToken(id, sess.user.id);
    if (!deleted) {
      res.status(404).send({ error: 'Token not found' });
      return;
    }

    res.status(204).end();
    return;
  }

  res.status(405).send({ error: 'Method not allowed' });
}
