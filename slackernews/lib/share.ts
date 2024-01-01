import {getSequelize } from "./db";
import { SlackChannel, SlackUser } from "./slack";
import { Link } from "./link";
const { Sequelize, DataTypes } = require('sequelize');


export async function ShareSeed() {
  const s = await Share();
  await s.sync();
  s.bulkCreate([
    {
      time: new Date(),
      channel_id: 'SEED_CHANNEL_1',
      message_ts: 'SEED_MESSAGE_TS_1',
      link: 'https://docs.slackernews.io',
      user_id: 'SEED_USER_1',
      permalink: '',
      reply_count: 0,
    },
    {
      time: new Date(),
      channel_id: 'SEED_CHANNEL_1',
      message_ts: 'SEED_MESSAGE_TS_1',
      link: 'https://www.replicated.com',
      user_id: 'SEED_USER_1',
      permalink: '',
      reply_count: 0,
    },
    {
      time: new Date(),
      channel_id: 'SEED_CHANNEL_1',
      message_ts: 'SEED_MESSAGE_TS_1',
      link: 'https://www.enterpriseready.io',
      user_id: 'SEED_USER_1',
      permalink: '',
      reply_count: 0,
    },
  ]);
}

export interface Share {
  sharedAt: number;
  messageTs: string;
  link: Link;
  sharedBy: string;
  sharedIn: string;
  permalink: string;
}

export async function Share() {
  const model = (await getSequelize()).define('share', {
    time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    channel_id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true
    },
    message_ts: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    link: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    permalink: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    reply_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      default: 0,
    },
  }, {
    tableName: 'share',
    timestamps: false,
    indexes: [
      {
        fields: [
          "time",
          "link",
        ],
      },
    ],
  });

  return model;
}

export interface RenderableShare {
  sharedAt: number;
  messageTs: string;
  userId: string;
  fullName: string;
  channelId: string;
  channelName: string;
  permalink: string;
  replyCount: number;
}

export async function listShares(url: string): Promise<RenderableShare[]> {
  const shares = await (await Share()).findAll({
    where: {
      link: url,
    },
    order: [
      ['time', 'DESC'],
    ],
    include: [
      {
        model: (await SlackChannel()),
        where: {
          id: Sequelize.col('share.channel_id'),
        },
      },
    ],
  });

  const renderableShares: RenderableShare[] = shares.map((share: any) => {
    return {
      sharedAt: share.time.getTime(),
      messageTs: share.message_ts,
      userId: share.user_id,
      fullName: share.full_name,
      channelId: share.channel_id,
      channelName: share.slack_channel.name,
      permalink: share.permalink,
      replyCount: share.reply_count,
    };
  });

  return renderableShares;
}



export async function createShare(url: string, permalink: string, sharedBy: string, sharedIn: string, messageTs: string, sharedAt: Date): Promise<Share> {
  await (await Share()).upsert({
    time: sharedAt,
    channel_id: sharedIn,
    message_ts: messageTs,
    link: url,
    user_id: sharedBy,
    permalink,
    reply_count: 0,
  });

  const share = await getShare(sharedIn, messageTs);
  return share!;
}

export async function getShare(channelId: string, messageTs: string): Promise<Share|undefined> {
  const share = await (await Share()).findOne({
    where: {
      channel_id: channelId,
      message_ts: messageTs,
    },
  });

  if (!share) {
    return undefined;
  }

  return {
    sharedAt: share.time.getTime(),
    messageTs: share.message_ts,
    link: share.link,
    sharedBy: share.user_id,
    sharedIn: share.channel_id,
    permalink: share.permalink,
  };
}
