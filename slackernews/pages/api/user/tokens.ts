import { listApiTokens, createApiToken, deleteApiToken } from "../../../lib/api_token";
import { loadSession, loadSessionFromRequest, getApiTokenJwt } from "../../../lib/session";

export default async function handler(req: any, res: any) {
  const sess = await loadSessionFromRequest(req);
  if (!sess) {
    res.status(401).send({ error: 'Unauthorized' });
    return;
  }

  if (req.method === 'GET') {
    const tokens = await listApiTokens(sess.user.id);
    res.status(200).send({ tokens });
    return;
  }

  if (req.method === 'POST') {
    const { name } = req.body;
    if (!name || name.trim().length === 0) {
      res.status(400).send({ error: 'Token name is required' });
      return;
    }

    const { token } = await createApiToken(sess.user.id, name.trim());
    const jwt = await getApiTokenJwt(sess.user.id, token.id);
    res.status(201).send({ token, jwt });
    return;
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) {
      res.status(400).send({ error: 'Token ID is required' });
      return;
    }

    const deleted = await deleteApiToken(id, sess.user.id);
    if (!deleted) {
      res.status(404).send({ error: 'Token not found' });
      return;
    }

    res.status(204).send();
    return;
  }

  res.status(405).send({ error: 'Method not allowed' });
}
