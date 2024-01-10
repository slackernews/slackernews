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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUntitledLinkCount = exports.getTotalLinkCount = exports.listTopLinks = exports.listUserLinks = exports.getLink = exports.getOrCreateLink = exports.updateLinkTitle = exports.setLinkHidden = exports.Link = void 0;
const db_1 = require("./db");
const parse_duration_1 = __importDefault(require("parse-duration"));
const sequelize_1 = require("sequelize");
const { Sequelize, DataTypes } = require('sequelize');
function Link() {
    return __awaiter(this, void 0, void 0, function* () {
        const model = (yield (0, db_1.getSequelize)()).define('link', {
            link: {
                type: DataTypes.STRING,
                allowNull: false,
                primaryKey: true,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            domain: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            icon: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            icon_hash: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            is_shared_publicly: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
            },
            first_shared_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            first_shared_by: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            first_shared_in: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            first_shared_message_ts: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            is_hidden: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            is_title_override: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
        }, {
            tableName: 'link',
            timestamps: false,
        });
        return model;
    });
}
exports.Link = Link;
function setLinkHidden(link, isHidden) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('setLinkHidden', link, isHidden);
        yield (yield Link()).update({
            is_hidden: isHidden,
        }, {
            where: {
                link,
            },
        });
    });
}
exports.setLinkHidden = setLinkHidden;
function updateLinkTitle(link, title) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('updateLinkTitle', link, title);
        yield (yield Link()).update({
            title,
            is_title_override: true,
        }, {
            where: {
                link,
            },
        });
        return true;
    });
}
exports.updateLinkTitle = updateLinkTitle;
function getOrCreateLink(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        const existingLink = yield (yield Link()).findOne({
            where: {
                link: opts.url,
            },
        });
        if (existingLink) {
            return getLink(opts.url);
        }
        yield (yield Link()).upsert({
            link: opts.url,
            title: opts.title,
            domain: opts.domain,
            icon: opts.icon,
            icon_hash: "",
            is_shared_publicly: opts.isPublicShared,
            first_shared_at: new Date(),
            first_shared_by: opts.firstSharedBy,
            first_shared_in: opts.firstSharedIn,
            first_shared_message_ts: opts.firstSharedMessageTs,
            is_hidden: opts.isHidden,
            is_title_override: false,
        });
        return getLink(opts.url);
    });
}
exports.getOrCreateLink = getOrCreateLink;
function getLink(url) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`getLink(${url})`);
        const link = yield (yield Link()).findOne({
            where: {
                link: url,
            },
        });
        if (!link) {
            throw new Error(`No link found for ${url}`);
        }
        const renderableLink = {
            url: link.link,
            domain: link.domain,
            title: link.title,
            icon: link.icon,
            isHidden: link.is_hidden,
        };
        return renderableLink;
    });
}
exports.getLink = getLink;
function listUserLinks(id, pageNumber, viewingUserId) {
    return __awaiter(this, void 0, void 0, function* () {
        const sql = `select
link.link as url, link.domain, link.title, link.icon,
link.first_shared_in as channel_id, link.first_shared_by as user_id, link.first_shared_at, link.first_shared_message_ts as message_ts,
share.permalink,
favicon.icon as favicon,
slack_channel.name as channel_name,
slack_user.name, slack_user.real_name, slack_user.avatar_72, slack_user.email_address,
score.total_score,
upvote_score.upvote_score,
reply_count.reply_count
from link
left join (
  select sum(score) as total_score, link from score group by score.link
) as score on score.link = link.link
left join (
  select sum(score) as upvote_score, link from score where reason='upvote' and user_id = :viewingUserId group by score.link
) as upvote_score on upvote_score.link = link.link
left outer join favicon on favicon.hash = link.icon_hash
inner join slack_channel on slack_channel.id = link.first_shared_in
inner join slack_user on slack_user.id = link.first_shared_by
inner join share as share on (share.link = link.link and share.message_ts = link.first_shared_message_ts)
left join (
  select sum(reply_count) as reply_count, link from share group by link
) as reply_count on reply_count.link = share.link
where link.is_shared_publicly = true
and link.first_shared_by = :id
and link.is_hidden = false
order by total_score desc
limit 30 offset ${(pageNumber - 1) * 30}`;
        const rows = yield (yield (0, db_1.getSequelize)()).query(sql, {
            type: sequelize_1.QueryTypes.SELECT,
            replacements: {
                id,
                viewingUserId: viewingUserId ? viewingUserId : "",
            },
        });
        const renderableLinks = rows.map((row) => {
            const renderableLink = {
                isUpvoted: !!row.upvote_score,
                replyCount: row.reply_count,
                link: {
                    url: row.url,
                    domain: row.domain,
                    title: row.title,
                    icon: row.favicon ? row.favicon : row.icon,
                    isHidden: false,
                },
                firstShare: {
                    sharedAt: new Date(row.first_shared_at).getTime(),
                    messageTs: row.message_ts,
                    userId: row.user_id,
                    fullName: row.name,
                    channelId: row.channel_id,
                    channelName: row.channel_name,
                    permalink: row.permalink,
                    replyCount: row.reply_count,
                },
                displayScore: row.total_score,
            };
            return renderableLink;
        });
        return renderableLinks;
    });
}
exports.listUserLinks = listUserLinks;
function listTopLinks(duration, pageNumber, userId, userIds, includeHidden, query) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // hack
            if (duration === "all") {
                duration = "100y";
            }
            const durationSec = (0, parse_duration_1.default)(duration);
            if (durationSec === undefined) {
                throw new Error("Invalid duration");
            }
            const latestTime = new Date();
            const earliestTime = new Date(latestTime.getTime() - durationSec);
            // get all _shares_ during this time window (this will include DMs and private channels,
            // we need this for scoring)
            let queryParams = {
                earliestTime,
                userId: userId || '',
                id: '',
            };
            const hiddenClause = includeHidden ? "" : " and link.is_hidden = false";
            let userIdClause = "";
            if (userIds.length > 0) {
                userIdClause += " and (";
                userIds.forEach((id, i) => {
                    if (i > 0) {
                        userIdClause += " or ";
                    }
                    userIdClause += `user_id = $${3 + i}`;
                });
                userIdClause += ")";
            }
            const searchClause = query ? ` and (link.title ilike $${3 + userIds.length} or link.link ilike $${3 + userIds.length})` : "";
            const sql = `select
link.link as url, link.domain, link.title, link.icon,
link.first_shared_in as channel_id, link.first_shared_by as user_id, link.first_shared_at, link.first_shared_message_ts as message_ts, link.is_hidden,
share.permalink,
favicon.icon as favicon,
slack_channel.name as channel_name,
slack_user.name, slack_user.real_name, slack_user.avatar_72, slack_user.email_address,
display_score.display_score,
upvote_score.upvote_score,
reply_count.reply_count
from link
left join (
  select sum(score) as sort_score, link from score where time >= :earliestTime group by score.link
) as sort_score on sort_score.link = link.link
left join (
  select sum(score) as display_score, link from score group by score.link
) as display_score on display_score.link = link.link
left join (
  select sum(score) as upvote_score, link from score where time >= :earliestTime and reason='upvote' and user_id = :userId group by score.link
) as upvote_score on upvote_score.link = link.link
left outer join favicon on favicon.hash = link.icon_hash
inner join slack_channel on slack_channel.id = link.first_shared_in
inner join slack_user on slack_user.id = link.first_shared_by
inner join share as share on (share.link = link.link and share.message_ts = link.first_shared_message_ts)
left join (
  select sum(reply_count) as reply_count, link from share group by link
) as reply_count on reply_count.link = share.link
where link.is_shared_publicly = true
and sort_score.sort_score > 0
${userIdClause}
${hiddenClause}
${searchClause}
order by sort_score desc
limit 30 offset ${(pageNumber - 1) * 30}`;
            const rows = yield (yield (0, db_1.getSequelize)()).query(sql, {
                type: sequelize_1.QueryTypes.SELECT,
                replacements: queryParams,
            });
            const renderableLinks = rows.map((row) => {
                const renderableLink = {
                    isUpvoted: !!row.upvote_score,
                    replyCount: row.reply_count,
                    link: {
                        url: row.url,
                        domain: row.domain,
                        title: row.title,
                        icon: row.favicon ? row.favicon : row.icon,
                        isHidden: row.is_hidden,
                    },
                    firstShare: {
                        sharedAt: new Date(row.first_shared_at).getTime(),
                        messageTs: row.message_ts,
                        userId: row.user_id,
                        fullName: row.name,
                        channelId: row.channel_id,
                        channelName: row.channel_name,
                        permalink: row.permalink,
                        replyCount: row.reply_count,
                    },
                    displayScore: row.display_score,
                };
                return renderableLink;
            });
            return renderableLinks;
        }
        catch (err) {
            console.error(err);
            throw err;
        }
    });
}
exports.listTopLinks = listTopLinks;
function getTotalLinkCount() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield (yield Link()).count();
    });
}
exports.getTotalLinkCount = getTotalLinkCount;
function getUntitledLinkCount() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield (yield Link()).count({
            where: {
                title: Sequelize.col('link'),
            },
        });
    });
}
exports.getUntitledLinkCount = getUntitledLinkCount;
