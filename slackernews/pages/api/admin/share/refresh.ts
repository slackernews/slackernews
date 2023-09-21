import { getIntegration, setIntegrationEnabled } from "../../../../lib/integration";
import { replyExists } from "../../../../lib/link";
import { getParam, updateSlackConfig } from "../../../../lib/param";
import { loadSession } from "../../../../lib/session";
import { getConversationReplies, slackTSToDate } from "../../../../lib/slack";

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

  const messageTs = req.body.messageTs;
  const channelId = req.body.channelId;

  const replies = await getConversationReplies(messageTs, channelId);
  replies.forEach(async (reply: any) => {
    if (reply.ts === messageTs) {
      return;
    }

    // check if this is already in the database
    const alreadyExists = await replyExists(reply.ts, channelId);
    if (alreadyExists) {
      return;
    }

    console.log("adding missing reply: ", reply);

    // parsedMessageTs = slackTSToDate(reply.ts);


    // TODO ensure user

    //  TODO ensure channel



  });
  res.status(204).send();
}
