#!/usr/bin/env node

/**
 * Test AI Services and MongoDB Connection
 */

require('dotenv').config();

async function testServices() {
  console.log('🚀 Testing ChainWeave AI Services');
  console.log('=' .repeat(50));

  // Test Gemini AI
  console.log('\n🤖 Testing Gemini AI...');
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    console.log('✅ Gemini AI client initialized');
    
    // Test a simple generation
    const result = await model.generateContent('Hello, are you working?');
    const response = await result.response;
    console.log(`✅ Gemini AI response: ${response.text().substring(0, 50)}...`);
  } catch (error) {
    console.log(`❌ Gemini AI error: ${error.message}`);
  }

  // Test OpenAI
  console.log('\n🧠 Testing OpenAI...');
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    console.log('✅ OpenAI client initialized');
    
    // Test a simple completion
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: 'Hello, are you working?' }],
      model: 'gpt-3.5-turbo',
      max_tokens: 10,
    });
    
    console.log(`✅ OpenAI response: ${completion.choices[0].message.content}`);
  } catch (error) {
    console.log(`❌ OpenAI error: ${error.message}`);
  }

  // Test Pinata IPFS
  console.log('\n📁 Testing Pinata IPFS...');
  try {
    const axios = require('axios');
    
    const response = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
      headers: {
        'pinata_api_key': process.env.PINATA_API_KEY,
        'pinata_secret_api_key': process.env.PINATA_API_SECRET,
      }
    });
    
    console.log(`✅ Pinata IPFS authenticated: ${response.data.message}`);
  } catch (error) {
    console.log(`❌ Pinata IPFS error: ${error.response?.data?.error || error.message}`);
  }

  // Test MongoDB Connection
  console.log('\n🗄️  Testing MongoDB Connection...');
  try {
    const mongoose = require('mongoose');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
    });
    
    console.log('✅ MongoDB connected successfully');
    console.log(`✅ Database: ${mongoose.connection.db.databaseName}`);
    
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected cleanly');
  } catch (error) {
    console.log(`❌ MongoDB error: ${error.message}`);
  }

  // Test ZetaChain RPC
  console.log('\n⛓️  Testing ZetaChain RPC...');
  try {
    const { ethers } = require('ethers');
    
    const provider = new ethers.JsonRpcProvider(process.env.ZETACHAIN_RPC_URL);
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    
    console.log(`✅ ZetaChain connected - Chain ID: ${network.chainId}`);
    console.log(`✅ Current block: ${blockNumber}`);
  } catch (error) {
    console.log(`❌ ZetaChain RPC error: ${error.message}`);
  }

  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Service testing complete!');
}

testServices().catch(console.error);
