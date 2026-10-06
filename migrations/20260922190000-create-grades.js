module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('grades', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      student: { type: Sequelize.STRING(100), allowNull: false },
      subject: { type: Sequelize.STRING(100), allowNull: false },
      value: { type: Sequelize.INTEGER, allowNull: false },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      comment: { type: Sequelize.STRING(1000), allowNull: false, defaultValue: '' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('grades', ['student']);
    await queryInterface.addIndex('grades', ['subject']);
  },
  async down(queryInterface) { await queryInterface.dropTable('grades'); },
};
