'use strict';

const locations = [
  // Eriyur area villages & towns
  { Name: 'Eriyur', District: 'Dharmapuri', State: 'Tamil Nadu', IsActive: true, SortOrder: 1, CreatedAt: new Date(), UpdatedAt: new Date() },

];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('LocationMasters', locations);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('LocationMasters', {
      Name: locations.map(l => l.Name)
    });
  }
};
