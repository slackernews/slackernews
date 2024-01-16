import { getParam } from "./param";
import { getSequelize } from "./db";
const { Sequelize, DataTypes } = require('sequelize');

export interface DiscordChannel {
    id: string;
    name: string;
    private: boolean;
}

export interface DiscordUser {
    id: string;
    username: string;
    globalname: string;
}

export async function DiscordUser() {
    const model = (await getSequelize()).define('discord_user', {
        id: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, {
        tableName: 'discord_user',
        timestamps: false,
    });

    return model;
}

export async function DiscordChannel() {
    const model = (await getSequelize()).define('discord_channel', {
        id: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        private: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
    }, {
        tableName: 'discord_channel',
        timestamps: false,
    });
    return model;
}

export async function getOrCreateDiscordUser(username:string, id: string): Promise<DiscordUser> {
    const model = await DiscordUser();
    const discordUser = await model.findOne({where: {id: id}});
    if (discordUser) {
        return discordUser;
    } else {
        return await model.create({
            id: id,
            username: username,
        });
    }
}

export async function getOrCreateDiscordChannel(name:string, id: string, private_: boolean): Promise<DiscordChannel> {
    const model = await DiscordChannel();
    const discordChannel = await model.findOne({where: {id: id}});
    if (discordChannel) {
        return discordChannel;
    } else {
        return await model.create({
            id: id,
            name: name,
            private: private_,
        });
    }
}

// Some functions to seed the database with some data
export async function DiscordUserSeed() {
    const discordUser = await DiscordUser();
    await discordUser.sync();
  
    const users: any = {
      "DISCORD_SEED_USER_1": {
        id: "1928374650",
        username: "DISCORD_SEED_USER_1",
      },
    }
  
    const seeds: any[] = [];
    for (const key in users) {
      const existing = await discordUser.findOne({
        where: {
          id: key,
        },
      });
  
      if (!existing) {
        seeds.push(users[key]);
      }
    }
  
    discordUser.bulkCreate(seeds);
}

export async function DiscordChannelSeed() {
    const model = await DiscordChannel();
    await model.sync();

    const channels: any = {
        "DISCORD_SEED_CHANNEL_1": {
            id: "DISCORD_SEED_CHANNEL_1",
            name: "general",
            private: false,
        },
        "DISCORD_SEED_CHANNEL_2": {
            id: "DISCORD_SEED_CHANNEL_2",
            name: "random",
            private: false,
        },
        "DISCORD_SEED_CHANNEL_3": {
            id: "DISCORD_SEED_CHANNEL_3",
            name: "private",
            private: true,
        },
    }

    const seeds: any[] = [];
    for (const key in channels) {
      const existing = await model.findOne({
        where: {
          id: key,
        },
      });
  
      if (!existing) {
        seeds.push(channels[key]);
      }
    }

    await model.bulkCreate(seeds);
}