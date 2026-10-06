const { DataTypes, Model } = require('sequelize');

class Grade extends Model {
  static associate() {}

  toJSON() {
    return {
      id: this.id,
      student: this.student,
      subject: this.subject,
      value: this.value,
      date: this.date,
      comment: this.comment,
      semester: this.semester,
    };
  }
}

module.exports = (sequelize) => {
  Grade.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    student: { type: DataTypes.STRING(100), allowNull: false },
    subject: { type: DataTypes.STRING(100), allowNull: false },
    value: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 2, max: 5 } },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    comment: { type: DataTypes.STRING(1000), allowNull: false, defaultValue: '' },
    semester: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, validate: { isIn: [[1, 2]] } },
  }, {
    sequelize,
    modelName: 'Grade',
    tableName: 'grades',
    timestamps: true,
    indexes: [{ fields: ['student'] }, { fields: ['subject'] }],
  });
  return Grade;
};
