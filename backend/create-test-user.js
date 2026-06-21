const { sequelize, User } = require('./models');

async function createTestUser() {
  try {
    await sequelize.authenticate();
    console.log('DB connected.');

    const existing = await User.findOne({ where: { email: 'testfarmer@local.com' } });
    if (existing) {
      console.log('Test user already exists:', existing.email);
    } else {
      const user = await User.create({
        name: 'Test Farmer',
        email: 'testfarmer@local.com',
        password: 'testpassword',
        role: 'farmer',
        district: 'Colombo'
      });
      console.log('Created test user:', user.email);
    }
    process.exit(0);
  } catch (err) {
    console.error('Error creating test user:', err);
    process.exit(1);
  }
}

createTestUser();
