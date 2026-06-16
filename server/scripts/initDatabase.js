import { testConnection, syncDatabase, User } from '../models/index.js';
import { Op } from 'sequelize';

const initializeDatabase = async () => {
  // Test connection
  await testConnection();
  
  // Sync database (create tables)
  await syncDatabase(false); // Set to true to force recreate tables
  
  // Create default admin user
  try {
    // Clean up any old duplicate admin user
    await User.destroy({ where: { email: 'admin@preview-builder.local' } });
    
    const existingAdmin = await User.findOne({ 
      where: { 
        [Op.or]: [
          { username: 'admin' },
          { email: 'admin@example.com' }
        ]
      } 
    });
    
    if (!existingAdmin) {
      await User.create({
        username: 'admin',
        email: 'admin@example.com',
        first_name: 'admin',
        last_name: 'admin',
        role: 'admin',
        status: 'active',
        password: '%TGBnhy6'
      });
      console.log('✅ Default admin user created successfully.');
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
  
  process.exit(0);
};

initializeDatabase().catch(error => {
  console.error('Database initialization failed:', error);
  process.exit(1);
});