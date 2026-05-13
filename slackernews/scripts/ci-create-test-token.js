#!/usr/bin/env node
/**
 * CI Test Token Generator
 * 
 * Creates a test user and API token in the SQLite database,
 * then generates a JWT for CLI authentication.
 * 
 * Usage: DB_URI=sqlite:/path/to/db node scripts/ci-create-test-token.js
 * Output: JWT token string (to stdout)
 */

const { Sequelize } = require('sequelize');
const jwt = require('jsonwebtoken');
    const { randomUUID, randomBytes } = require('crypto');

function generateSigningKey() {
  return randomBytes(32).toString('hex'); // 64 characters
}

async function main() {
  const dbUri = process.env.DB_URI;
  if (!dbUri) {
    console.error('Error: DB_URI environment variable is required');
    process.exit(1);
  }

  const sequelize = new Sequelize(dbUri, {
    dialect: dbUri.startsWith('postgresql://') ? 'postgres' : 'sqlite',
    logging: false,
  });

  try {
    // Create tables if they don't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS slackernews_user (
        id VARCHAR(255) NOT NULL PRIMARY KEY,
        email_address VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        avatar VARCHAR(255) NOT NULL,
        created_at DATETIME NOT NULL,
        last_login_at DATETIME NOT NULL,
        last_active_at DATETIME NOT NULL,
        is_super_admin TINYINT(1) NOT NULL DEFAULT 0
      )
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS api_token (
        id VARCHAR(255) NOT NULL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        access_token VARCHAR(255),
        created_at DATETIME NOT NULL,
        last_used_at DATETIME
      )
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS slackernews_config (
        key VARCHAR(255) NOT NULL PRIMARY KEY,
        val TEXT
      )
    `);

    // Create test user if not exists
    const userId = 'ci-test-user';
    const [existingUsers] = await sequelize.query(
      `SELECT id FROM slackernews_user WHERE id = ?`,
      { replacements: [userId] }
    );

    if (existingUsers.length === 0) {
      const now = new Date().toISOString();
      await sequelize.query(
        `INSERT INTO slackernews_user (id, email_address, name, avatar, created_at, last_login_at, last_active_at, is_super_admin)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        { replacements: [userId, 'ci@example.com', 'CI Test User', '', now, now, now, 0] }
      );
      console.error(`Created test user: ${userId}`);
    } else {
      console.error(`Test user already exists: ${userId}`);
    }

    // Create API token
    const tokenId = randomUUID();
    const now = new Date().toISOString();
    await sequelize.query(
      `INSERT INTO api_token (id, user_id, name, access_token, created_at, last_used_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      { replacements: [tokenId, userId, 'CI Test Token', null, now, null] }
    );
    console.error(`Created API token: ${tokenId}`);

    // Get or create signing key
    let [configs] = await sequelize.query(
      `SELECT val FROM slackernews_config WHERE key = 'jwt.signing.key'`
    );

    let signingKey;
    if (configs.length === 0) {
      signingKey = generateSigningKey();
      await sequelize.query(
        `INSERT INTO slackernews_config (key, val) VALUES (?, ?)`,
        { replacements: ['jwt.signing.key', signingKey] }
      );
      console.error('Generated new JWT signing key');
    } else {
      signingKey = configs[0].val;
      console.error('Using existing JWT signing key');
    }

    // Generate JWT
    const token = jwt.sign(
      {
        type: 'api',
        user_id: userId,
        token_id: tokenId,
      },
      signingKey,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    // Output JWT to stdout (for piping to other commands)
    console.log(token);

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

main();
