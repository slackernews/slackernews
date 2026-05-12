import { getSequelize } from "./db";
import { DataTypes } from 'sequelize';
import { randomUUID } from 'crypto';

export async function UserComment() {
  const model = (await getSequelize()).define('user_comment', {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    link: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    tableName: 'user_comment',
    timestamps: false,
  });

  return model;
}

export interface UserComment {
  id: string;
  link: string;
  userId: string;
  body: string;
  createdAt: number;
}

export async function createUserComment(link: string, userId: string, body: string): Promise<UserComment> {
  const id = randomUUID();
  const createdAt = new Date();

  const comment = await (await UserComment()).create({
    id,
    link,
    user_id: userId,
    body,
    created_at: createdAt,
  });

  return {
    id: comment.id,
    link: comment.link,
    userId: comment.user_id,
    body: comment.body,
    createdAt: comment.created_at.getTime(),
  };
}

export async function listUserComments(link: string): Promise<UserComment[]> {
  const comments = await (await UserComment()).findAll({
    where: { link },
    order: [['created_at', 'DESC']],
  });

  return comments.map((c: any) => ({
    id: c.id,
    link: c.link,
    userId: c.user_id,
    body: c.body,
    createdAt: c.created_at.getTime(),
  }));
}

export async function getUserComment(id: string): Promise<UserComment | null> {
  const comment = await (await UserComment()).findOne({
    where: { id },
  });

  if (!comment) return null;

  return {
    id: comment.id,
    link: comment.link,
    userId: comment.user_id,
    body: comment.body,
    createdAt: comment.created_at.getTime(),
  };
}
