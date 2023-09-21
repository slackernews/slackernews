import * as srs from "secure-random-string";
import * as jwt from "jsonwebtoken";
import { getUser, User } from "./user";
import { getParam, SlackerNewsConfig } from "./param";
import { getSequelize } from "./db";

const { Sequelize, DataTypes } = require('sequelize');

export async function Session() {
  const model = (await getSequelize()).define('session', {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    expire_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    access_token: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'session',
    timestamps: false,
  });

  return model;
}

export interface Session {
  id: string;
  expireAt: number;
  user: User;
  accessToken: string;
}

/* tslint:disable:variable-name */
interface Claims {
  session_id: string;
}


export async function getToken(session: Session): Promise<string> {
  try {
    const claims: Claims = {
      session_id: session.id,
    };

    const jwtSigningKey = await getJwtSigningKey();
    console.log(`got jwt signing key: ${jwtSigningKey}`)
    const token = jwt.sign(claims, jwtSigningKey);
    return token;
  } catch (err) {
    console.error(err);
    return "";
  }
}

async function getJwtSigningKey(): Promise<jwt.Secret> {
  const signingKey = await (await SlackerNewsConfig()).findOne({
    where: {
      key: 'jwt.signing.key',
    }
  });

  if (signingKey) {
    console.log(`returning existing signing key: ${signingKey.val}`)
    const s = signingKey.val as string;
    console.log(`returning existing signing key: ${s}`)
    return s;
    // return signingKey.val as string;
  }

  let newKey = srs.default({ length: 64 });
  await (await SlackerNewsConfig()).create({
    key: 'jwt.signing.key',
    val: newKey,
  });

  return newKey;
}

export async function createSession(userId: string, accessToken: string): Promise<Session | undefined> {
  try {
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + 1);

    const id = srs.default({ length: 36 });

    const sess = await (await Session()).create({
      id: id,
      expire_at: expireAt,
      user_id: userId,
      access_token: accessToken,
    })

    const user = await getUser(userId);

    return {
      id: id,
      expireAt: expireAt.getTime(),
      user: user,
      accessToken: accessToken,
    };
  } catch (err) {
    console.error(err);
    return;
  }
}

export async function loadSession(token?: string): Promise<Session | undefined> {
  try {
    if (!token) {
      return;
    }

    const signingKey = await getJwtSigningKey();
    const claims = await jwt.verify(token, signingKey) as jwt.JwtPayload;

    console.log(claims);
    const session = await (await Session()).findOne({
      where: {
        id: claims.session_id,
      },
    });

    const user = await getUser(session.user_id);
    await (await User()).update({
      last_active_at: new Date(),
    }, {
      where: {
        id: session.user_id,
      },
    });

    const sess: Session = {
      id: session.id,
      expireAt: session.expire_at.getTime(),
      accessToken: session.access_token,
      user: user,
    }

    return sess;
  } catch (err) {
    console.error(err);
    return;
  }
}

