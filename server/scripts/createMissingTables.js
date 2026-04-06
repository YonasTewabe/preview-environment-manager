import dotenv from 'dotenv';
import { sequelize, Environment, initAssociations } from '../models/index.js';
import { testConnection } from '../config/database.js';

dotenv.config();

const createMissingTables = async () => {
  try {
    console.log('🔌 Testing database connection...');
    initAssociations();
    await testConnection();
    console.log('✅ Database connection successful');
    console.log('📦 Creating missing tables...');
    await Environment.sync({ alter: false });
    console.log('  ✅ environments table ready');
    console.log('\n✅ Done.');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    console.error(error);
    await sequelize.close();
    process.exit(1);
  }
};

createMissingTables();
