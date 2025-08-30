#!/usr/bin/env node

/**
 * Debug Environment Variables and API Keys
 */

require('dotenv').config();

console.log('🔍 ChainWeave AI Backend - Environment Debug');
console.log('=' .repeat(50));

// Basic Environment
console.log('\n📋 Basic Configuration:');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`PORT: ${process.env.PORT}`);
console.log(`LOG_LEVEL: ${process.env.LOG_LEVEL}`);

// Database
console.log('\n🗄️  Database Configuration:');
const mongoUri = process.env.MONGODB_URI;
if (mongoUri) {
  console.log(`MongoDB URI: ${mongoUri.substring(0, 30)}...${mongoUri.substring(mongoUri.length - 20)}`);
  console.log(`MongoDB Host: ${mongoUri.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB'}`);
} else {
  console.log('❌ MONGODB_URI not found');
}

// JWT
console.log('\n🔐 JWT Configuration:');
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Loaded (' + process.env.JWT_SECRET.length + ' chars)' : '❌ Missing'}`);
console.log(`JWT_REFRESH_SECRET: ${process.env.JWT_REFRESH_SECRET ? '✅ Loaded (' + process.env.JWT_REFRESH_SECRET.length + ' chars)' : '❌ Missing'}`);

// AI Configuration
console.log('\n🤖 AI Configuration:');
const geminiKey = process.env.GEMINI_API_KEY;
console.log(`Gemini API Key: ${geminiKey ? '✅ Loaded (' + geminiKey.length + ' chars)' : '❌ Missing'}`);
if (geminiKey) {
  console.log(`Gemini Key Format: ${geminiKey.startsWith('AIzaSy') ? '✅ Valid format' : '⚠️ Unexpected format'}`);
}

const openaiKey = process.env.OPENAI_API_KEY;
console.log(`OpenAI API Key: ${openaiKey ? '✅ Loaded (' + openaiKey.length + ' chars)' : '❌ Missing'}`);
if (openaiKey) {
  console.log(`OpenAI Key Format: ${openaiKey.startsWith('sk-') ? '✅ Valid format' : '⚠️ Unexpected format'}`);
}

// IPFS Configuration
console.log('\n📁 IPFS Configuration:');
console.log(`Pinata API Key: ${process.env.PINATA_API_KEY ? '✅ Loaded (' + process.env.PINATA_API_KEY.length + ' chars)' : '❌ Missing'}`);
console.log(`Pinata API Secret: ${process.env.PINATA_API_SECRET ? '✅ Loaded (' + process.env.PINATA_API_SECRET.length + ' chars)' : '❌ Missing'}`);
console.log(`Pinata JWT: ${process.env.PINATA_JWT ? '✅ Loaded (' + process.env.PINATA_JWT.length + ' chars)' : '❌ Missing'}`);

// Blockchain Configuration
console.log('\n⛓️  Blockchain Configuration:');
console.log(`ZetaChain RPC: ${process.env.ZETACHAIN_RPC_URL || '❌ Missing'}`);
console.log(`ChainWeave Contract: ${process.env.CHAINWEAVE_CONTRACT_ADDRESS || '❌ Missing'}`);
console.log(`Backend Private Key: ${process.env.BACKEND_PRIVATE_KEY ? '✅ Loaded (' + process.env.BACKEND_PRIVATE_KEY.length + ' chars)' : '❌ Missing'}`);

// Cross-chain Minters
console.log('\n🌐 Cross-chain Minters:');
console.log(`Ethereum Sepolia: ${process.env.ETHEREUM_SEPOLIA_MINTER || 'Not set'}`);
console.log(`Base Sepolia: ${process.env.BASE_SEPOLIA_MINTER || 'Not set'}`);
console.log(`BSC Testnet: ${process.env.BSC_TESTNET_MINTER || 'Not set'}`);
console.log(`Polygon Amoy: ${process.env.POLYGON_AMOY_MINTER || 'Not set'}`);

// Admin Configuration
console.log('\n👤 Admin Configuration:');
console.log(`Admin Wallets: ${process.env.ADMIN_WALLETS || '❌ Missing'}`);
console.log(`CORS Origin: ${process.env.CORS_ORIGIN || '❌ Missing'}`);

console.log('\n' + '=' .repeat(50));
console.log('✅ Environment debug complete!');
