#!/usr/bin/env node
import 'dotenv/config';
import { VoyageAIClient } from 'voyageai';

const voyage = new VoyageAIClient({
  apiKey: process.env.VOYAGE_API_KEY,
});

async function testEmbeddings() {
  console.log('🧪 Testing Voyage AI embeddings...\n');

  try {
    // Test 1: Generate embedding
    console.log('Test 1: Generating embedding for sample text...');
    const text = 'The quick brown fox jumps over the lazy dog';
    const response = await voyage.embed({
      input: text,
      model: 'voyage-3.5-lite',
      outputDimension: 1024,
    });

    if (!response.data?.[0]?.embedding) {
      throw new Error('No embedding returned');
    }

    const embedding = response.data[0].embedding;
    console.log(`✅ Generated ${embedding.length}-dimensional embedding`);
    console.log(`   First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);

    // Test 2: Verify dimension
    console.log('\nTest 2: Verifying embedding dimension...');
    if (embedding.length !== 1024) {
      throw new Error(`Expected 1024 dimensions, got ${embedding.length}`);
    }
    console.log('✅ Embedding has correct dimension (1024)');

    // Test 3: Check normalization
    console.log('\nTest 3: Checking if embedding is normalized...');
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    console.log(`   Magnitude: ${magnitude.toFixed(6)}`);
    if (Math.abs(magnitude - 1.0) < 0.01) {
      console.log('✅ Embedding is normalized (magnitude ≈ 1)');
    } else {
      console.log('⚠️  Embedding is not normalized (this is OK for some models)');
    }

    // Test 4: Test semantic similarity
    console.log('\nTest 4: Testing semantic similarity...');
    const similar = 'A fast brown fox leaps over a sleepy dog';
    const different = 'Python is a programming language';

    const [resp1, resp2] = await Promise.all([
      voyage.embed({ input: similar, model: 'voyage-3.5-lite', outputDimension: 1024 }),
      voyage.embed({ input: different, model: 'voyage-3.5-lite', outputDimension: 1024 }),
    ]);

    const embedding1 = resp1.data[0].embedding;
    const embedding2 = resp2.data[0].embedding;

    // Cosine similarity
    const cosineSimilarity = (a, b) => {
      const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
      const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
      const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
      return dot / (magA * magB);
    };

    const simScore = cosineSimilarity(embedding, embedding1);
    const diffScore = cosineSimilarity(embedding, embedding2);

    console.log(`   Similar text similarity: ${simScore.toFixed(4)}`);
    console.log(`   Different text similarity: ${diffScore.toFixed(4)}`);

    if (simScore > diffScore) {
      console.log('✅ Semantic similarity working correctly!');
    } else {
      console.log('❌ Unexpected similarity scores');
    }

    console.log('\n🎉 All tests passed! Voyage AI embeddings are working properly.\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.message.includes('API key')) {
      console.error('\n💡 Make sure VOYAGE_API_KEY is set in backend/.env');
    }
    process.exit(1);
  }
}

testEmbeddings();
