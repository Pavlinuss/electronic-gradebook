require('dotenv').config();

const common = {
  dialect: 'postgres',
  logging: false,
  dialectOptions: process.env.DB_SSL === 'true' ? { ssl: { require: true, rejectUnauthorized: false } } : {},
};

module.exports = {
  development: { ...common, use_env_variable: 'DATABASE_URL' },
  test: { ...common, use_env_variable: 'TEST_DATABASE_URL' },
  production: { ...common, use_env_variable: 'DATABASE_URL' },
};
