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
exports.getShare = exports.createShare = exports.Share = exports.ShareSeed = void 0;
const db_1 = require("./db");
const { Sequelize, DataTypes } = require('sequelize');
function ShareSeed() {
    return __awaiter(this, void 0, void 0, function* () {
        const s = yield Share();
        yield s.sync();
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
    });
}
exports.ShareSeed = ShareSeed;
function Share() {
    return __awaiter(this, void 0, void 0, function* () {
        const model = (yield (0, db_1.getSequelize)()).define('share', {
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
    });
}
exports.Share = Share;
function createShare(url, permalink, sharedBy, sharedIn, messageTs, sharedAt) {
    return __awaiter(this, void 0, void 0, function* () {
        const share = yield Share();
        yield share.upsert({
            time: sharedAt,
            channel_id: sharedIn,
            message_ts: messageTs,
            link: url,
            user_id: sharedBy,
            permalink,
            reply_count: 0,
        });
        const shareObject = yield getShare(sharedIn, messageTs);
        return shareObject;
    });
}
exports.createShare = createShare;
function getShare(channelId, messageTs) {
    return __awaiter(this, void 0, void 0, function* () {
        const share = yield (yield Share()).findOne({
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
    });
}
exports.getShare = getShare;
