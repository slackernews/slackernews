import type { NextApiRequest, NextApiResponse } from "next";
import { getLink } from "../../../../../../lib/link";
import { loadSessionFromRequest } from "../../../../../../lib/session";
import { createUserComment } from "../../../../../../lib/user_comment";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).send({ error: 'Method not allowed' });
    return;
  }

  const sess = await loadSessionFromRequest(req);
  if (!sess) {
    res.status(401).send({ error: 'Unauthorized' });
    return;
  }

  let linkId: string;
  try {
    const encodedId = req.query.id;
    linkId = typeof encodedId === 'string' ? decodeURIComponent(encodedId) : Array.isArray(encodedId) ? decodeURIComponent(encodedId[0]) : '';
  } catch (err) {
    res.status(400).send({ error: 'Invalid link ID encoding' });
    return;
  }

  if (!linkId) {
    res.status(400).send({ error: 'Link ID is required' });
    return;
  }

  // Verify link exists and is not hidden
  let link: any;
  try {
    link = await getLink(linkId);
  } catch (err) {
    if (err instanceof Error && err.message.includes('No link found')) {
      res.status(404).send({ error: 'Link not found' });
      return;
    }
    console.error('Error looking up link:', err);
    res.status(500).send({ error: 'Internal server error' });
    return;
  }

  if (link.isHidden) {
    res.status(404).send({ error: 'Link not found' });
    return;
  }

  if (!req.body || typeof req.body !== 'object') {
    res.status(400).send({ error: 'Invalid request body' });
    return;
  }

  const { body } = req.body;
  if (typeof body !== 'string' || body.trim().length === 0) {
    res.status(400).send({ error: 'Comment body is required' });
    return;
  }

  if (body.length > 2000) {
    res.status(400).send({ error: 'Comment body exceeds maximum length of 2000 characters' });
    return;
  }

  try {
    const comment = await createUserComment(linkId, sess.user.id, body.trim());
    res.status(201).send({ comment });
  } catch (err) {
    console.error('Error creating comment:', err);
    res.status(500).send({ error: 'Internal server error' });
  }
}
