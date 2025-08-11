const { PrismaClient } = require('@prisma/client');

async function testDb() {
  try {
    console.log('Testing database connection...');
    const prisma = new PrismaClient();
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Try to create a test record
    const testRecord = await prisma.trendRecord.create({
      data: {
        source: 'test',
        topic: 'Test Topic',
        score: 50.0,
        tags: 'test',
        observedAt: new Date()
      }
    });
    console.log('✅ Test record created:', testRecord.id);
    
    // Try to read it back
    const records = await prisma.trendRecord.findMany();
    console.log('✅ Found', records.length, 'records in database');
    
    await prisma.$disconnect();
    console.log('✅ Database test completed successfully');
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

testDb();
