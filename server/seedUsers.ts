import bcrypt from 'bcryptjs';
import { storage } from './storage';

async function seedUsers() {
  try {
    console.log('🌱 Seeding users...');

    // Check if users already exist
    const existingAdmin = await storage.getUserByUsername('admin001');
    if (existingAdmin) {
      console.log('✓ Users already exist, skipping seed');
      return;
    }

    // Create test users for different panels
    const users = [
      {
        username: 'admin001',
        password: await bcrypt.hash('123456', 12),
        name: 'Administrador Sistema',
        role: 'admin'
      },
      {
        username: 'CERT001',
        password: await bcrypt.hash('cert123', 12),
        name: 'Maria Elena Rodriguez',
        role: 'certificador'
      },
      {
        username: 'SUP001',
        password: await bcrypt.hash('super456', 12),
        name: 'Carlos Mendoza',
        role: 'supervisor'
      },
      {
        username: 'POS001',
        password: await bcrypt.hash('pos789', 12),
        name: 'Terminal Las Condes',
        role: 'pos'
      }
    ];

    for (const userData of users) {
      await storage.createUser(userData);
      console.log(`✓ Created user: ${userData.username} (${userData.role})`);
    }

    console.log('\n🎉 User seeding completed!');
    console.log('\n📋 Available credentials:');
    console.log('  Admin Panel: admin001 / 123456');
    console.log('  Certificador: CERT001 / cert123');
    console.log('  Supervisor: SUP001 / super456');
    console.log('  POS Terminal: POS001 / pos789');

  } catch (error) {
    console.error('❌ Error seeding users:', error);
  }
}

export { seedUsers };