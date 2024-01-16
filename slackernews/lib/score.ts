import { getSequelize } from "./db";

const { Sequelize, DataTypes } = require('sequelize');

export async function ScoreSeed() {
  // primary key on score includes the time,
  // so we can't rely on the PK to deduplicate seeds
  // instead, for seeds, we only add if the link doesn't
  // already have a score
  const s = await Score();
  await s.sync();

  const urls: string[] = [
    'https://docs.slackernews.io',
    'https://www.replicated.com',
    'https://www.enterpriseready.io',
  ];

  const seedScores: any = {
    'https://docs.slackernews.io': 1,
    'https://www.replicated.com': 2,
    'https://www.enterpriseready.io': 3,
  }

  const seeds: any[] = [];
  for (const url of urls) {
    const existing = await s.findOne({
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
}

export async function Score() {
  const model = (await getSequelize()).define('score', {
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
}

export async function scoreReactionAdd(url: string, at: Date): Promise<void> {
  console.log('scoreReaction', url, at);
  const s = await Score();
  const score = await s.findOne({
    where: {
      time: at,
      link: url,
      reason: 'reaction',
    },
  });
  console.log('score', score);
  if (score) {
    score.score += 0.5;
    await score.save();
  } else {
      await s.create({
        time: at,
        link: url,
        score: 0.5,
        reason: 'reaction',
      });
  }
}

export async function scoreReactionRemove(url: string, at: Date): Promise<void> {
  console.log('scoreReaction', url, at);
  const s = await Score();
  const score = await s.findOne({
    where: {
      time: at,
      link: url,
      reason: 'reaction',
    },
  });

  if (score) {
    score.score -= 0.5;
    await score.save();
  }
}

export async function scoreShare(url: string, at: Date): Promise<void> {
  console.log('scoreShare', url, at);
  await (await Score()).upsert({
    time: at,
    link: url,
    score: 1,
    reason: 'share',
  });
}

export async function addLinkBoost(url: string): Promise<void> {
  console.log('addLinkBoost', url);
  await (await Score()).upsert({
    time: new Date(),
    link: url,
    score: 1,
    reason: 'boost',
  });
}

export async function addUserVoteOnLink(userId: string, url: string): Promise<void> {
  console.log('addUserVoteOnLink', userId, url);
  await (await Score()).upsert({
    time: new Date(),
    link: url,
    score: 1,
    reason: 'upvote',
    user_id: userId,
  });
}

export async function getUserVoteOnLink(userId: string, url: string): Promise<number> {
  console.log('getUserVoteOnLink', userId, url);
  const s = await Score();
  const score = await s.findOne({
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
}

export async function getTotalScoreCount(): Promise<number> {
  const s = await Score();
  const score = await s.sum('score');

  return score;
}
