import { getSequelize } from "./db";

const { Sequelize, DataTypes } = require('sequelize');

export async function Filter() {
  const model = (await getSequelize()).define('slackernews_filter', {
    usergroup_id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    usergroup_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_excluded: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      default: false,
    },
  }, {
    tableName: 'slackernews_filter',
    timestamps: false,
  });

  return model;
}
