const grades = [];
let nextId = 1;

module.exports = {
  grades,
  allocateId: () => nextId++,
};
