import { getLink } from "../../../lib/link";
import { addLinkBoost } from "../../../lib/score";
import { loadSession } from "../../../lib/session";

export default async function handler(req: any, res: any) {
  const auth = req.cookies.auth;
  const sess = await loadSession(auth);
  if (!sess) {
    res.status(401).send({ error: 'Unauthorized' });
    return;
  }

  if (!sess.user!.isSuperAdmin) {
    res.status(403).send({ error: 'Forbidden' });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send({ error: 'Method not allowed' });
    return;
  }

  // just make sure link exists
  await getLink(req.query.link);
  await addLinkBoost(req.query.link);

  res.status(200).send({});
}
