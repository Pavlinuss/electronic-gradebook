module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('grades', 'semester', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    });
    await queryInterface.addConstraint('grades', {
      fields: ['semester'],
      type: 'check',
      name: 'grades_semester_1_or_2',
      where: { semester: [1, 2] },
    });
  },
  async down(queryInterface) { await queryInterface.removeColumn('grades', 'semester'); },
};
