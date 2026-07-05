#!/usr/bin/env node

import https from 'https';

const credentials = {
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  TERRAFORM_TOKEN: process.env.TERRAFORM_TOKEN,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  MONGODB_ATLAS_URI: process.env.MONGODB_ATLAS_URI,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  ALERT_EMAIL: process.env.ALERT_EMAIL
};

console.log('🔐 Testing Credentials...\n');

// Test 1: OpenRouter API
console.log('Test 1: OpenRouter API Key');
if (credentials.OPENROUTER_API_KEY) {
  console.log('✅ OpenRouter API Key: Present');
} else {
  console.log('❌ OpenRouter API Key: Missing');
}

// Test 2: Terraform Token
console.log('\nTest 2: Terraform Cloud Token');
if (credentials.TERRAFORM_TOKEN) {
  console.log('✅ Terraform Token: Present');
} else {
  console.log('❌ Terraform Token: Missing');
}

// Test 3: MongoDB URI
console.log('\nTest 3: MongoDB Atlas URI');
if (credentials.MONGODB_ATLAS_URI && credentials.MONGODB_ATLAS_URI.includes('mongodb+srv')) {
  console.log('✅ MongoDB URI: Valid format');
} else {
  console.log('❌ MongoDB URI: Invalid or missing');
}

// Test 4: GitHub Token
console.log('\nTest 4: GitHub Token');
if (credentials.GITHUB_TOKEN && credentials.GITHUB_TOKEN.startsWith('ghp_')) {
  console.log('✅ GitHub Token: Valid format');
} else if (credentials.GITHUB_TOKEN) {
  console.log('⚠️  GitHub Token: Present but format unclear');
} else {
  console.log('❌ GitHub Token: Missing');
}

// Test 5: AWS Credentials
console.log('\nTest 5: AWS Credentials');
if (credentials.AWS_ACCESS_KEY_ID && credentials.AWS_SECRET_ACCESS_KEY) {
  console.log('✅ AWS Credentials: Present');
} else {
  console.log('❌ AWS Credentials: Missing');
}

// Test 6: Alert Email
console.log('\nTest 6: Alert Email');
if (credentials.ALERT_EMAIL && credentials.ALERT_EMAIL.includes('@')) {
  console.log('✅ Alert Email: Valid format');
} else {
  console.log('❌ Alert Email: Invalid or missing');
}

// Summary
console.log('\n' + '='.repeat(50));
const allPresent = Object.values(credentials).every(v => v);
if (allPresent) {
  console.log('✅ ALL CREDENTIALS PRESENT AND READY');
  process.exit(0);
} else {
  console.log('❌ SOME CREDENTIALS MISSING');
  process.exit(1);
}
