import type { NextApiRequest, NextApiResponse } from "next";
import { listTopLinks } from "../../../../../lib/link";
import { loadSessionFromRequest } from "../../../../../lib/session";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).send({ error: 'Method not allowed' });
    return;
  }

  const sess = await loadSessionFromRequest(req);
  if (!sess) {
    res.status(401).send({ error: 'Unauthorized' });
    return;
  }

  const MAX_QUERY_LENGTH = 200;
  const rawQuery = typeof req.query.q === 'string' ? req.query.q : '';
  const query = rawQuery.length > MAX_QUERY_LENGTH ? rawQuery.substring(0, MAX_QUERY_LENGTH) : rawQuery;
  const page = typeof req.query.page === 'string' ? parseInt(req.query.page, 10) : 1;
  const MAX_PAGE = 1000;
  const validPage = isNaN(page) || page < 1 ? 1 : Math.min(page, MAX_PAGE);

  try {
    const links = await listTopLinks("all", validPage, sess.user.id, [], false, query);
    res.status(200).send(links || []);
  } catch (err) {
    console.error('Error searching links:', err);
    res.status(500).send({ error: 'Internal server error' });
  }
}
