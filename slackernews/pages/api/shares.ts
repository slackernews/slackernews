import { getLink } from "../../lib/link";
import { loadSession } from "../../lib/session";
import { listShares } from "../../lib/share";

export default async function handler(req: any, res: any) {
  const auth = req.cookies.auth;
  const sess = await loadSession(auth);
  if (!sess) {
    res.status(401).send({ error: 'Unauthorized' });
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).send({ error: 'Method not allowed' });
    return;
  }

  // just make sure link exists
  await getLink(req.query.link);
  const renderableShares = await listShares(req.query.link);

  res.status(200).send(renderableShares);
}
