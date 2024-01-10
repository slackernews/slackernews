"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordChannelSeed = exports.DiscordUserSeed = exports.getOrCreateDiscordChannel = exports.getOrCreateDiscordUser = exports.DiscordChannel = exports.DiscordUser = void 0;
const db_1 = require("./db");
const { Sequelize, DataTypes } = require('sequelize');
function DiscordUser() {
    return __awaiter(this, void 0, void 0, function* () {
        const model = (yield (0, db_1.getSequelize)()).define('discord_user', {
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
    });
}
exports.DiscordUser = DiscordUser;
function DiscordChannel() {
    return __awaiter(this, void 0, void 0, function* () {
        const model = (yield (0, db_1.getSequelize)()).define('discord_channel', {
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
    });
}
exports.DiscordChannel = DiscordChannel;
function getOrCreateDiscordUser(username, id) {
    return __awaiter(this, void 0, void 0, function* () {
        const model = yield DiscordUser();
        const discordUser = yield model.findOne({ where: { id: id } });
        if (discordUser) {
            return discordUser;
        }
        else {
            return yield model.create({
                id: id,
                username: username,
            });
        }
    });
}
exports.getOrCreateDiscordUser = getOrCreateDiscordUser;
function getOrCreateDiscordChannel(name, id, private_) {
    return __awaiter(this, void 0, void 0, function* () {
        const model = yield DiscordChannel();
        const discordChannel = yield model.findOne({ where: { id: id } });
        if (discordChannel) {
            return discordChannel;
        }
        else {
            return yield model.create({
                id: id,
                name: name,
                private: private_,
            });
        }
    });
}
exports.getOrCreateDiscordChannel = getOrCreateDiscordChannel;
// Some functions to seed the database with some data
function DiscordUserSeed() {
    return __awaiter(this, void 0, void 0, function* () {
        const discordUser = yield DiscordUser();
        yield discordUser.sync();
        const users = {
            "DISCORD_SEED_USER_1": {
                id: "1928374650",
                username: "DISCORD_SEED_USER_1",
            },
        };
        const seeds = [];
        for (const key in users) {
            const existing = yield discordUser.findOne({
                where: {
                    id: key,
                },
            });
            if (!existing) {
                seeds.push(users[key]);
            }
        }
        discordUser.bulkCreate(seeds);
    });
}
exports.DiscordUserSeed = DiscordUserSeed;
function DiscordChannelSeed() {
    return __awaiter(this, void 0, void 0, function* () {
        const model = yield DiscordChannel();
        yield model.sync();
        const channels = {
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
        };
        const seeds = [];
        for (const key in channels) {
            const existing = yield model.findOne({
                where: {
                    id: key,
                },
            });
            if (!existing) {
                seeds.push(channels[key]);
            }
        }
        yield model.bulkCreate(seeds);
    });
}
exports.DiscordChannelSeed = DiscordChannelSeed;
