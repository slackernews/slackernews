import { Link, LinkSeed, Reply } from "./link";
import { Share, ShareSeed } from "./share";
import { AdminNotification, DefaultAdminNotifications, SlackerNewsConfig, loadParams } from "./param";
import { Favicon, FaviconSeed } from "./favicon";
import { Score, ScoreSeed } from "./score";
import { SlackChannel, SlackChannelSeed, SlackUser, SlackUserSeed } from "./slack";
import { DiscordChannel, DiscordUser } from "./discord";

import { Filter } from "./filter";
import { User } from "./user";
import { Session } from "./session";
import { DefaultIntegrations, Integration } from "./integration";
import pg from 'pg';
const { Sequelize } = require('sequelize');
const sqlite3 = require('sqlite3');

let sequelize: any;
let ensureSeedData: boolean = true;

export async function initDb(dbUri: string) {
  let options: any = {
    logging: console.log,
    dialect: 'sqlite',
    storage: dbUri,
  };

  sequelize = new Sequelize(options); // Pass the options object only
  console.log(`Sequelize initialized with SQLite.`);
  
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error(`Unable to connect to the database: ${error}`);
  }

  // initialize the models
  (await SlackerNewsConfig()).sync();
  (await Link()).sync();
  (await Share()).sync();
  (await Favicon()).sync();
  (await Score()).sync();
  (await SlackChannel()).sync();
  (await SlackUser()).sync();
  (await Filter()).sync();
  (await User()).sync();
  (await Session()).sync();
  (await Integration()).sync();
  (await AdminNotification()).sync();
  (await Reply()).sync();
  (await Filter()).sync();
  (await DiscordChannel()).sync();
  (await DiscordUser()).sync();

  await DefaultIntegrations();
  await DefaultAdminNotifications();

  if (ensureSeedData) {
    await LinkSeed();
    await ShareSeed();
    await FaviconSeed();
    await ScoreSeed();
    await SlackUserSeed();
    await SlackChannelSeed();

  }
}

export async function getSequelize(): Promise<any> {
  if (!sequelize) {
    await loadParams();
  }

  return sequelize;
}
