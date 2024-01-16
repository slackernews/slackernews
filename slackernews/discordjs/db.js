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
exports.getSequelize = exports.initDb = void 0;
const link_1 = require("./link");
const share_1 = require("./share");
const param_1 = require("./param");
const score_1 = require("./score");
const discord_1 = require("./discord");
const user_1 = require("./user");
const { Sequelize } = require('sequelize');
const sqlite3 = require('sqlite3');
let sequelize;
function initDb(dbUri) {
    return __awaiter(this, void 0, void 0, function* () {
        let options = {
            logging: console.log,
            dialect: 'sqlite',
            storage: dbUri,
        };
        console.log(`initDb() called with dbUri: ${dbUri}`);
        sequelize = new Sequelize(options); // Pass the options object only
        console.log(`Sequelize initialized with SQLite.`);
        try {
            yield sequelize.authenticate();
            console.log('Connection has been established successfully.');
        }
        catch (error) {
            console.error(`Unable to connect to the database: ${error}`);
        }
        // initialize the models
        (yield (0, param_1.SlackerNewsConfig)()).sync();
        (yield (0, link_1.Link)()).sync();
        (yield (0, share_1.Share)()).sync();
        (yield (0, score_1.Score)()).sync();
        (yield (0, user_1.User)()).sync();
        (yield (0, param_1.AdminNotification)()).sync();
        (yield (0, discord_1.DiscordChannel)()).sync();
        (yield (0, discord_1.DiscordUser)()).sync();
        yield (0, param_1.DefaultAdminNotifications)();
    });
}
exports.initDb = initDb;
function getSequelize() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`getSequelize() called.`);
        if (!sequelize) {
            console.log(`getSequelize() sequelize not initialized, calling initDb()`);
            yield (0, param_1.loadParams)();
        }
        console.log(`getSequelize() returning sequelize with uri: ${sequelize.options.storage}`);
        return sequelize;
    });
}
exports.getSequelize = getSequelize;
