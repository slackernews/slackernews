import { getParam, updateSlackConfig } from "../../../lib/param";
import { loadSession } from "../../../lib/session";
import { validateSlackConfig } from "../../../lib/slack";

export default async function handler(req: any, res: any) {
  const auth = req.cookies.auth;
  const allowAnon = !(await getParam("SlackBotToken"));
  const sess = await loadSession(auth);
  if (!sess && !allowAnon) {
    res.status(401).send({ error: 'Unauthorized' });
    return;
  }

  if (sess && !sess.user!.isSuperAdmin) {
    res.status(403).send({ error: 'Forbidden' });
    return;
  }

  if (req.method !== 'PUT') {
    res.status(405).send({ error: 'Method not allowed' });
    return;
  }

  const { botToken, userToken, clientId, clientSecret, teamId } = req.body;
  const isValid = await validateSlackConfig(botToken, userToken, clientId, clientSecret, teamId);
  if (!isValid) {
    res.status(400).send({ error: 'Invalid Slack configuration' });
    return;
  }

  await updateSlackConfig(botToken, userToken, clientId, clientSecret, teamId);

  res.status(200).send({});
}
