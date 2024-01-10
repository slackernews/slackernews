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
exports.getTotalScoreCount = exports.getUserVoteOnLink = exports.addUserVoteOnLink = exports.addLinkBoost = exports.scoreShare = exports.scoreReactionRemove = exports.scoreReactionAdd = exports.Score = exports.ScoreSeed = void 0;
const db_1 = require("./db");
const { Sequelize, DataTypes } = require('sequelize');
function ScoreSeed() {
    return __awaiter(this, void 0, void 0, function* () {
        // primary key on score includes the time,
        // so we can't rely on the PK to deduplicate seeds
        // instead, for seeds, we only add if the link doesn't
        // already have a score
        const s = yield Score();
        yield s.sync();
        const urls = [
            'https://docs.slackernews.io',
            'https://www.replicated.com',
            'https://www.enterpriseready.io',
        ];
        const seedScores = {
            'https://docs.slackernews.io': 1,
            'https://www.replicated.com': 2,
            'https://www.enterpriseready.io': 3,
        };
        const seeds = [];
        for (const url of urls) {
            const existing = yield s.findOne({
                where: {
                    link: url,
                },
            });
            if (!existing) {
                seeds.push({
                    time: new Date(),
                    link: url,
                    score: seedScores[url],
                    reason: 'SEED',
                });
            }
        }
        s.bulkCreate(seeds);
    });
}
exports.ScoreSeed = ScoreSeed;
function Score() {
    return __awaiter(this, void 0, void 0, function* () {
        const model = (yield (0, db_1.getSequelize)()).define('score', {
            time: {
                type: DataTypes.DATE,
                allowNull: false,
                primaryKey: true,
            },
            link: {
                type: DataTypes.STRING,
                allowNull: false,
                primaryKey: true,
            },
            score: {
                type: DataTypes.DECIMAL,
                allowNull: false,
            },
            reason: {
                type: DataTypes.STRING,
                allowNull: false,
                primaryKey: true,
            },
            user_id: {
                type: DataTypes.STRING,
            }
        }, {
            tableName: 'score',
            timestamps: false,
        });
        return model;
    });
}
exports.Score = Score;
function scoreReactionAdd(url, at) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('scoreReaction', url, at);
        const s = yield Score();
        const score = yield s.findOne({
            where: {
                time: at,
                link: url,
                reason: 'reaction',
            },
        });
        console.log('score', score);
        if (score) {
            score.score += 0.5;
            yield score.save();
        }
        else {
            yield s.create({
                time: at,
                link: url,
                score: 0.5,
                reason: 'reaction',
            });
        }
    });
}
exports.scoreReactionAdd = scoreReactionAdd;
function scoreReactionRemove(url, at) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('scoreReaction', url, at);
        const s = yield Score();
        const score = yield s.findOne({
            where: {
                time: at,
                link: url,
                reason: 'reaction',
            },
        });
        if (score) {
            score.score -= 0.5;
            yield score.save();
        }
    });
}
exports.scoreReactionRemove = scoreReactionRemove;
function scoreShare(url, at) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('scoreShare', url, at);
        yield (yield Score()).upsert({
            time: at,
            link: url,
            score: 1,
            reason: 'share',
        });
    });
}
exports.scoreShare = scoreShare;
function addLinkBoost(url) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('addLinkBoost', url);
        yield (yield Score()).upsert({
            time: new Date(),
            link: url,
            score: 1,
            reason: 'boost',
        });
    });
}
exports.addLinkBoost = addLinkBoost;
function addUserVoteOnLink(userId, url) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('addUserVoteOnLink', userId, url);
        yield (yield Score()).upsert({
            time: new Date(),
            link: url,
            score: 1,
            reason: 'upvote',
            user_id: userId,
        });
    });
}
exports.addUserVoteOnLink = addUserVoteOnLink;
function getUserVoteOnLink(userId, url) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('getUserVoteOnLink', userId, url);
        const s = yield Score();
        const score = yield s.findOne({
            where: {
                link: url,
                user_id: userId,
                reason: 'upvote',
            },
        });
        if (!score) {
            return 0;
        }
        return score.score;
    });
}
exports.getUserVoteOnLink = getUserVoteOnLink;
function getTotalScoreCount() {
    return __awaiter(this, void 0, void 0, function* () {
        const s = yield Score();
        const score = yield s.sum('score');
        return score;
    });
}
exports.getTotalScoreCount = getTotalScoreCount;
