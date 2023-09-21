import { getIntegration, setIntegrationEnabled } from "../../../../../lib/integration";
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

  // if the integration is already at the right status, return a 204
  if (integration.is_enabled === req.body.enabled) {
    res.status(204).send({});
    return;
  }

  // validate that there's config
  if (integration.config === JSON.stringify({})) {
    res.status(409).send({ error: 'Cannot enable integration without config' });
    return;
  }

  await setIntegrationEnabled(req.query.id, req.body.enabled);

  res.status(204).send({});
}
