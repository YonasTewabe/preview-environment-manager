'use strict';
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Clean up any old duplicate admin user
    await queryInterface.bulkDelete('users', {
      email: 'admin@preview-builder.local'
    }, {});

    // Check if admin user already exists
    const [existing] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE username = 'admin' OR email = 'admin@example.com' LIMIT 1;`
    );

    if (existing && existing.length > 0) {
      console.log('ℹ️ Admin user already exists, skipping seeding.');
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('%TGBnhy6', salt);

    // Create admin user
    await queryInterface.bulkInsert('users', [{
      id: uuidv4(),
      username: 'admin',
      first_name: 'admin',
      last_name: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      last_login: null,
      email_verified: true,
      email_verification_token: null,
      reset_password_token: null,
      reset_password_expires: null,
      created_at: new Date(),
      updated_at: new Date()
    }], {});
  },

  async down(queryInterface, Sequelize) {
    // Remove the admin user
    await queryInterface.bulkDelete('users', {
      email: 'admin@example.com'
    }, {});
  }
};
