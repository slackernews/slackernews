import { getSequelize, initDb } from "./db";
const { QueryTypes } = require('sequelize');


interface Params {
  isLoaded: boolean;
  DBUri: string;

  isSlackLoadedFromEnv?: boolean;
  SlackBotToken?: string;
  SlackUserToken?: string;
  SlackClientId?: string;
  SlackClientSecret?: string;
  SlackTeamId?: string;
  SlackDomain?: string;
};

let params: Params = {
  isLoaded: false,
  isSlackLoadedFromEnv: false,
  DBUri: process.env["DB_URI"]!,
};

const { Sequelize, DataTypes } = require('sequelize');

export async function DefaultAdminNotifications() {
  const a = await AdminNotification();

  const adminNotifications: any = {
    "new-user-signup": {
      key: "new-user-signup",
      description: "New user signs up",
      is_enabled_default: 1,
    },
    "rolling-dau": {
      key: "rolling-dau",
      description: "Rolling DAU",
      is_enabled_default: 1,
    },
    "votes-counted-today": {
      key: "votes-counted-today",
      description: "Votes counted today",
      is_enabled_default: 1,
    },
    "rolling-mau": {
      key: "rolling-mau",
      description: "Rolling MAU",
      is_enabled_default: 1,
    },
    "rolling-monthly-vote-count": {
      key: "rolling-monthly-vote-count",
      description: "Rolling monthly vote count",
      is_enabled_default: 1,
    },
    "top-link-of-the-day": {
      key: "top-link-of-the-day",
      description: "Top link of the day",
      is_enabled_default: 1,
    },
    "clicks-to-content-today": {
      key: "clicks-to-content-today",
      description: "Clicks to content today",
      is_enabled_default: 1,
    },
    "num-untitled-contributions": {
      key: "num-untitled-contributions",
      description: "Number of untitled contributions",
      is_enabled_default: 1,
    },
    "admin-permission-granted": {
      key: "admin-permission-granted",
      description: "Admin permission granted",
      is_enabled_default: 1,
    },
  }

  const seeds: any[] = [];
  for (const key in adminNotifications) {
    const existing = await a.findOne({
      where: {
        key: key,
      },
    });
    if (!existing) {
      seeds.push(adminNotifications[key]);
    }
  }

  a.bulkCreate(seeds);
}

export async function AdminNotification() {
  const model = (await getSequelize()).define('admin_notification', {
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_enabled_default: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    is_enabled: {
      type: DataTypes.BOOLEAN,
    },
  }, {
    tableName: 'admin_notification',
    timestamps: false,
  });

  return model;
}

export async function SlackerNewsConfig() {
  const model = (await getSequelize()).define('config', {
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    val: {
      type: DataTypes.STRING
    },
  }, {
    tableName: 'slackernews_config',
    timestamps: false,
  });

  return model;
}

export async function loadParams() {
  // load slack params from db
  // the dbURI is always present
  await initDb(params.DBUri);

  const rows = await (await SlackerNewsConfig()).findAll();

  for (const row of rows) {
    switch (row.key) {
      case "slackBotToken":
        params.SlackBotToken = row.val;
        break;
      case "slackUserToken":
        params.SlackUserToken = row.val;
        break;
      case "slackClientID":
        params.SlackClientId = row.val;
        break;
      case "slackClientSecret":
        params.SlackClientSecret = row.val;
        break;
    }
  }

  // merge slack params from env
  if (process.env["SLACKERNEWS_SLACK_BOT_TOKEN"]) {
    params.SlackBotToken = process.env["SLACKERNEWS_SLACK_BOT_TOKEN"];
    params.isSlackLoadedFromEnv = true;
  }
  if (process.env["SLACKERNEWS_SLACK_USER_TOKEN"]) {
    params.SlackUserToken = process.env["SLACKERNEWS_SLACK_USER_TOKEN"];
    params.isSlackLoadedFromEnv = true;
  }
  if (process.env["SLACKERNEWS_SLACK_AUTH_CLIENT_ID"]) {
    params.SlackClientId = process.env["SLACKERNEWS_SLACK_AUTH_CLIENT_ID"];
    params.isSlackLoadedFromEnv = true;
  }
  if (process.env["SLACKERNEWS_SLACK_AUTH_CLIENT_SECRET"]) {
    params.SlackClientSecret = process.env["SLACKERNEWS_SLACK_AUTH_CLIENT_SECRET"];
    params.isSlackLoadedFromEnv = true;
  }

  console.log("isSlackLoadedFromEnv: ", params.isSlackLoadedFromEnv);

  if (params.SlackClientId) {
    console.log("slackClientId: ", params.SlackClientId!.slice(0, 5));
  } else {
    console.log("slackClientId is not configured\n");
  }

  if (params.SlackClientSecret) {
    console.log("slackClientSecret: ", params.SlackClientSecret!.slice(0, 5));
  } else {
    console.log("slackClientSecret is not configured\n");
  }

  if (params.SlackUserToken) {
    console.log("slackUserToken: ", params.SlackUserToken!.slice(0, 5));
  } else {
    console.log("slackUserToken is not configured\n");
  }

  if (params.SlackBotToken) {
    console.log("slackBotToken: ", params.SlackBotToken!.slice(0, 5));
  } else {
    console.log("slackBotToken is not configured\n");
  }

  if (params.SlackBotToken) {
    // use the slack API to get the domain and team id
    const res = await fetch("https://slack.com/api/team.info", {
      headers: {
        "Authorization": `Bearer ${params.SlackBotToken}`,
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();

    if (!data.ok) {
      throw new Error(data.error);
    }

    params.SlackTeamId = data.team.id;
    params.SlackDomain = data.team.domain;
  }

  params.isLoaded = true;

}

function isSlackParam(key: string): boolean {
  switch (key) {
    case "SlackBotToken":
    case "SlackUserToken":
    case "SlackClientId":
    case "SlackClientSecret":
    case "SlackTeamId":
    case "SlackDomain":
      return true;
  }

  return false;
}

// return params, if empty will try to get
export async function getParam(key: string): Promise<any> {
  if (!params.isLoaded && isSlackParam(key)) {
    await loadParams();
  }

  switch (key) {
    case "DBUri":
      return params.DBUri;
    case "SlackBotToken":
      return params.SlackBotToken;
    case "SlackUserToken":
      return params.SlackUserToken;
    case "SlackClientId":
      return params.SlackClientId;
    case "SlackClientSecret":
      return params.SlackClientSecret;
    case "SlackTeamId":
      return params.SlackTeamId;
    case "SlackDomain":
      return params.SlackDomain;
    default:
      throw new Error(`unknown param ${key}`);
  }
}

export async function isSlackLoadedFromEnv(): Promise<boolean> {
  if (!params.isLoaded) {
    await loadParams();
  }
  return params.isSlackLoadedFromEnv!;
}

export async function updateSlackConfig(botToken: string, userToken: string, clientId: string, clientSecret: string, teamId: string): Promise<void> {
  const t = await (await getSequelize()).transaction();
  try {
    let query = `insert into slackernews_config (key, val) values (:key, :val) on conflict (key) do update set val = EXCLUDED.val`;

    const s = await getSequelize();

    await s.query(query, {
      replacements: {
        key: "slackBotToken",
        val: botToken,
      },
      transaction: t,
    });

    await s.query(query, {
      replacements: {
        key: "slackUserToken",
        val: userToken,
      },
      transaction: t,
    });

    await s.query(query, {
      replacements: {
        key: "slackClientID",
        val: clientId,
      },
      transaction: t,
    });

    await s.query(query, {
      replacements: {
        key: "slackClientSecret",
        val: clientSecret,
      },
      transaction: t,
    });

    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }

  await loadParams();  // reload
}

export interface ChromePluginConfig {
  enabled: boolean;
  token: string;
}

export async function getChromePluginConfig(): Promise<ChromePluginConfig> {
  const config = await (await SlackerNewsConfig()).findOne({
    where: {
      key: "chrome.plugin.enabled",
    },
  });

  if (!config) {
    return {
      enabled: false,
      token: "",
    }
  }

  const token = await (await SlackerNewsConfig()).findOne({
    where: {
      key: "chrome.plugin.token",
    },
  });

  if (!token) {
    return {
      enabled: false,
      token: "",
    }
  }

  return {
    enabled: config.val === "1",
    token: token.val,
  }
}

export async function getAdminNotificationSettings(): Promise<any> {
  const notifications = await (await AdminNotification()).findAll();

  return notifications.map((n: any) => {
    return {
      key: n.key,
      description: n.description,
      enabled: n.is_enabled === null ? !!n.is_enabled_default : !!n.is_enabled,
    }
  });
}

export async function updateAdminNotificationSetting(key: string, enabled: boolean): Promise<void> {
  await (await AdminNotification()).upsert({
    key: key,
    is_enabled: enabled,
  });
}
