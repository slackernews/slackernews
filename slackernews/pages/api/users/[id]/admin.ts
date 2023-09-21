import { loadSession } from "../../../../lib/session";
import { setUserAdmin } from "../../../../lib/user";

export default async function handler(req: any, res: any) {
  if (req.method !== 'PUT') {
    res.status(405).send({ error: 'Method not allowed' });
    return;
  }

  const auth = req.cookies.auth;
  const sess = await loadSession(auth);
  if (!sess?.user?.isSuperAdmin) {
    res.status(403).send({ error: 'Forbidden' });
    return;
  }

  await setUserAdmin(req.query.id, req.body.isAdmin);

  res.status(200).send({});
}
