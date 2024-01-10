import { getCleanedUrl, getDocumentIcon, getDocumentTitle, getDomain, getResponsibleIntegration } from "../../../lib/integration";
import { CreateLinkOpts, getOrCreateLink } from "../../../lib/link";
import { getParam } from "../../../lib/param";
import { scoreReactionAdd, scoreReactionRemove, scoreShare } from "../../../lib/score";
import { createShare, getShare } from "../../../lib/share";
import { CreateSlackChannelOpts, SlackChannel, SlackUser, createSlackChannel, getOrCreateSlackUser, getSlackChannel, getSlackUser } from "../../../lib/slack";


export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).send({ error: 'Method not allowed' });
    return;
  }

  // first, check if it's a challenge for the initial setup
  if (req.body.challenge) {
    res.status(200).send({ challenge: req.body.challenge });
    return;
  }

  if (req.body.type === "app_rate_limited") {
    res.status(200).send({});
    return;
  }

  if (req.body.type === "event_callback") {
    switch (req.body.event.type) {
      case "message":
        await handleSlackMessage(req.body.event);
        res.status(200).send({});
        return;
      case "reaction_added":
        await handleSlackReactionAdded(req.body.event);
        res.status(200).send({});
        return;
      case "reaction_removed":
        await handleSlackReactionRemoved(req.body.event);
        res.status(200).send({});
        return;
      default:
        break;
    }
  }

  res.status(200).send({});
}

async function handleSlackReactionAdded(event: any): Promise<void> {
  const parsedTs = slackTSToTime(event.event_ts);
  const share = await getShare(event.item.channel, event.item.ts);
  if (!share) {
    return;
  }

  await scoreReactionAdd(share.link.url, parsedTs);
}

async function handleSlackReactionRemoved(event: any): Promise<void> {
  const parsedTs = slackTSToTime(event.event_ts);
  const share = await getShare(event.item.channel, event.item.ts);
  if (!share) {
    return;
  }

  await scoreReactionRemove(share.link.url, parsedTs);
}

async function handleSlackMessage(event: any): Promise<void> {
  console.log(`handleSlackMessage(${event.channel}, ${event.user}, ${event.ts})`);

  if (!event.blocks) {
    return;
  }

  event.blocks.forEach(async (block: any) => {
    if (block.type === "rich_text") {
      block.elements.forEach(async (element: any) => {
        if (element.type === "rich_text_section") {
          element.elements.forEach(async (innerElement: any) => {
            if (innerElement.type === "link") {
              // parse the url for the scheme
              const url = new URL(innerElement.url);
              const scheme = url.protocol.slice(0, -1);
              if (scheme === "http" || scheme === "https") {
                await handleSlackLinkSharedEvent(event.channel, event.user, event.ts, innerElement.url);
              }
            }
          });
        }
      });
    }
  });
}

async function handleSlackLinkSharedEvent(channelId: string, userId: string, ts: string, url: string): Promise<void> {
  // make sure the slack_user exists in the database
  const user = await ensureSlackUser(userId);
  const channel = await ensureSlackChannel(channelId);

  const permalink = await getMessagePermalink(channelId, ts);

  if (url.startsWith("http://")) {
    url = url.replace("http://", "https://");
  }

  const integration = await getResponsibleIntegration(url);
  console.log(`received link with a configured integration, url: ${url}, integration: ${integration.title}`);

  let title = await getDocumentTitle(integration, url, user, channel);
  if (title.length > 150) {
    title = title.substring(0, 149) + "…";
  }

  const icon = await getDocumentIcon(integration, url);

  const parsedTs = slackTSToTime(ts)

  let isDM = true;
  let isPrivate = false;
  let isHidden = false;

  if (channel) {
    isDM = channel.isDm;
    isPrivate = channel.isPrivate;
    isHidden = channel.isHidden;
  }

  let isPublicShared = !isDM && !isPrivate && !isHidden;
  let firstSharedAt: Date | null = null;
  let firstSharedBy: string | null = null;
  let firstSharedIn: string | null = null;
  let firstSharedMessageTs: string | null = null;

  if (isPublicShared) {
    firstSharedAt = parsedTs;
    firstSharedBy = user.id;
    firstSharedIn = channel.id;
    firstSharedMessageTs = ts;
  }

  // ensure the link is in the database
  const cleanedUrl = await getCleanedUrl(integration, url);
  const domain = await getDomain(integration, url);

  const createLinkOpts: CreateLinkOpts = {
    url: cleanedUrl,
    domain: domain,
    title: title,
    icon: icon,
    isDM: isDM,
    isPrivate: isPrivate,
    isHidden: isHidden,
    isPublicShared: isPublicShared,
    firstSharedBy: firstSharedBy,
    firstSharedIn: firstSharedIn,
    firstSharedMessageTs: firstSharedMessageTs,
  };

  console.log(createLinkOpts);

  const link = await getOrCreateLink(createLinkOpts);

  // create the share in the database
  const share = await createShare(cleanedUrl, permalink, user.id, channel.id, ts, parsedTs);
  console.log(share);
  // update the score in the database
  await scoreShare(cleanedUrl, parsedTs);
  console.log("scored");
}

function slackTSToTime(ts: string): Date {
  return new Date(parseInt(ts.split(".")[0]) * 1000);
}

async function getMessagePermalink(channelId: string, ts: string): Promise<string> {
  console.log(`getMessagePermalink(${channelId}, ${ts})`);
  const res = await fetch(`https://slack.com/api/chat.getPermalink?channel=${channelId}&message_ts=${ts}`, {
    headers: {
      "Authorization": `Bearer ${await getParam("SlackBotToken")}`,
      "Content-Type": `application/json`,
    },
  });
  const data = await res.json();
  if (!data.ok) {
    console.error(data.error);
    throw new Error(data.error);
  }
  return data.permalink;
}

async function ensureSlackUser(userId: string): Promise<SlackUser> {
  console.log(`ensureSlackUser(${userId})`);
  const slackUser = await getSlackUser(userId);
  if (slackUser) {
    return slackUser;
  }

  // get the slack user details from the slack api
  try {
    const res = await fetch(`https://slack.com/api/users.info?user=${userId}`, {
      headers: {
        "Authorization": `Bearer ${await getParam("SlackBotToken")}`,
        "Content-Type": `application/json`,
      },
    });
    const data = await res.json();
    if (!data.ok) {
      console.error(data.error);
      throw new Error(data.error);
    }

    // insert the slack user into the database
    // we don't have the email address at this point
    return  await getOrCreateSlackUser(data.user.id, "", data.user.name, data.user.real_name, data.user.profile.image_72);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function ensureSlackChannel(channelId: string): Promise<SlackChannel> {
  console.log(`ensureSlackChannel(${channelId})`);
  const slackChannel = await getSlackChannel(channelId);
  if (slackChannel) {
    return slackChannel;
  }

  // get the slack channel from the slack api
  try {
    const res = await fetch(`https://slack.com/api/conversations.info?channel=${channelId}`, {
      headers: {
        "Authorization": `Bearer ${await getParam("SlackBotToken")}`,
        "Content-Type": `application/json`,
      },
    });
    const data = await res.json();
    if (!data.ok && data.error !== "channel_not_found") {
      console.error(data.error);
      throw new Error(data.error);
    }

    let createSlackChannelOpts: CreateSlackChannelOpts = {
      id: channelId,
      name: data.channel ? data.channel.name : channelId,
      is_dm: data.channel ? data.channel.is_im : true,
      is_private: data.channel ? data.channel.is_private : true,
      is_shared: data.channel ? data.channel.is_ext_shared : false,
      is_hidden: false,
    }

    return await createSlackChannel(createSlackChannelOpts);
  } catch (err) {
    console.error(err);
    throw err;
  }
}
