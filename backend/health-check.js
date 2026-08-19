/**
 * Assessify AI - Production Health & Database Verification Script
 * 
 * Execution Command:
 *   node backend/health-check.js
 */

try {
  require('dotenv').config({ path: './backend/.env' });
} catch (e) {
  try {
    require('dotenv').config({ path: './.env' });
  } catch (e2) {}
}

const { PrismaClient } = require('./node_modules/@prisma/client') || require('@prisma/client');
const prisma = new PrismaClient();

async function runHealthCheck() {
  console.log('\n==================================================');
  console.log('🩺 ASSESSIFY AI - PRODUCTION SYSTEM HEALTH CHECK');
  console.log('==================================================\n');

  try {
    // 1. Test Raw Database Ping
    console.log('[CHECK 1] Pinging PostgreSQL Database (Supabase)...');
    const dbPing = await prisma.$queryRaw`SELECT 1 as ping`;
    if (!dbPing || dbPing.length === 0) {
      throw new Error('Database ping query returned empty response.');
    }
    console.log('   ✓ Database Ping: SUCCESSful (SELECT 1 OK)\n');

    // 2. Test Model Tables Access & Record Volume
    console.log('[CHECK 2] Verifying Model Tables Accessibility & Counts...');
    const [usersCount, categoriesCount, quizzesCount, questionsCount, attemptsCount, answersCount] = await Promise.all([
      prisma.user.count(),
      prisma.category.count(),
      prisma.quiz.count(),
      prisma.question.count(),
      prisma.attempt.count(),
      prisma.answer.count()
    ]);

    console.log(`   ✓ Model [User]      : ACCESSIBLE (${usersCount} records)`);
    console.log(`   ✓ Model [Category]  : ACCESSIBLE (${categoriesCount} records)`);
    console.log(`   ✓ Model [Quiz]      : ACCESSIBLE (${quizzesCount} records)`);
    console.log(`   ✓ Model [Question]  : ACCESSIBLE (${questionsCount} records)`);
    console.log(`   ✓ Model [Attempt]   : ACCESSIBLE (${attemptsCount} records)`);
    console.log(`   ✓ Model [Answer]    : ACCESSIBLE (${answersCount} records)\n`);

    console.log('==================================================');
    console.log('🎉 SYSTEM HEALTH CHECK PASSED 100% - ALL SYSTEMS GO!');
    console.log('==================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ [HEALTH CHECK FAILED]:', err.message);
    console.log('==================================================\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runHealthCheck();
