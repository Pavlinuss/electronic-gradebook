module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('grades', [
      { student: 'Ivan Petrov', subject: 'Mathematics', value: 5, date: '2026-09-09', comment: 'Homework', semester: 1, createdAt: now, updatedAt: now },
      { student: 'Anna Smirnova', subject: 'Informatics', value: 4, date: '2026-09-10', comment: 'Practical work', semester: 1, createdAt: now, updatedAt: now },
    ]);
  },
  async down(queryInterface) { await queryInterface.bulkDelete('grades', null, {}); },
};
