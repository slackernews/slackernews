import * as srs from "secure-random-string";
import * as jwt from "jsonwebtoken";
import { getUser, User } from "./user";
import { getParam, SlackerNewsConfig } from "./param";
import { getSequelize } from "./db";
import { getApiToken, updateApiTokenLastUsed } from "./apiToken";

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
  isApiToken?: boolean;
}

/* tslint:disable:variable-name */
interface Claims {
  session_id: string;
}

interface ApiTokenClaims {
  type: 'api';
  user_id: string;
  token_id: string;
}


export async function getToken(session: Session): Promise<string> {
  try {
    const claims: Claims = {
      session_id: session.id,
    };

    const jwtSigningKey = await getJwtSigningKey();
    const token = jwt.sign(claims, jwtSigningKey, { algorithm: 'HS256' });
    return token;
  } catch (err) {
    console.error(err);
    return "";
  }
}

export async function getApiTokenJwt(userId: string, tokenId: string): Promise<string> {
  try {
    const claims: ApiTokenClaims = {
      type: 'api',
      user_id: userId,
      token_id: tokenId,
    };

    const jwtSigningKey = await getJwtSigningKey();
    const token = jwt.sign(claims, jwtSigningKey, { algorithm: 'HS256', expiresIn: '365d' });
    return token;
  } catch (err) {
    console.error(err);
    return "";
  }
}

export async function getJwtSigningKey(): Promise<jwt.Secret> {
  const signingKey = await (await SlackerNewsConfig()).findOne({
    where: {
      key: 'jwt.signing.key',
    }
  });

  if (signingKey) {
    return signingKey.val as string;
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
    const claims = jwt.verify(token, signingKey, { algorithms: ['HS256'], clockTolerance: 60 }) as jwt.JwtPayload;

    // Handle API tokens
    if (claims.type === 'api') {
      const apiToken = await getApiToken(claims.token_id);
      if (!apiToken || apiToken.userId !== claims.user_id) {
        return;
      }

      await updateApiTokenLastUsed(apiToken.id);

      const user = await getUser(claims.user_id);
      await (await User()).update({
        last_active_at: new Date(),
      }, {
        where: {
          id: claims.user_id,
        },
      });

      const sess: Session = {
        id: apiToken.id,
        expireAt: claims.exp ? claims.exp * 1000 : Date.now() + (365 * 24 * 60 * 60 * 1000),
        accessToken: apiToken.accessToken || '',
        user: user,
      };

      return sess;
    }

    // Handle session tokens
    const session = await (await Session()).findOne({
      where: {
        id: claims.session_id,
      },
    });

    if (!session) {
      return;
    }

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

export async function loadSessionFromRequest(req: any): Promise<Session | undefined> {
  const cookieToken = req.cookies?.auth;
  const bearerToken = req.headers?.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.substring(7)
    : undefined;

  // Try cookie first, then Bearer, so a valid Bearer isn't shadowed by an invalid cookie
  let sess: Session | undefined;
  let isApiToken = false;

  if (cookieToken) {
    sess = await loadSession(cookieToken);
  }

  if (!sess && bearerToken) {
    sess = await loadSession(bearerToken);
    if (sess) {
      isApiToken = true;
    }
  }

  if (sess) {
    sess.isApiToken = isApiToken;
  }

  return sess;
}

