import { getSequelize } from "./db";
import { sendMetrics } from "./metrics/metric";
const { Sequelize, DataTypes } = require('sequelize');
const { Op } = require('sequelize');

export async function User() {
  const model = (await getSequelize()).define('user', {
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
}


export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  createdAt: number;
  lastLoginAt: number;
  lastActiveAt: number;
  isSuperAdmin: boolean;
}

export async function getUserKarma(id: string): Promise<number> {
  const sql = `select sum(score) as karma from score
inner join link on score.link = link.link
where link.first_shared_by = :id and link.is_shared_publicly = true`;

  const replacements = {
    id,
  };

  const rows = await (await getSequelize()).query(sql, {
    replacements,
    type: Sequelize.QueryTypes.SELECT,
  });

  return rows[0].karma;
}

export async function setUserAdmin(id: string, isSuperAdmin: boolean): Promise<boolean> {
  await (await User()).update({
    is_super_admin: isSuperAdmin,
  }, {
    where: {
      id,
    },
  });

  return true;
}

export async function listDailyActiveUsers(): Promise<User[]> {
  const users = await (await User()).findAll({
    where: {
      last_active_at: {
        [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  });

  return users.map((user: any) => {
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
}

export async function listMonthlyActiveUsers(): Promise<User[]> {
  const users = await (await User()).findAll({
    where: {
      last_active_at: {
        [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
  });

  return users.map((user: any) => {
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
}

export async function listUsers(): Promise<User[]> {
  const users = await (await User()).findAll();

  return users.map((user: any) => {
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
}

export async function getOrCreateUser(slackUserId: string, slackEmailAddress: string, slackName: string, slackAvatar: string): Promise<User> {
  const existingUser = await (await User()).findOne({
    where: {
      email_address: slackEmailAddress,
    },
  });

  if (existingUser) {
    return getUser(slackUserId);
  }

  const hardCodedSuperAdmins = (process.env.ADMIN_USER_EMAILS || "").split(",");
  const isSuperAdmin = hardCodedSuperAdmins.indexOf(slackEmailAddress) !== -1;

  const createdAt = new Date();
  const lastLoginAt = new Date();
  const lastActiveAt = new Date();

  await (await User()).create({
    id: slackUserId,
    email_address: slackEmailAddress,
    name: slackName,
    avatar: slackAvatar,
    created_at: createdAt,
    last_login_at: lastLoginAt,
    last_active_at: lastActiveAt,
    is_super_admin: isSuperAdmin,
  });

  await sendMetrics();

  return getUser(slackUserId);
}

export async function getUser(id: string): Promise<User> {
  try {
    console.log(`finding user ${id}`)
    const user = await (await User()).findOne({
      where: {
        id,
      },
    });

    // when fetching a user, update their superAdmin bit if it's in the hardcoded list of emails
    const hardCodedSuperAdmins = (process.env.SLACKERNEWS_ADMIN_USER_EMAILS || "").split(",");
    const isSuperAdmin = hardCodedSuperAdmins.indexOf(user.email_address) !== -1;
    if (isSuperAdmin && !user.is_super_admin ) {
      console.log(`flipping on super-admin permissions for user ${id} because their email was present in SLACKERNEWS_ADMIN_USER_EMAILS`)
      await setUserAdmin(user.id, true);
    }


    const u = {
      id: user.id,
      email: user.email_address,
      name: user.name,
      avatarUrl: user.avatar,
      createdAt: user.created_at.getTime(),
      lastLoginAt: user.last_login_at.getTime(),
      lastActiveAt: user.last_active_at.getTime(),
      isSuperAdmin: isSuperAdmin,
    };

    return u;
  } catch (err) {
    console.error(`error in getUser for id: ${id}, err: ${err}`);
    throw err;
  }

}

