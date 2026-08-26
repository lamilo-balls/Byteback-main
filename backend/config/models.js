module.exports.models = {
  migrate: 'alter',
  schema: true,
  attributes: {
    createdAt: { type: 'number', autoCreatedAt: true },
    updatedAt: { type: 'number', autoUpdatedAt: true },
    id: { type: 'number', autoIncrement: true }
  }
};
