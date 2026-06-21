const { sequelize } = require('./models');
require('dotenv').config();

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('MySQL connected');

    // 1. Add the column if it doesn't exist yet
    await sequelize.query(`
      ALTER TABLE Crops
      ADD COLUMN IF NOT EXISTS status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending'
    `);
    console.log('Column "status" ensured.');

    // 2. Mark all existing crops (which have never been reviewed) as approved
    const [, meta] = await sequelize.query(
      "UPDATE Crops SET status = 'approved' WHERE status = 'pending'"
    );
    console.log('Existing crops migrated -> approved. Rows affected:', meta.affectedRows);

  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await sequelize.close();
  }
}

migrate();
