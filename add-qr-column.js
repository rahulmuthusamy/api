require('dotenv').config();
const db = require('./src/models');

async function migrate() {
  try {
    await db.sequelize.query('ALTER TABLE Owners ADD COLUMN QRCodeUrl VARCHAR(255) DEFAULT NULL;');
    console.log('Added QRCodeUrl to Owners');
  } catch(e) {
    console.log('Error adding to Owners:', e.message);
  }
  
  try {
    await db.sequelize.query('ALTER TABLE PlayerMasters ADD COLUMN QRCodeUrl VARCHAR(255) DEFAULT NULL;');
    console.log('Added QRCodeUrl to PlayerMasters');
  } catch(e) {
    console.log('Error adding to PlayerMasters:', e.message);
  }
  
  process.exit(0);
}

migrate();
