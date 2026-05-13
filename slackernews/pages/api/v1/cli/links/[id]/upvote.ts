import type { NextApiRequest, NextApiResponse } from "next";
import { getLink } from "../../../../../../lib/link";
import { loadSessionFromRequest } from "../../../../../../lib/session";
import { addUserVoteOnLink, getUserVoteOnLink, removeUserVoteOnLink } from "../../../../../../lib/score";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
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

  if (req.method === 'POST') {
    const userVote = await getUserVoteOnLink(sess.user.id, linkId);
    if (userVote > 0) {
      res.status(409).send({ error: 'Already upvoted' });
      return;
    }

    try {
      await addUserVoteOnLink(sess.user.id, linkId);
      res.status(200).send({});
    } catch (err) {
      console.error('Error adding upvote:', err);
      res.status(500).send({ error: 'Internal server error' });
    }
    return;
  }

  if (req.method === 'DELETE') {
    const removed = await removeUserVoteOnLink(sess.user.id, linkId);
    if (!removed) {
      res.status(404).send({ error: 'No vote to remove' });
      return;
    }

    res.status(204).end();
    return;
  }
}
