import 'dotenv/config';
import { prisma } from '../src/server/db';
import { fetchDefaultHashtagSet } from '../src/integrations/instagram';

async function convertInstagramToTrends() {
  console.log('🔄 Converting Instagram data to trends...\n');

  try {
    // Fetch Instagram data
    console.log('📱 Fetching Instagram data...');
    const instagramItems = await fetchDefaultHashtagSet();
    console.log(`✅ Fetched ${instagramItems.length} Instagram items`);

    if (instagramItems.length === 0) {
      console.log('⚠️  No Instagram items found');
      return;
    }

    // Convert to trends
    console.log('🔄 Converting to trends...');
    let converted = 0;
    let updated = 0;
    let created = 0;

    for (const item of instagramItems) {
      try {
        // Create a stable bucket for the current hour
        const now = new Date();
        const observedBucket = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

        // Use the Instagram item ID as the topic identifier
        const topic = item.topic || `Instagram Post ${item.meta?.id || Date.now()}`;
        
        // Calculate score (use the item's score or default)
        const score = item.score || 50;

        // Upsert the trend record
        const result = await prisma.trendRecord.upsert({
          where: { 
            source_topic_observedBucket: { 
              source: 'instagram', 
              topic: topic.substring(0, 200), // Limit topic length
              observedBucket 
            } 
          },
          update: { 
            score, 
            url: item.url, 
            tags: item.tags, 
            raw: item.meta || {}, 
            observedAt: item.observedAt,
            language: 'en',
            imageUrl: item.imageUrl
          },
          create: { 
            source: 'instagram', 
            topic: topic.substring(0, 200), // Limit topic length
            score, 
            url: item.url, 
            tags: item.tags, 
            raw: item.meta || {}, 
            observedAt: item.observedAt,
            observedBucket,
            language: 'en',
            imageUrl: item.imageUrl
          }
        });

        if (result) {
          converted++;
          // Check if this was an update or create
          if (result.updatedAt && result.createdAt && 
              result.updatedAt.getTime() !== result.createdAt.getTime()) {
            updated++;
          } else {
            created++;
          }
        }

        // Add a small delay to avoid overwhelming the database
        if (converted % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        console.error(`❌ Error converting item:`, error);
      }
    }

    console.log(`\n✅ Conversion completed!`);
    console.log(`   - Total converted: ${converted}`);
    console.log(`   - Created: ${created}`);
    console.log(`   - Updated: ${updated}`);

    // Show some sample trends
    console.log('\n📊 Sample Instagram trends:');
    const sampleTrends = await prisma.trendRecord.findMany({
      where: { source: 'instagram' },
      orderBy: { score: 'desc' },
      take: 5
    });

    sampleTrends.forEach((trend, index) => {
      console.log(`   ${index + 1}. ${trend.topic.substring(0, 60)}...`);
      console.log(`      Score: ${trend.score}`);
      console.log(`      URL: ${trend.url || 'N/A'}`);
      console.log(`      Image: ${trend.imageUrl ? 'Yes' : 'No'}`);
    });

  } catch (error) {
    console.error('❌ Error in conversion process:', error);
  }
}

convertInstagramToTrends().catch(console.error);
