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

  const query = typeof req.query.q === 'string' ? req.query.q : '';
  const page = typeof req.query.page === 'string' ? parseInt(req.query.page, 10) : 1;
  const validPage = isNaN(page) || page < 1 ? 1 : page;

  try {
    const links = await listTopLinks("all", validPage, sess.user.id, [], false, query);
    res.status(200).send({ links: links || [] });
  } catch (err) {
    console.error('Error searching links:', err);
    res.status(500).send({ error: 'Internal server error' });
  }
}
