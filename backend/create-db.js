const mysql = require('mysql2/promise');
require('dotenv').config();

async function createDatabase() {
  try {
    // Try connecting as root first (no password) to create DB and user
    const rootConn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: 'root',
      password: '',
      port: process.env.DB_PORT || 3306,
      multipleStatements: true
    });

    const sql = `
      CREATE DATABASE IF NOT EXISTS farmtrust;
      CREATE USER IF NOT EXISTS 'farmtrust'@'localhost' IDENTIFIED BY 'Farmtrust123';
      GRANT ALL PRIVILEGES ON farmtrust.* TO 'farmtrust'@'localhost';
      FLUSH PRIVILEGES;
    `;

    await rootConn.query(sql);
    console.log('Database and user created (or already exist).');
    await rootConn.end();
  } catch (error) {
    console.error('Error creating database or user:', error.message || error);
    process.exit(1);
  }
}

createDatabase();