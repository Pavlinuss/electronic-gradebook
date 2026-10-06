module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable('users', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
        email: { type: Sequelize.STRING(254), unique: true, allowNull: false },
        passwordHash: { type: Sequelize.STRING, allowNull: false },
        role: { type: Sequelize.STRING(10), allowNull: false, defaultValue: 'user' },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });
      await queryInterface.addConstraint('users', {
        fields: ['role'], type: 'check', name: 'users_role_check',
        where: { role: ['user', 'admin'] }, transaction,
      });
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
