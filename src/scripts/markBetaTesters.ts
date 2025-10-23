/**
 * Script to mark existing users as beta testers
 *
 * Run this script BEFORE enabling payment enforcement to ensure
 * all current users get beta tester benefits.
 *
 * Usage:
 * 1. Update BETA_TESTER_CUTOFF_DATE below
 * 2. Run: npm run tsx src/scripts/markBetaTesters.ts
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Service role key needed for admin access
const BETA_TESTER_CUTOFF_DATE = '2025-12-31'; // Users who joined before this date are beta testers

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function markExistingUsersAsBetaTesters() {
  console.log('🔍 Finding users who joined before', BETA_TESTER_CUTOFF_DATE);

  // Get all users who joined before cutoff date
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.error('❌ Error fetching users:', usersError);
    return;
  }

  if (!users || users.users.length === 0) {
    console.log('ℹ️  No users found');
    return;
  }

  console.log(`📊 Found ${users.users.length} total users`);

  const cutoffDate = new Date(BETA_TESTER_CUTOFF_DATE);
  const betaTesters = users.users.filter(
    (user) => new Date(user.created_at) <= cutoffDate
  );

  console.log(`🌟 ${betaTesters.length} users qualify as beta testers`);

  if (betaTesters.length === 0) {
    console.log('✅ No users to update');
    return;
  }

  // Update each user's subscription
  let successCount = 0;
  let errorCount = 0;

  for (const user of betaTesters) {
    try {
      // Check if subscription exists
      const { data: existingSub } = await supabase
        .from('user_subscriptions')
        .select('id, tier, is_beta_tester')
        .eq('user_id', user.id)
        .single();

      if (existingSub?.is_beta_tester) {
        console.log(`⏭️  ${user.email} - Already a beta tester`);
        successCount++;
        continue;
      }

      // Update or create subscription
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .upsert(
          {
            user_id: user.id,
            tier: 'beta_tester',
            status: 'lifetime',
            is_beta_tester: true,
            beta_tester_joined_at: user.created_at,
            beta_tester_notes: `Original beta tester - joined ${user.created_at}`,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        );

      if (updateError) {
        console.error(`❌ ${user.email} - Error:`, updateError.message);
        errorCount++;
      } else {
        console.log(`✅ ${user.email} - Marked as beta tester`);
        successCount++;
      }
    } catch (error) {
      console.error(`❌ ${user.email} - Unexpected error:`, error);
      errorCount++;
    }
  }

  console.log('\n📈 Summary:');
  console.log(`✅ Successfully marked: ${successCount} users`);
  console.log(`❌ Errors: ${errorCount} users`);
  console.log('\n🎉 Done!');
}

// Run the script
markExistingUsersAsBetaTesters().catch(console.error);
