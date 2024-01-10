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
exports.getUser = exports.getOrCreateUser = exports.listUsers = exports.listMonthlyActiveUsers = exports.listDailyActiveUsers = exports.setUserAdmin = exports.getUserKarma = exports.User = void 0;
const db_1 = require("./db");
const { Sequelize, DataTypes } = require('sequelize');
const { Op } = require('sequelize');
function User() {
    return __awaiter(this, void 0, void 0, function* () {
        const model = (yield (0, db_1.getSequelize)()).define('user', {
            id: {
                type: DataTypes.STRING,
                allowNull: false,
                primaryKey: true,
            },
            email_address: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            avatar: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            last_login_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            last_active_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            is_super_admin: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                default: false,
            },
        }, {
            tableName: 'slackernews_user',
            timestamps: false,
        });
        return model;
    });
}
exports.User = User;
function getUserKarma(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const sql = `select sum(score) as karma from score
inner join link on score.link = link.link
where link.first_shared_by = :id and link.is_shared_publicly = true`;
        const replacements = {
            id,
        };
        const rows = yield (yield (0, db_1.getSequelize)()).query(sql, {
            replacements,
            type: Sequelize.QueryTypes.SELECT,
        });
        return rows[0].karma;
    });
}
exports.getUserKarma = getUserKarma;
function setUserAdmin(id, isSuperAdmin) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (yield User()).update({
            is_super_admin: isSuperAdmin,
        }, {
            where: {
                id,
            },
        });
        return true;
    });
}
exports.setUserAdmin = setUserAdmin;
function listDailyActiveUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        const users = yield (yield User()).findAll({
            where: {
                last_active_at: {
                    [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000),
                },
            },
        });
        return users.map((user) => {
            return {
                id: user.id,
                email: user.email_address,
                name: user.name,
                avatarUrl: user.avatar,
                createdAt: user.created_at.getTime(),
                lastLoginAt: user.last_login_at.getTime(),
                lastActiveAt: user.last_active_at.getTime(),
                isSuperAdmin: user.is_super_admin,
            };
        });
    });
}
exports.listDailyActiveUsers = listDailyActiveUsers;
function listMonthlyActiveUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        const users = yield (yield User()).findAll({
            where: {
                last_active_at: {
                    [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                },
            },
        });
        return users.map((user) => {
            return {
                id: user.id,
                email: user.email_address,
                name: user.name,
                avatarUrl: user.avatar,
                createdAt: user.created_at.getTime(),
                lastLoginAt: user.last_login_at.getTime(),
                lastActiveAt: user.last_active_at.getTime(),
                isSuperAdmin: user.is_super_admin,
            };
        });
    });
}
exports.listMonthlyActiveUsers = listMonthlyActiveUsers;
function listUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        const users = yield (yield User()).findAll();
        return users.map((user) => {
            return {
                id: user.id,
                email: user.email_address,
                name: user.name,
                avatarUrl: user.avatar,
                createdAt: user.created_at.getTime(),
                lastLoginAt: user.last_login_at.getTime(),
                lastActiveAt: user.last_active_at.getTime(),
                isSuperAdmin: user.is_super_admin,
            };
        });
    });
}
exports.listUsers = listUsers;
function getOrCreateUser(slackUserId, slackEmailAddress, slackName, slackAvatar) {
    return __awaiter(this, void 0, void 0, function* () {
        const existingUser = yield (yield User()).findOne({
            where: {
                email_address: slackEmailAddress,
            },
        });
        if (existingUser) {
            return getUser(slackUserId);
        }
        const createdAt = new Date();
        const lastLoginAt = new Date();
        const lastActiveAt = new Date();
        yield (yield User()).create({
            id: slackUserId,
            email_address: slackEmailAddress,
            name: slackName,
            avatar: slackAvatar,
            created_at: createdAt,
            last_login_at: lastLoginAt,
            last_active_at: lastActiveAt,
            is_super_admin: false,
        });
        return getUser(slackUserId);
    });
}
exports.getOrCreateUser = getOrCreateUser;
function getUser(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log(`finding user ${id}`);
            const user = yield (yield User()).findOne({
                where: {
                    id,
                },
            });
            const u = {
                id: user.id,
                email: user.email_address,
                name: user.name,
                avatarUrl: user.avatar,
                createdAt: user.created_at.getTime(),
                lastLoginAt: user.last_login_at.getTime(),
                lastActiveAt: user.last_active_at.getTime(),
                isSuperAdmin: user.is_super_admin,
            };
            return u;
        }
        catch (err) {
            console.error(`error in getUser for id: ${id}, err: ${err}`);
            throw err;
        }
    });
}
exports.getUser = getUser;
