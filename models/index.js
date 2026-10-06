const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/electronic_gradebook';

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: process.env.DB_SSL === 'true' ? { ssl: { require: true, rejectUnauthorized: false } } : {},
});

const db = { sequelize, Sequelize };
for (const file of fs.readdirSync(__dirname).filter((file) => file !== 'index.js' && file.endsWith('.js'))) {
  const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
}
Object.values(db).filter((model) => model && typeof model.associate === 'function')
  .forEach((model) => model.associate(db));

module.exports = db;
