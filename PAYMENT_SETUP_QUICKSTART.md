# Payment Infrastructure - Quick Start Guide

## What Was Built

A complete subscription and payment infrastructure that:
- ✅ **Doesn't interfere** with current beta testing
- ✅ **Tracks everything** you need for monetization
- ✅ **Preserves beta tester data** when you launch
- ✅ **Makes transition smooth** with grace periods

## Files Created

### Database Migrations:
- `supabase/migrations/20250122000001_subscription_infrastructure.sql` - Main schema
- `supabase/migrations/20250122000002_subscription_helper_functions.sql` - Helper functions

### Services:
- `src/services/subscriptionService.ts` - Subscription management
- `src/services/stripeService.ts` - Stripe integration (prepared, not enforced)

### React Hooks:
- `src/hooks/useSubscription.ts` - Easy subscription checks in components

### Scripts:
- `src/scripts/markBetaTesters.ts` - Mark existing users as beta testers

### Documentation:
- `PAYMENT_TRANSITION_STRATEGY.md` - Complete transition plan

---

## Step 1: Apply Database Migrations (DO NOW)

```bash
# Apply the migrations to create subscription tables
supabase db push
```

This creates:
- `subscription_plans` table with pre-configured plans
- `user_subscriptions` table to track each user
- `payment_history` table for transaction records
- `feature_flags` table for access control
- Helper functions for managing subscriptions

**Important:** `payment_enforcement` feature flag is set to `false` by default, so nothing changes for users yet.

---

## Step 2: Mark Current Users as Beta Testers (DO NOW)

### Option A: Automatic Script

1. Get your Supabase service role key:
   - Go to Supabase Dashboard → Settings → API
   - Copy the `service_role` key (secret!)

2. Add to `.env`:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. Run the script:
   ```bash
   npm install tsx
   npm run tsx src/scripts/markBetaTesters.ts
   ```

### Option B: Manual SQL Query

Run this in Supabase SQL Editor:

```sql
-- Mark all existing users as beta testers
UPDATE user_subscriptions
SET
  is_beta_tester = true,
  beta_tester_joined_at = created_at,
  tier = 'beta_tester',
  status = 'lifetime',
  beta_tester_notes = 'Original beta tester'
WHERE created_at < NOW(); -- Adjust date as needed
```

---

## Step 3: Use in Your App (OPTIONAL NOW)

You can start using the subscription hooks immediately, but they won't restrict access yet:

```typescript
import { useSubscription } from './hooks/useSubscription';

function MyComponent() {
  const { subscription, isBetaTester, tierDisplayName } = useSubscription();

  return (
    <div>
      <p>Your plan: {tierDisplayName}</p>
      {isBetaTester && <Badge>🌟 Beta Tester</Badge>}
    </div>
  );
}
```

---

## When Ready to Launch Paid Plans

### 2-4 Weeks Before Launch:

#### 1. Set Up Stripe

1. Create Stripe account: https://stripe.com
2. Create products in Stripe Dashboard:
   - **Basic Plan**: $29/month, $290/year
   - **Professional Plan**: $79/month, $790/year
3. Copy Price IDs from Stripe
4. Update database:
   ```sql
   UPDATE subscription_plans
   SET
     stripe_price_id_monthly = 'price_xxx',
     stripe_price_id_yearly = 'price_yyy'
   WHERE tier = 'basic';
   ```

5. Add to `.env`:
   ```bash
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

#### 2. Deploy Stripe Edge Functions

Create these in `supabase/functions/`:
- `create-checkout-session` - Handle checkout
- `create-customer-portal-session` - Manage subscriptions
- `stripe-webhook` - Process Stripe events

(See `PAYMENT_TRANSITION_STRATEGY.md` for code examples)

#### 3. Test Everything

Use Stripe test mode:
- Test card: `4242 4242 4242 4242`
- Test checkout flow
- Test subscription creation
- Test webhooks

### 1 Week Before Launch:

#### Email Beta Testers

```
Subject: BuildSelect Pro - Thank You for Beta Testing!

[See PAYMENT_TRANSITION_STRATEGY.md for full email template]
```

#### Set Grace Periods

```typescript
import { subscriptionService } from './services/subscriptionService';

// Give all beta testers 90-day grace period
const { data: betaTesters } = await supabase
  .from('user_subscriptions')
  .select('user_id')
  .eq('is_beta_tester', true);

for (const tester of betaTesters) {
  await subscriptionService.setGracePeriod(tester.user_id, 90);
}
```

### Launch Day:

#### Enable Payment Enforcement

```sql
-- This is the switch that starts requiring payment
UPDATE feature_flags
SET is_enabled = true
WHERE feature_key = 'payment_enforcement';
```

**What happens:**
- ✅ Beta testers: Keep full access (grace period)
- ✅ New signups: Must choose a plan
- ✅ Features: Start checking tier requirements
- ✅ Usage limits: Start enforcing

---

## Pricing Strategy

Choose what to offer beta testers:

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **Lifetime Free** | Professional tier forever | Max goodwill | Lost revenue |
| **50% Off Forever** | $39/mo instead of $79/mo | Valued + revenue | Complex pricing |
| **90-Day Grace** | Free trial, then choose plan | Fair to all | Some won't convert |
| **Hybrid** | Top users free, others 50% off | Rewards engagement | Subjective |

**Recommendation:** 50% off forever or 90-day grace period

---

## Feature Access Examples

### Protect a Feature

```typescript
import { useFeatureAccess } from './hooks/useSubscription';

function AdvancedFeature() {
  const { hasAccess, reason, upgradeRequired } = useFeatureAccess('team_collaboration');

  if (!hasAccess) {
    return (
      <UpgradePrompt
        message={reason}
        requiredTier={upgradeRequired}
      />
    );
  }

  return <TeamCollaborationUI />;
}
```

### Check Usage Limits

```typescript
import { useSubscription } from './hooks/useSubscription';

function CreateProjectButton() {
  const { checkUsageLimits } = useSubscription();

  const handleCreate = async () => {
    const limits = await checkUsageLimits();

    if (!limits.projects.withinLimit) {
      alert(`You've reached your limit of ${limits.projects.limit} projects`);
      // Show upgrade modal
      return;
    }

    // Create project...
  };
}
```

---

## Monitoring

### Key Metrics to Track:

```sql
-- Active subscriptions by tier
SELECT tier, COUNT(*) as count
FROM user_subscriptions
WHERE status IN ('active', 'trialing', 'grace_period')
GROUP BY tier;

-- Monthly revenue
SELECT
  DATE_TRUNC('month', created_at) as month,
  SUM(amount) as revenue
FROM payment_history
WHERE status = 'succeeded'
GROUP BY month;

-- Beta testers in grace period
SELECT COUNT(*) as count,
  AVG(DATE_PART('day', grace_period_ends_at - NOW())) as avg_days_remaining
FROM user_subscriptions
WHERE is_beta_tester = true
  AND grace_period_ends_at > NOW();
```

---

## Rollback Plan

If something goes wrong:

```sql
-- Instantly disable payment enforcement
UPDATE feature_flags
SET is_enabled = false
WHERE feature_key = 'payment_enforcement';
```

Everyone gets full access again until you fix the issue.

---

## Summary

✅ **Now:** Database schema is ready, nobody is affected
✅ **Later:** Flip one switch to enable payments
✅ **Beta testers:** Protected with grace periods
✅ **New users:** Choose plan at signup
✅ **Data:** Everyone's projects are preserved

---

## Need Help?

- Full strategy: `PAYMENT_TRANSITION_STRATEGY.md`
- Database schema: `supabase/migrations/20250122000001_subscription_infrastructure.sql`
- Code examples: `src/services/subscriptionService.ts`
- React usage: `src/hooks/useSubscription.ts`

You're all set! The infrastructure is ready whenever you are.
