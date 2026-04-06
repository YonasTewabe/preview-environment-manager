import dotenv from 'dotenv';
import { sequelize, Environment, initAssociations } from '../models/index.js';
import { testConnection } from '../config/database.js';

dotenv.config();

const createMissingTables = async () => {
  try {
    console.warn('🔌 Testing database connection...');
    initAssociations();
    await testConnection();
    console.warn('✅ Database connection successful');
    console.warn('📦 Creating missing tables...');
    await Environment.sync({ alter: false });
    console.warn('  ✅ environments table ready');
    console.warn('\n✅ Done.');
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
