#!/usr/bin/env node
import 'dotenv/config';
import { generateEmbedding, findSimilarNodes } from './src/services/ai.js';
import { db, nodes } from './src/db/index.js';

async function testService() {
  console.log('🧪 Testing backend AI service integration...\n');

  try {
    // Test 1: Generate embedding through service
    console.log('Test 1: Testing generateEmbedding service function...');
    const text = 'Machine learning is a subset of artificial intelligence';
    const embedding = await generateEmbedding(text);

    console.log(`✅ Generated ${embedding.length}-dimensional embedding`);
    console.log(`   First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);

    if (embedding.length !== 1024) {
      throw new Error(`Expected 1024 dimensions, got ${embedding.length}`);
    }

    // Test 2: Create test nodes with embeddings
    console.log('\nTest 2: Creating test nodes with embeddings...');

    // Get first user (or create test scenario)
    const existingNodes = await db.select().from(nodes).limit(1);

    if (existingNodes.length === 0) {
      console.log('⚠️  No users found in database. Skipping node creation test.');
      console.log('   Create a user account first to test full integration.');
    } else {
      const testUserId = existingNodes[0].userId;

      // Create test nodes
      const testTexts = [
        'Python is great for data science',
        'JavaScript is used for web development',
        'Machine learning helps analyze data patterns',
      ];

      console.log(`   Creating ${testTexts.length} test nodes...`);
      const embeddingPromises = testTexts.map(t => generateEmbedding(t));
      const embeddings = await Promise.all(embeddingPromises);

      const insertedNodes = await db
        .insert(nodes)
        .values(
          testTexts.map((content, i) => ({
            userId: testUserId,
            content,
            name: `Test Node ${i + 1}`,
            embedding: embeddings[i],
          }))
        )
        .returning();

      console.log(`✅ Created ${insertedNodes.length} nodes with embeddings`);

      // Test 3: Test semantic search
      console.log('\nTest 3: Testing semantic search...');
      const queryText = 'analyzing data with AI';
      const queryEmbedding = await generateEmbedding(queryText);

      const similarNodes = await findSimilarNodes(testUserId, queryEmbedding, 3);

      console.log(`   Query: "${queryText}"`);
      console.log(`   Found ${similarNodes.length} similar nodes:`);
      similarNodes.forEach((node, i) => {
        console.log(`   ${i + 1}. "${node.content}"`);
      });

      // Cleanup test nodes
      await db.delete(nodes).where(
        nodes.id.in(insertedNodes.map(n => n.id))
      );
      console.log('\n✅ Cleaned up test nodes');
    }

    console.log('\n🎉 Service integration tests passed!\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

testService();
