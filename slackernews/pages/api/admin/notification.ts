import { getAdminNotificationSettings, getParam, updateAdminNotificationSetting, updateSlackConfig } from "../../../lib/param";
import { loadSession } from "../../../lib/session";
import { validateSlackConfig } from "../../../lib/slack";

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

  await updateAdminNotificationSetting(req.body.key, req.body.enabled);
  const notificationSettings = await getAdminNotificationSettings();

  res.status(200).send(notificationSettings);
}
