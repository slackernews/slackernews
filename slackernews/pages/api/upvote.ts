import { getLink } from "../../lib/link";
import { addUserVoteOnLink, getUserVoteOnLink } from "../../lib/score";
import { loadSession } from "../../lib/session";

export default async function handler(req: any, res: any) {
  const auth = req.cookies.auth;
  const sess = await loadSession(auth);
  if (!sess) {
    res.status(401).send({ error: 'Unauthorized' });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send({ error: 'Method not allowed' });
    return;
  }

  // just make sure link exists
  await getLink(req.query.link);

  const userVote = await getUserVoteOnLink(sess.user.id, req.query.link);
  if (userVote > 0) {
    res.status(409).send({ error: 'Already upvoted' });
    return;
  }

  await addUserVoteOnLink(sess.user.id, req.query.link);
  res.status(200).send({});
}
