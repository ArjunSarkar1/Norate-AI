const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Testing database connection...');

    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');

    // Test if we can query the database
    const userCount = await prisma.user.count();
    console.log(`📊 Found ${userCount} users in the database`);

    // Test if all tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('User', 'Note', 'Tag', 'NoteTag')
      ORDER BY table_name;
    `;

    console.log('📋 Available tables:', tables.map(t => t.table_name));

    if (tables.length === 4) {
      console.log('✅ All required tables are present');
    } else {
      console.log('⚠️  Some tables are missing. Expected: User, Note, Tag, NoteTag');
    }

  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);

    if (error.message.includes("Can't reach database server")) {
      console.log('\n🔧 Troubleshooting steps:');
      console.log('1. Check your DATABASE_URL in .env.local');
      console.log('2. Make sure you\'re using the CONNECTION POOLING URL from Supabase');
      console.log('3. Verify your password is correct');
      console.log('4. Check if your Supabase project is running');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDatabaseConnection()
  .catch(console.error)
  .finally(() => process.exit());
