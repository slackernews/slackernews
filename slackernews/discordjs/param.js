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
exports.updateAdminNotificationSetting = exports.getAdminNotificationSettings = exports.getChromePluginConfig = exports.updateSlackConfig = exports.isSlackLoadedFromEnv = exports.getParam = exports.loadParams = exports.SlackerNewsConfig = exports.AdminNotification = exports.DefaultAdminNotifications = void 0;
const db_1 = require("./db");
const { QueryTypes } = require('sequelize');
;
let params = {
    isLoaded: false,
    isSlackLoadedFromEnv: false,
    DBUri: process.env["DB_URI"],
};
const { Sequelize, DataTypes } = require('sequelize');
function DefaultAdminNotifications() {
    return __awaiter(this, void 0, void 0, function* () {
        const a = yield AdminNotification();
        const adminNotifications = {
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
        };
        const seeds = [];
        for (const key in adminNotifications) {
            const existing = yield a.findOne({
                where: {
                    key: key,
                },
            });
            if (!existing) {
                seeds.push(adminNotifications[key]);
            }
        }
        a.bulkCreate(seeds);
    });
}
exports.DefaultAdminNotifications = DefaultAdminNotifications;
function AdminNotification() {
    return __awaiter(this, void 0, void 0, function* () {
        const model = (yield (0, db_1.getSequelize)()).define('admin_notification', {
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
    });
}
exports.AdminNotification = AdminNotification;
function SlackerNewsConfig() {
    return __awaiter(this, void 0, void 0, function* () {
        const model = (yield (0, db_1.getSequelize)()).define('config', {
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
    });
}
exports.SlackerNewsConfig = SlackerNewsConfig;
function loadParams() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("loadParams() called");
        // Sets params 
        params.DBUri = process.env["DB_URI"];
        // load slack params from db
        // the dbURI is always present
        yield (0, db_1.initDb)(params.DBUri);
        console.log("db initialized with uri: ", params.DBUri);
        const rows = yield (yield SlackerNewsConfig()).findAll();
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
            console.log("slackClientId: ", params.SlackClientId.slice(0, 5));
        }
        else {
            console.log("slackClientId is not configured\n");
        }
        if (params.SlackClientSecret) {
            console.log("slackClientSecret: ", params.SlackClientSecret.slice(0, 5));
        }
        else {
            console.log("slackClientSecret is not configured\n");
        }
        if (params.SlackUserToken) {
            console.log("slackUserToken: ", params.SlackUserToken.slice(0, 5));
        }
        else {
            console.log("slackUserToken is not configured\n");
        }
        if (params.SlackBotToken) {
            console.log("slackBotToken: ", params.SlackBotToken.slice(0, 5));
        }
        else {
            console.log("slackBotToken is not configured\n");
        }
        if (params.SlackBotToken) {
            // use the slack API to get the domain and team id
            const res = yield fetch("https://slack.com/api/team.info", {
                headers: {
                    "Authorization": `Bearer ${params.SlackBotToken}`,
                    "Content-Type": "application/json",
                },
            });
            const data = yield res.json();
            if (!data.ok) {
                throw new Error(data.error);
            }
            params.SlackTeamId = data.team.id;
            params.SlackDomain = data.team.domain;
        }
        params.isLoaded = true;
    });
}
exports.loadParams = loadParams;
function isSlackParam(key) {
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
function getParam(key) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!params.isLoaded && isSlackParam(key)) {
            yield loadParams();
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
    });
}
exports.getParam = getParam;
function isSlackLoadedFromEnv() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!params.isLoaded) {
            yield loadParams();
        }
        return params.isSlackLoadedFromEnv;
    });
}
exports.isSlackLoadedFromEnv = isSlackLoadedFromEnv;
function updateSlackConfig(botToken, userToken, clientId, clientSecret, teamId) {
    return __awaiter(this, void 0, void 0, function* () {
        const t = yield (yield (0, db_1.getSequelize)()).transaction();
        try {
            let query = `insert into slackernews_config (key, val) values (:key, :val) on conflict (key) do update set val = EXCLUDED.val`;
            const s = yield (0, db_1.getSequelize)();
            yield s.query(query, {
                replacements: {
                    key: "slackBotToken",
                    val: botToken,
                },
                transaction: t,
            });
            yield s.query(query, {
                replacements: {
                    key: "slackUserToken",
                    val: userToken,
                },
                transaction: t,
            });
            yield s.query(query, {
                replacements: {
                    key: "slackClientID",
                    val: clientId,
                },
                transaction: t,
            });
            yield s.query(query, {
                replacements: {
                    key: "slackClientSecret",
                    val: clientSecret,
                },
                transaction: t,
            });
            yield t.commit();
        }
        catch (err) {
            yield t.rollback();
            throw err;
        }
        yield loadParams(); // reload
    });
}
exports.updateSlackConfig = updateSlackConfig;
function getChromePluginConfig() {
    return __awaiter(this, void 0, void 0, function* () {
        const config = yield (yield SlackerNewsConfig()).findOne({
            where: {
                key: "chrome.plugin.enabled",
            },
        });
        if (!config) {
            return {
                enabled: false,
                token: "",
            };
        }
        const token = yield (yield SlackerNewsConfig()).findOne({
            where: {
                key: "chrome.plugin.token",
            },
        });
        if (!token) {
            return {
                enabled: false,
                token: "",
            };
        }
        return {
            enabled: config.val === "1",
            token: token.val,
        };
    });
}
exports.getChromePluginConfig = getChromePluginConfig;
function getAdminNotificationSettings() {
    return __awaiter(this, void 0, void 0, function* () {
        const notifications = yield (yield AdminNotification()).findAll();
        return notifications.map((n) => {
            return {
                key: n.key,
                description: n.description,
                enabled: n.is_enabled === null ? !!n.is_enabled_default : !!n.is_enabled,
            };
        });
    });
}
exports.getAdminNotificationSettings = getAdminNotificationSettings;
function updateAdminNotificationSetting(key, enabled) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (yield AdminNotification()).upsert({
            key: key,
            is_enabled: enabled,
        });
    });
}
exports.updateAdminNotificationSetting = updateAdminNotificationSetting;
