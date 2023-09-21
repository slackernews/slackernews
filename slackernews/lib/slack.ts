import { SlackUserGroup, listUserGroupsFromDB } from "./link";
import { getParam } from "./param";

import { getSequelize } from "./db";

const { Sequelize, DataTypes } = require('sequelize');


export interface SlackChannel {
  id: string;
  name: string;
  isDm: boolean;
  isPrivate: boolean;
  isHidden: boolean;
}

export async function SlackChannelSeed() {
  const s = await SlackChannel();
  await s.sync();

  const channels: any = {
    "SEED_CHANNEL_1": {
      id: 'SEED_CHANNEL_1',
      name: "general",
      is_dm: false,
      is_private: false,
      is_shared: false,
      is_hidden: false,
    },
    "SEED_CHANNEL_2": {
      id: 'SEED_CHANNEL_2',
      name: "product",
      is_dm: false,
      is_private: false,
      is_shared: false,
      is_hidden: false,
    },
    "SEED_CHANNEL_3": {
      id: 'SEED_CHANNEL_3',
      name: "sales",
      is_dm: false,
      is_private: false,
      is_shared: false,
      is_hidden: false,
    },
  }

  const seeds: any[] = [];
  for (const key in channels) {
    const existing = await s.findOne({
      where: {
        id: key,
      },
    });

    if (!existing) {
      seeds.push(channels[key]);
    }
  }

  s.bulkCreate(seeds);
}

export async function SlackChannel() {
  const model = (await getSequelize()).define('slack_channel', {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_dm: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    is_private: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    is_shared: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    is_hidden: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      default: false,
    },
  }, {
    tableName: 'slack_channel',
    timestamps: false,
  });

  return model;
}

export interface SlackUser {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string;
  email: string;
}


export async function SlackUserSeed() {
  const s = await SlackUser();
  await s.sync();

  const users: any = {
    "SEED_USER_1": {
      id: "SEED_USER_1",
      name: "SlackerNews",
      real_name: "SlackerNews",
      email_address: "getting-started@slackernews.io",
      avatar_72: "",
    },
  }

  const seeds: any[] = [];
  for (const key in users) {
    const existing = await s.findOne({
      where: {
        id: key,
      },
    });

    if (!existing) {
      seeds.push(users[key]);
    }
  }

  s.bulkCreate(seeds);
}

export async function SlackUser() {
  const model = (await getSequelize()).define('slack_user', {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    real_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email_address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    avatar_72: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  }, {
    tableName: 'slack_user',
    timestamps: false,
  });

  return model;
}

export async function Filter() {
  const model = (await getSequelize()).define('slackernews_filter', {
    usergroup_id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    usergroup_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_excluded: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      default: false,
    },
  }, {
    tableName: 'slackernews_filter',
    timestamps: false,
  });

  return model;
}

export async function getOrCreateSlackUser(id: string, email: string, name: string, realName: string, avatarUrl: string): Promise<SlackUser> {
  const slackUser = await (await SlackUser()).findOne({
    where: {
      id: id,
    },
  });

  if (!slackUser) {
    await (await SlackUser()).upsert({
      id: id,
      name: name,
      real_name: realName,
      email_address: email,
      avatar_72: avatarUrl,
    });
  }

  const user: SlackUser = {
    id: id,
    username: name,
    fullName: realName,
    email: email,
    avatarUrl: avatarUrl,
  };

  return user;
}

export async function getSlackUser(id: string): Promise<SlackUser|undefined> {
  const slackUser = await (await SlackUser()).findOne({
    where: {
      id: id,
    },
  });

  if (!slackUser) {
    return undefined;
  }

  const user: SlackUser = {
    id: slackUser.id,
    username: slackUser.name,
    fullName: slackUser.real_name,
    email: slackUser.email_address,
    avatarUrl: slackUser.avatar_72,
  };

  return user;
}

export interface CreateSlackChannelOpts {
  id: string;
  name: string;
  is_dm: boolean;
  is_private: boolean;
  is_shared: boolean;
  is_hidden: boolean;
}

export async function createSlackChannel(opts: CreateSlackChannelOpts): Promise<SlackChannel> {
  await( await SlackChannel()).upsert({
    id: opts.id,
    name: opts.name,
    is_dm: opts.is_dm,
    is_private: opts.is_private,
    is_shared: opts.is_shared,
    is_hidden: opts.is_hidden,
  });

  const ch = await getSlackChannel(opts.id);
  return ch!;
}

export async function getSlackChannel(id: string): Promise<SlackChannel|undefined> {
  const slackChannel = await (await SlackChannel()).findOne({
    where: {
      id: id,
    },
  });

  if (!slackChannel) {
    return undefined;
  }

  const channel: SlackChannel = {
    id: slackChannel.id,
    name: slackChannel.name,
    isDm: slackChannel.is_dm,
    isPrivate: slackChannel.is_private,
    isHidden: slackChannel.is_hidden,
  };

  return channel;
}

export async function validateSlackConfig(botToken: string, userToken: string, clientId: string, clientSecret: string, teamId: string): Promise<boolean> {
  let isValid = true;

  if (!botToken || !userToken || !clientId || !clientSecret) {
    isValid = false;
  }

  if (!botToken.startsWith("xoxb-")) {
    isValid = false;
  }

  if (!userToken.startsWith("xoxp-")) {
    isValid = false;
  }

  // we don't validate the team id right now

  return isValid;
}

export function slackTSToDate(ts: string): Date {
  const parsed = parseFloat(ts) * 1000;
  return new Date(parsed);
}

export async function getConversationReplies(ts: string, channelId: string): Promise<any> {
  try {
    const res = await fetch(`https://slack.com/api/conversations.replies?ts=${ts}&channel=${channelId}`, {
      headers: {
        Authorization: `Bearer ${await getParam("SlackUserToken")}`,
        "Content-Type": `application/json`,
      },
    });

    const data = await res.json();
    return data.messages;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function ensureAdminNotificationChannel(): Promise<SlackChannel> {
  try {
    const res = await fetch(`https://slack.com/api/conversations.list`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${await getParam("SlackBotToken")}`,
        "Content-Type": `application/json`,
      }
    });
    const data = await res.json();
    const adminNotificationChannel = data.channels.find((channel: SlackChannel) => channel.name === "slackernews-admin");
    if (adminNotificationChannel) {
      return {
        id: adminNotificationChannel.id,
        name: adminNotificationChannel.name,
        isPrivate: adminNotificationChannel.is_private,
        isDm: adminNotificationChannel.is_im,
        isHidden: adminNotificationChannel.is_private,
      };
    };

    const res2 = await fetch(`https://slack.com/api/conversations.create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await getParam("SlackUserToken")}`,
        "Content-Type": `application/json`,
      },
      body: JSON.stringify({
        name: "slackernews-admin",
      }),
    });
    const data2 = await res2.json();
    return {
      id: data2.channel.id,
      name: data2.channel.name,
      isPrivate: data2.channel.is_private,
      isDm: data2.channel.is_im,
      isHidden: data2.channel.is_private,
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function listWorkspaceUsers(includeAccounts: boolean, includeGuests: boolean): Promise<SlackUser[]> {
  try {
    const res = await fetch(`https://slack.com/api/users.list`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${await getParam("SlackBotToken")}`,
        "Content-Type": `application/x-www-form-urlencoded`,
      },
    });
    const data = await res.json();

    const slackUsers: SlackUser[] = data.members.map((member: any) => {
      if (member.is_bot) {
        return null;
      }
      if (member.deleted) {
        return null;
      }
      if (member.is_app_user) {
        return null;
      }
      if (member.id === `USLACKBOT`) {
        return null;
      }

      if (!includeAccounts && !member.is_restricted) {
        return false;
      }
      if (!includeGuests && member.is_restricted) {
        return false;
      }

      return {
        id: member.id,
        name: member.name,
        email: member.profile.email,
        realName: member.profile.real_name,
        avatarUrl: member.profile.image_72,
      }
    });

    // remove the nulls
    return slackUsers.filter((user: SlackUser) => user !== null);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function listUserGroupsFromSlack(): Promise<SlackUserGroup[]> {
  // if there is no slack bot token, return an empty array to support
  // the demo mode
  if (!await getParam("SlackBotToken")) {
    return [];
  }

  try {
    const res = await fetch(`https://slack.com/api/usergroups.list`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${await getParam("SlackBotToken")}`,
        "Content-Type": `application/x-www-form-urlencoded`,
      },
    });
    const data = await res.json();
    const slackUserGroups: SlackUserGroup[] = data.usergroups.map((usergroup: any) => {
      if (usergroup.date_delete !== 0) {
        return null;
      }
      return {
        id: usergroup.id,
        name: usergroup.name,
        description: usergroup.description,
        userCount: usergroup.user_count,
        isExcluded: false,
      }
    });
    // remove the nulls
    return slackUserGroups.filter((usergroup: SlackUserGroup) => usergroup !== null);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function listAvailableUserGroups(): Promise<SlackUserGroup[]> {
  try {
    const userGroupsFromSlack = await listUserGroupsFromSlack();
    const userGroupsFromDB = await listUserGroupsFromDB();
    const filteredUserGroups = userGroupsFromSlack.filter(ug => {
      const userGroupsDB = userGroupsFromDB.find(ugDB => ugDB.id === ug.id);
      if (userGroupsDB !== undefined) {
        return !userGroupsDB.isExcluded;
      } else {
        return true;
      }
    });
    return filteredUserGroups;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function listUsersInUserGroup(userGroupId: string): Promise<string[]> {
  try {
    const res = await fetch(`https://slack.com/api/usergroups.users.list?usergroup=${userGroupId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${await getParam("SlackBotToken")}`,
        "Content-Type": `application/x-www-form-urlencoded`,
      },
    });
    const data = await res.json();
    if (data.ok === true) {
      return data.users;
    }
    return [];
  } catch (err) {
    console.error(err);
    throw err;
  }
}
