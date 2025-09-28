const mockDatabase = {
  execAsync: jest.fn(() => Promise.resolve()),
  runAsync: jest.fn(() => Promise.resolve({ lastInsertRowId: 1, changes: 1 })),
  getFirstAsync: jest.fn(() => Promise.resolve({ user_version: 0 })),
  getAllAsync: jest.fn(() => Promise.resolve([])),
  closeAsync: jest.fn(() => Promise.resolve()),
};

module.exports = {
  openDatabaseAsync: jest.fn(() => Promise.resolve(mockDatabase)),
};