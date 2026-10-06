const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  class User extends Model {
    toJSON() {
      return { id: this.id, email: this.email, role: this.role };
    }
  }

  User.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    email: {
      type: DataTypes.STRING(254), allowNull: false, unique: true,
      validate: { isEmail: true, len: [3, 254] },
    },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    role: {
      type: DataTypes.STRING(10), allowNull: false, defaultValue: 'user',
      validate: { isIn: [['user', 'admin']] },
    },
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    defaultScope: { attributes: { exclude: ['passwordHash'] } },
    scopes: { withPassword: { attributes: { include: ['passwordHash'] } } },
  });
  return User;
};
