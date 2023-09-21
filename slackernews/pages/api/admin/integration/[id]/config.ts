import { getIntegration, setIntegrationConfig } from "../../../../../lib/integration";
import { getParam, updateSlackConfig } from "../../../../../lib/param";
import { loadSession } from "../../../../../lib/session";

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

  if (req.method !== 'PUT') {
    res.status(405).send({ error: 'Method not allowed' });
    return;
  }

  const integration = await getIntegration(req.query.id);
  if (!integration) {
    res.status(404).send({ error: 'Integration not found' });
    return;
  }

  // we don't need to validate the config here, because we're just saving it
  // and it might be partial
  await setIntegrationConfig(req.query.id, req.body);

  res.status(204).send({});
}
