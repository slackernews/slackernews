import {getSequelize } from "./db";
import parse from 'parse-duration'
import { getParam } from "./param";
import { QueryTypes } from "sequelize";
import { Filter, SlackChannel, SlackUser } from "./slack";
import { RenderableShare, Share } from "./share";
const { Sequelize, DataTypes } = require('sequelize');

export async function LinkSeed() {
  const l = await Link();
  await l.sync();
  l.bulkCreate([
    {
      link: 'https://docs.slackernews.io',
      title: 'Getting started with SlackerNews',
      domain: 'docs.slackernews.io',
      icon: '',
      icon_hash: '74d025f38d6ebd615c82354c1fe15d4156fc04db49a8789fcab65498406f0e22',
      is_shared_publicly: true,
      first_shared_at: new Date(),
      first_shared_by: 'SEED_USER_1',
      first_shared_in: 'SEED_CHANNEL_1',
      first_shared_message_ts: 'SEED_MESSAGE_TS_1',
    },
    {
      link: 'https://www.replicated.com',
      title: 'We help software vendors ship their apps to complex customer environments',
      domain: 'www.replicated.com',
      icon: '',
      icon_hash: '5786486f582af4144a5d0e0a1268eb32f38d99842131793a7bccc8c2a662647b',
      is_shared_publicly: true,
      first_shared_at: new Date(),
      first_shared_by: 'SEED_USER_1',
      first_shared_in: 'SEED_CHANNEL_1',
      first_shared_message_ts: 'SEED_MESSAGE_TS_1',
    },
    {
      link: 'https://www.enterpriseready.io',
      title: 'EnterpriseReady - Build SaaS Features Enterprises Love',
      domain: 'www.enterpriseready.io',
      icon: '',
      icon_hash: '1bbd350a64f9979cb886ecfb50fe8b92456b4ba473b12e96837056032fde7747',
      is_shared_publicly: true,
      first_shared_at: new Date(),
      first_shared_by: 'SEED_USER_1',
      first_shared_in: 'SEED_CHANNEL_1',
      first_shared_message_ts: 'SEED_MESSAGE_TS_1',
    },
  ]);
}

export async function Link() {
  const model = (await getSequelize()).define('link', {
    link: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    domain: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    icon_hash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_shared_publicly: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    first_shared_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    first_shared_by: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    first_shared_in: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    first_shared_message_ts: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_hidden: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_title_override: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  }, {
    tableName: 'link',
    timestamps: false,
  });

  return model;
}

// RenderableLink is a link, score, and info to render on the site
export interface RenderableLink {
  link: Link,
  firstShare: RenderableShare,
  displayScore: number,
  isUpvoted: boolean,
  replyCount: number,
}

export interface Link {
  url: string;
  domain: string;
  title: string;
  icon: string;
  isHidden: boolean;
}



export interface SlackUserGroup {
  id: string;
  name: string;
  description: string;
  userCount: number;
  isExcluded: boolean;
}

export interface Aggregate {
  link: Link;
  firstShare: Share;
  allShares: Share[];
  shareCount: number;
}


export async function setLinkHidden(link: string, isHidden: boolean): Promise<void> {
  console.log('setLinkHidden', link, isHidden);

  await (await Link()).update({
    is_hidden: isHidden,
  }, {
    where: {
      link,
    },
  });
}

export async function updateLinkTitle(link: string, title: string): Promise<boolean> {
  console.log('updateLinkTitle', link, title)

  await (await Link()).update({
    title,
    is_title_override: true,
  }, {
    where: {
      link,
    },
  });

  return true;
}

export interface CreateLinkOpts {
  url: string;
  domain: string;
  title: string;
  icon: string;
  isDM: boolean;
  isPrivate: boolean;
  isHidden: boolean;
  isPublicShared: boolean;
  firstSharedBy: string | null;
  firstSharedIn: string | null;
  firstSharedMessageTs: string | null;
}

export async function getOrCreateLink(opts: CreateLinkOpts): Promise<Link> {
  const existingLink = await (await Link()).findOne({
    where: {
      link: opts.url,
    },
  });

  if (existingLink) {
    return getLink(opts.url);
  }

  await (await Link()).upsert({
    link:opts.url,
    title: opts.title,
    domain: opts.domain,
    icon: opts.icon,
    icon_hash: "",
    is_shared_publicly: opts.isPublicShared,
    first_shared_at: new Date(),
    first_shared_by: opts.firstSharedBy,
    first_shared_in: opts.firstSharedIn,
    first_shared_message_ts: opts.firstSharedMessageTs,
    is_hidden: opts.isHidden,
    is_title_override: false,
  });

  return getLink(opts.url);
}

export async function getLink(url: string): Promise<Link> {
  console.log(`getLink(${url})`);

  const link = await (await Link()).findOne({
    where: {
      link: url,
    },
  });

  if (!link) {
    throw new Error(`No link found for ${url}`);
  }

  const renderableLink: Link = {
    url: link.link,
    domain: link.domain,
    title: link.title,
    icon: link.icon,
    isHidden: link.is_hidden,
  };

  return renderableLink;
}

export async function listUserLinks(id: string, pageNumber: number, viewingUserId: string): Promise<RenderableLink[] | undefined> {
  const sql = `select
link.link as url, link.domain, link.title, link.icon,
link.first_shared_in as channel_id, link.first_shared_by as user_id, link.first_shared_at, link.first_shared_message_ts as message_ts,
share.permalink,
favicon.icon as favicon,
slack_channel.name as channel_name,
slack_user.name, slack_user.real_name, slack_user.avatar_72, slack_user.email_address,
score.total_score,
upvote_score.upvote_score,
reply_count.reply_count
from link
left join (
  select sum(score) as total_score, link from score group by score.link
) as score on score.link = link.link
left join (
  select sum(score) as upvote_score, link from score where reason='upvote' and user_id = :viewingUserId group by score.link
) as upvote_score on upvote_score.link = link.link
left outer join favicon on favicon.hash = link.icon_hash
inner join slack_channel on slack_channel.id = link.first_shared_in
inner join slack_user on slack_user.id = link.first_shared_by
inner join share as share on (share.link = link.link and share.message_ts = link.first_shared_message_ts)
left join (
  select sum(reply_count) as reply_count, link from share group by link
) as reply_count on reply_count.link = share.link
where link.is_shared_publicly = true
and link.first_shared_by = :id
and link.is_hidden = false
order by total_score desc
limit 30 offset ${(pageNumber - 1) * 30}`;

  const rows = await (await getSequelize()).query(sql,
    {
      type: QueryTypes.SELECT,
      replacements: {
        id,
        viewingUserId: viewingUserId ? viewingUserId : "",
      },
    },
  );

  const renderableLinks = rows.map((row: any) => {
    const renderableLink: RenderableLink = {
      isUpvoted: !!row.upvote_score,
      replyCount: row.reply_count,
      link: {
        url: row.url,
        domain: row.domain,
        title: row.title,
        icon: row.favicon ? row.favicon : row.icon,
        isHidden: false,
      },
      firstShare: {
        sharedAt: new Date(row.first_shared_at).getTime(),
        messageTs: row.message_ts,
        userId: row.user_id,
        fullName: row.name,
        channelId: row.channel_id,
        channelName: row.channel_name,
        permalink: row.permalink,
        replyCount: row.reply_count,
      },
      displayScore: row.total_score,
    };

    return renderableLink;
  });

  return renderableLinks;
}

export async function listTopLinks(duration: string, pageNumber: number, userId: string, userIds: string[], includeHidden: boolean, query: string): Promise<RenderableLink[] | undefined> {
  try {
    // hack
    if (duration === "all") {
      duration = "100y";
    }

    const durationSec = parse(duration);
    if(durationSec === undefined || durationSec === null) {
      throw new Error("Invalid duration");
    }
    const latestTime = new Date();
    const earliestTime = new Date(latestTime.getTime() - durationSec);

    // get all _shares_ during this time window (this will include DMs and private channels,
    // we need this for scoring)
    let queryParams = {
      earliestTime,
      userId: userId || '',
      id: '',
    };

    const hiddenClause = includeHidden ? "" : " and link.is_hidden = false";

    let userIdClause = "";
    if (userIds.length > 0) {
      userIdClause += " and (";
      userIds.forEach((id, i) => {
        if (i > 0) {
          userIdClause += " or "
        }
        userIdClause += `user_id = $${3 + i}`;
      });
      userIdClause += ")";
    }

    const searchClause = query ? ` and (link.title ilike $${3 + userIds.length} or link.link ilike $${3 + userIds.length})` : "";

    const sql = `select
link.link as url, link.domain, link.title, link.icon,
link.first_shared_in as channel_id, link.first_shared_by as user_id, link.first_shared_at, link.first_shared_message_ts as message_ts, link.is_hidden,
share.permalink,
favicon.icon as favicon,
slack_channel.name as channel_name,
slack_user.name, slack_user.real_name, slack_user.avatar_72, slack_user.email_address,
display_score.display_score,
upvote_score.upvote_score,
reply_count.reply_count
from link
left join (
  select sum(score) as sort_score, link from score where time >= :earliestTime group by score.link
) as sort_score on sort_score.link = link.link
left join (
  select sum(score) as display_score, link from score group by score.link
) as display_score on display_score.link = link.link
left join (
  select sum(score) as upvote_score, link from score where time >= :earliestTime and reason='upvote' and user_id = :userId group by score.link
) as upvote_score on upvote_score.link = link.link
left outer join favicon on favicon.hash = link.icon_hash
inner join slack_channel on slack_channel.id = link.first_shared_in
inner join slack_user on slack_user.id = link.first_shared_by
inner join share as share on (share.link = link.link and share.message_ts = link.first_shared_message_ts)
left join (
  select sum(reply_count) as reply_count, link from share group by link
) as reply_count on reply_count.link = share.link
where link.is_shared_publicly = true
and sort_score.sort_score > 0
${userIdClause}
${hiddenClause}
${searchClause}
order by sort_score desc
limit 30 offset ${(pageNumber - 1) * 30}`;

    const rows = await (await getSequelize()).query(sql,
      {
        type: QueryTypes.SELECT,
        replacements: queryParams,
      },
    );

    const renderableLinks = rows.map((row: any) => {
      const renderableLink: RenderableLink = {
        isUpvoted: !!row.upvote_score,
        replyCount: row.reply_count,
        link: {
          url: row.url,
          domain: row.domain,
          title: row.title,
          icon: row.favicon ? row.favicon : row.icon,
          isHidden: row.is_hidden,
        },
        firstShare: {
          sharedAt: new Date(row.first_shared_at).getTime(),
          messageTs: row.message_ts,
          userId: row.user_id,
          fullName: row.name,
          channelId: row.channel_id,
          channelName: row.channel_name,
          permalink: row.permalink,
          replyCount: row.reply_count,
        },
        displayScore: row.display_score,
      };

      return renderableLink;
    });

    return renderableLinks;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function getTotalLinkCount(): Promise<number> {
  return await (await Link()).count();
}

export async function getUntitledLinkCount(): Promise<number> {
  return await (await Link()).count({
    where: Sequelize.literal('title = link')
  });
}

export async function Reply() {
  const model = (await getSequelize()).define('reply', {
    message_ts: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    parent_message_ts: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    channel_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    permalink: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  }, {
    tableName: 'reply',
    timestamps: false,
    indexes: [
      {
        fields: [
          "parent_message_ts",
          "channel_id",
        ],
      },
    ],
  });

  return model;
}

export async function replyExists(ts: string, channelId: string): Promise<boolean> {
  const count = await (await Reply()).count({
    where: {
      message_ts: ts,
      channel_id: channelId,
    },
  });

  return count > 0;
}

export async function listUserGroupsFromDB(): Promise<SlackUserGroup[]> {
  try {
    const query = `select usergroup_id, usergroup_name, is_excluded from slackernews_filter`;
    const rows = await (await getSequelize()).query(query, { type: QueryTypes.SELECT });

    const usergroups = rows.map((row: any) => {
      const usergroup: SlackUserGroup = {
        id: row.usergroup_id,
        name: row.usergroup_name,
        description: "",
        userCount: 0,
        isExcluded: row.is_excluded,
      };
      return usergroup;
    });
    return usergroups;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function updateUserGroup(id: string, name: string, isExcluded: boolean): Promise<void> {
  const count = await (await Filter()).count({
    where: {
      usergroup_id: id,
    },
  });

  if (count > 0) {
    await (await Filter()).update({
      is_excluded: isExcluded,
    }, {
      where: {
        usergroup_id: id,
      },
    });
  } else {
    await (await Filter()).create({
      usergroup_id: id,
      usergroup_name: name,
      is_excluded: isExcluded,
    });
  }
}
