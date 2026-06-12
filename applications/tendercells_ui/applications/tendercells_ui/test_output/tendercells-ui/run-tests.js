#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🚀 Starting TenderCells UI Test Suite...\n');

try {
  console.log('📦 Running Unit Tests...');
  execSync('npx vitest run --dir src/__tests__/unit --reporter=verbose', {
    stdio: 'inherit',
    cwd: __dirname,
  });

  console.log('\n✅ Unit Tests Complete!\n');
} catch (error) {
  console.error('\n❌ Unit Tests Failed!');
  process.exit(1);
}

try {
  console.log('🔗 Running Integration Tests...');
  execSync('npx vitest run --dir src/__tests__/integration --reporter=verbose', {
    stdio: 'inherit',
    cwd: __dirname,
  });

  console.log('\n✅ Integration Tests Complete!\n');
} catch (error) {
  console.error('\n❌ Integration Tests Failed!');
  process.exit(1);
}

console.log('✅ All Tests Complete!');





