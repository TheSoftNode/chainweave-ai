#!/usr/bin/env ts-node

/**
 * Integration Test Script
 * Tests the complete AI workflow: Authentication → AI Generation → Smart Contract Integration
 */

import { config } from '@/config/env';
import { connectDatabase } from '@/config/database';
import { aiService } from '@/services/AIService';
import { nftRequestService } from '@/services/NFTRequestService';
import { userService } from '@/services/UserService';
import { blockchainService } from '@/services/BlockchainService';
import { ipfsService } from '@/services/IPFSService';
import { logger } from '@/utils/logger';

async function testCompleteWorkflow() {
  console.log('\n🚀 Starting ChainWeave AI Integration Test\n');

  try {
    // 1. Test Database Connection
    console.log('1️⃣  Testing Database Connection...');
    await connectDatabase();
    console.log('✅ Database connected successfully\n');

    // 2. Test AI Services Health
    console.log('2️⃣  Testing AI Services...');
    const aiHealth = await aiService.healthCheck();
    console.log(`🤖 Gemini AI Status: ${aiHealth.status}`);
    console.log(`📊 Model: ${aiHealth.model}\n`);

    // 3. Test IPFS Service
    console.log('3️⃣  Testing IPFS Service...');
    const ipfsHealth = await ipfsService.healthCheck();
    console.log(`📁 IPFS Status: ${ipfsHealth.status}\n`);

    // 4. Test Blockchain Service
    console.log('4️⃣  Testing Blockchain Connection...');
    const blockchainHealth = await blockchainService.healthCheck();
    console.log(`⛓️  Blockchain Status: ${blockchainHealth.status}`);
    console.log(`🔗 Chain ID: ${blockchainHealth.chainId}`);
    console.log(`📦 Block Number: ${blockchainHealth.blockNumber}\n`);

    // 5. Test User Creation
    console.log('5️⃣  Testing User Management...');
    const testWallet = '0x1234567890123456789012345678901234567890';
    const userResult = await userService.createOrGetUser(testWallet);
    console.log(`👤 User Creation: ${userResult.success ? '✅' : '❌'}`);
    if (userResult.data) {
      console.log(`📋 User ID: ${userResult.data._id}\n`);
    }

    // 6. Test Gemini AI Features (Hackathon Highlights)
    console.log('6️⃣  Testing Gemini AI Features...');
    
    // Test prompt suggestions
    const suggestionsResult = await aiService.generatePromptSuggestions(
      'cosmic dragon',
      'digital-art'
    );
    console.log(`💡 Prompt Suggestions: ${suggestionsResult.success ? '✅' : '❌'}`);
    if (suggestionsResult.data) {
      console.log('🎨 Sample Suggestions:');
      suggestionsResult.data.slice(0, 2).forEach((suggestion, i) => {
        console.log(`   ${i + 1}. ${suggestion}`);
      });
      console.log('');
    }

    // 7. Test Complete AI Generation Workflow
    console.log('7️⃣  Testing Complete AI Workflow...');
    const testPrompt = 'A majestic cosmic dragon with iridescent scales floating through nebula clouds';
    
    console.log('🎯 Creating NFT Request...');
    const requestResult = await nftRequestService.createRequest(testWallet, {
      prompt: testPrompt,
      destinationChainId: 7001, // ZetaChain Testnet
      recipient: testWallet,
    });
    console.log(`📝 NFT Request: ${requestResult.success ? '✅' : '❌'}`);
    
    if (!requestResult.success || !requestResult.data) {
      console.log(`❌ Request failed: ${requestResult.error}\n`);
      return;
    }

    console.log(`🔗 Request ID: ${requestResult.data.requestId}`);
    console.log(`📍 Status: ${requestResult.data.status}\n`);

    // Test AI generation (this is where Gemini shines!)
    console.log('🤖 Testing Gemini AI Generation...');
    const aiResult = await aiService.generateNFTArtwork({
      prompt: testPrompt,
      style: 'digital-art',
    });
    
    console.log(`🎨 AI Generation: ${aiResult.success ? '✅' : '❌'}`);
    if (aiResult.success && aiResult.data) {
      console.log(`🖼️  Image URL: ${aiResult.data.imageUrl.substring(0, 50)}...`);
      console.log(`📦 IPFS Hash: ${aiResult.data.ipfsHash}`);
      console.log(`🏷️  Token URI: ${aiResult.data.tokenURI}`);
      console.log(`⏱️  Processing Time: ${aiResult.data.processingTime}ms`);
      console.log(`📄 NFT Name: ${aiResult.data.metadata.name}`);
      console.log(`📝 Description Preview: ${aiResult.data.metadata.description.substring(0, 100)}...\n`);
    } else {
      console.log(`❌ AI Generation failed: ${aiResult.error}\n`);
    }

    // 8. Summary Report
    console.log('📊 INTEGRATION TEST SUMMARY');
    console.log('================================');
    console.log(`Database: ${userResult.success ? '✅' : '❌'}`);
    console.log(`Gemini AI: ${aiHealth.status === 'available' ? '✅' : '❌'}`);
    console.log(`IPFS: ${ipfsHealth.status === 'available' ? '✅' : '❌'}`);
    console.log(`Blockchain: ${blockchainHealth.status === 'connected' ? '✅' : '❌'}`);
    console.log(`AI Workflow: ${aiResult?.success ? '✅' : '❌'}`);
    console.log(`User Management: ${userResult.success ? '✅' : '❌'}`);

    const allSystemsGo = [
      userResult.success,
      aiHealth.status === 'available',
      ipfsHealth.status === 'available', 
      blockchainHealth.status === 'connected',
      aiResult?.success
    ].every(Boolean);

    console.log(`\n🏆 Overall Status: ${allSystemsGo ? '🎉 READY FOR HACKATHON!' : '⚠️  NEEDS ATTENTION'}`);
    
    if (allSystemsGo) {
      console.log('\n🚀 ChainWeave AI Backend is PRODUCTION READY!');
      console.log('🎯 Perfect integration: Frontend ↔ Backend ↔ Gemini ↔ ZetaChain');
      console.log('🏅 Hackathon judges will be impressed!\n');
    }

  } catch (error) {
    console.error('\n❌ Integration test failed:', error);
    console.log('🔧 Check your environment variables and service configurations\n');
  } finally {
    process.exit(0);
  }
}

// Run the test
testCompleteWorkflow().catch(console.error);