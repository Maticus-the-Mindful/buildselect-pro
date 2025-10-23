# Payment Infrastructure & Transition Strategy

## Overview

This document outlines the payment infrastructure that's been set up for BuildSelect Pro. The system is designed to **not interfere with current beta testing** while setting you up for a **smooth transition to paid subscriptions** later.

## Current State: Beta Mode

### What's Active Now:
- ✅ Subscription database schema
- ✅ User tier tracking (beta_tester, free, basic, professional, enterprise)
- ✅ Feature flags for access control
- ✅ Usage tracking (projects, storage, AI analyses)
- ✅ Grace period mechanism
- ✅ Stripe integration code (prepared but not enforced)

### What's NOT Active:
- ❌ Payment enforcement
- ❌ Feature restrictions
- ❌ Usage limit enforcement
- ❌ Stripe billing

**Current behavior:** All users get full access, no payment required.

---

## Database Schema

### Tables Created:

1. **`subscription_plans`** - Available plans and pricing
   - Beta Tester (free forever)
   - Free ($0, limited features)
   - Basic ($29/mo or $290/yr)
   - Professional ($79/mo or $790/yr)
   - Enterprise (custom pricing)

2. **`user_subscriptions`** - User subscription status
   - Tracks tier, status, usage
   - Beta tester flag
   - Grace period dates
   - Stripe customer/subscription IDs

3. **`payment_history`** - Payment transaction log
   - Amount, status, Stripe IDs
   - Used for billing history

4. **`feature_flags`** - Feature access control
   - Define which features require which tier
   - Control rollout of new features
   - Beta tester override

### Key Fields:

```typescript
user_subscriptions {
  tier: 'beta_tester' | 'free' | 'basic' | 'professional' | 'enterprise'
  status: 'active' | 'trialing' | 'grace_period' | 'past_due' | 'canceled' | 'expired' | 'lifetime'
  is_beta_tester: boolean
  grace_period_ends_at: timestamp
  projects_count: number
  ai_analyses_this_month: number
}
```

---

## Tier Comparison

| Feature | Free | Basic | Professional | Enterprise | Beta Tester |
|---------|------|-------|--------------|------------|-------------|
| **Price** | $0 | $29/mo | $79/mo | Custom | $0 |
| **Projects** | 1 | 5 | 25 | Unlimited | Unlimited |
| **Storage** | 1 GB | 10 GB | 50 GB | Unlimited | Unlimited |
| **AI Analyses/mo** | 5 | 25 | 100 | Unlimited | Unlimited |
| **Blueprint Analysis** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Multi-page Analysis** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Team Collaboration** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Custom Catalogs** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **API Access** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Priority Support** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **White Label** | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## Beta Tester Benefits

Beta testers get special treatment:

### Automatic Benefits:
1. **Unlimited Everything** during beta period
2. **All features unlocked** (including enterprise features)
3. **Data preservation** - all projects/files kept forever
4. **Grace period** when transitioning to paid (30-90 days)
5. **Optional grandfathered pricing** (you decide)
6. **"Beta Tester" badge** in their profile

### Tracking:
- `is_beta_tester` flag set to true
- `beta_tester_joined_at` timestamp
- `beta_tester_notes` field for special agreements

### After Beta Ends:
You have flexibility to:
- Give lifetime free access
- Offer special beta tester pricing
- Transition to Professional tier with grace period
- Any custom arrangement

---

## Transition Plan: Beta → Paid

### Phase 1: Mark Beta Testers (NOW)

Run this for all current users:

```typescript
import { subscriptionService } from './services/subscriptionService';

// Mark all existing users as beta testers
async function markAllBetaTesters() {
  const { data: users } = await supabase.auth.admin.listUsers();

  for (const user of users) {
    await subscriptionService.markAsBetaTester(
      user.id,
      'Original beta tester - gets full access'
    );
  }
}
```

### Phase 2: Prep Stripe (2-4 WEEKS BEFORE LAUNCH)

1. **Create Stripe Account**
   - https://stripe.com
   - Complete business verification
   - Enable test mode initially

2. **Create Products in Stripe**
   - Basic Plan ($29/mo, $290/yr)
   - Professional Plan ($79/mo, $790/yr)
   - Copy Price IDs to database

3. **Update Environment Variables**
   ```bash
   # .env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

   # Supabase Edge Function environment
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

4. **Deploy Stripe Edge Functions**
   ```bash
   supabase functions deploy create-checkout-session
   supabase functions deploy create-customer-portal-session
   supabase functions deploy stripe-webhook
   ```

5. **Test in Stripe Test Mode**
   - Use test cards: 4242 4242 4242 4242
   - Verify webhooks work
   - Test subscription flows

### Phase 3: Beta Tester Communication (1-2 WEEKS BEFORE)

Send email to all beta testers:

```
Subject: BuildSelect Pro - Thank You for Beta Testing!

Hi [Name],

Thank you for being a BuildSelect Pro beta tester! As we prepare to launch
publicly on [DATE], we want to reward your early support.

YOUR BETA TESTER BENEFITS:
✅ All your projects and data are preserved
✅ [Choose one]:
   - Lifetime free Professional access
   - 50% off Professional plan forever ($39/mo instead of $79/mo)
   - 90-day grace period to decide

You have until [DATE + 90 days] to make your choice. Your account will
continue working normally during this time.

Questions? Reply to this email.

Thank you for helping us build BuildSelect Pro!
```

### Phase 4: Set Grace Periods (LAUNCH DAY - 1)

```typescript
// Give all beta testers 90-day grace period
async function setGracePeriodsForBetaTesters() {
  const { data: betaTesters } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('is_beta_tester', true);

  for (const tester of betaTesters) {
    await subscriptionService.setGracePeriod(tester.user_id, 90);
  }
}
```

### Phase 5: Enable Payment Enforcement (LAUNCH DAY)

```sql
-- Enable payment enforcement
UPDATE feature_flags
SET is_enabled = true
WHERE feature_key = 'payment_enforcement';
```

**What happens:**
- ✅ Beta testers: Full access (grace period)
- ✅ New signups: Required to select plan
- ✅ Feature flags: Start enforcing tier requirements
- ✅ Usage limits: Start tracking and limiting

### Phase 6: Monitor & Support (ONGOING)

Watch for:
- Failed payments
- Feature access issues
- Beta tester questions
- Upgrade requests

---

## Code Usage Examples

### Check Feature Access

```typescript
import { useFeatureAccess } from './hooks/useSubscription';

function BlueprintAnalysisButton() {
  const { hasAccess, isLoading, reason } = useFeatureAccess('ai_blueprint_analysis');

  if (isLoading) return <Spinner />;

  if (!hasAccess) {
    return (
      <UpgradePrompt
        message={reason}
        requiredTier="basic"
      />
    );
  }

  return <button onClick={analyzeBlueprint}>Analyze</button>;
}
```

### Check Usage Limits

```typescript
import { useSubscription } from './hooks/useSubscription';

function CreateProjectButton() {
  const { checkUsageLimits } = useSubscription();

  const handleCreateProject = async () => {
    const limits = await checkUsageLimits();

    if (!limits.projects.withinLimit) {
      alert(`You've reached your project limit (${limits.projects.limit}). Please upgrade.`);
      return;
    }

    // Create project...
  };

  return <button onClick={handleCreateProject}>New Project</button>;
}
```

### Show Subscription Status

```typescript
import { useSubscription } from './hooks/useSubscription';

function SubscriptionBadge() {
  const { subscription, isBetaTester, tierDisplayName } = useSubscription();

  if (isBetaTester) {
    return <Badge color="gold">🌟 Beta Tester</Badge>;
  }

  return <Badge>{tierDisplayName}</Badge>;
}
```

---

## Stripe Integration (When Ready)

### Create Checkout Session

```typescript
import { stripeService } from './services/stripeService';

async function handleUpgrade(tier: 'basic' | 'professional') {
  const session = await stripeService.createCheckoutSession(user.id, {
    priceId: tier === 'basic' ? 'price_basic_monthly' : 'price_pro_monthly',
    tier: tier,
    billingCycle: 'monthly',
  });

  if (session?.url) {
    window.location.href = session.url;
  }
}
```

### Customer Portal

```typescript
import { stripeService } from './services/stripeService';

async function openCustomerPortal() {
  await stripeService.redirectToCustomerPortal(user.id);
}
```

---

## Database Queries

### Get All Beta Testers

```sql
SELECT
  u.email,
  s.tier,
  s.beta_tester_joined_at,
  s.projects_count,
  s.ai_analyses_this_month
FROM auth.users u
JOIN user_subscriptions s ON s.user_id = u.id
WHERE s.is_beta_tester = true
ORDER BY s.beta_tester_joined_at;
```

### Get Subscription Revenue

```sql
SELECT
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as payment_count,
  SUM(amount) as total_revenue
FROM payment_history
WHERE status = 'succeeded'
GROUP BY month
ORDER BY month DESC;
```

### Get Users in Grace Period

```sql
SELECT
  u.email,
  s.tier,
  s.grace_period_ends_at,
  DATE_PART('day', s.grace_period_ends_at - NOW()) as days_remaining
FROM auth.users u
JOIN user_subscriptions s ON s.user_id = u.id
WHERE s.grace_period_ends_at > NOW()
ORDER BY s.grace_period_ends_at;
```

---

## Pricing Strategy Options

### Option 1: Reward All Beta Testers
- ✅ Lifetime Professional access (free forever)
- ✅ Builds goodwill and loyalty
- ✅ Great marketing testimonials
- ❌ Lost revenue from early adopters

### Option 2: Grandfathered Pricing
- ✅ 50% off Professional forever ($39/mo instead of $79/mo)
- ✅ Beta testers feel valued
- ✅ You still get revenue
- ✅ Creates urgency for new signups

### Option 3: Extended Grace Period
- ✅ 90-day grace period to add payment
- ✅ After grace: Must select paid plan or downgrade to free
- ✅ Balances goodwill with business needs
- ✅ Most beta testers will convert

### Option 4: Hybrid
- ✅ Top 10 most active beta testers: Lifetime free
- ✅ Everyone else: 50% off forever
- ✅ Rewards engagement
- ✅ Fair to all

**Recommendation:** Option 2 or 4 - balances appreciation with sustainability.

---

## Gradual Rollout Strategy

Instead of flipping one switch, you can gradually enforce:

### Week 1: Soft Launch
- Enable payment enforcement
- Show upgrade prompts but don't block features
- Track conversion rates

### Week 2: Start Limits
- Enforce project limits (1 for free, 5 for basic)
- Don't enforce AI analysis limits yet
- Beta testers unaffected

### Week 3: Full Enforcement
- Enforce all usage limits
- Enforce feature access
- Beta testers still get full access

### Week 4-12: Grace Period
- Beta testers must choose plan
- Extended grace for highly engaged users

---

## Monitoring & Metrics

Track these KPIs:

### Subscription Metrics:
- Free → Paid conversion rate
- Beta tester retention rate
- Churn rate by tier
- Upgrade rate (Basic → Professional)
- MRR (Monthly Recurring Revenue)
- LTV (Lifetime Value) by tier

### Usage Metrics:
- Projects per user by tier
- AI analyses per user by tier
- Storage usage by tier
- Features used by tier

### Support Metrics:
- Payment failure rate
- Support tickets by tier
- Feature requests by tier

---

## Emergency Rollback Plan

If things go wrong, you can instantly roll back:

```sql
-- Disable payment enforcement immediately
UPDATE feature_flags
SET is_enabled = false
WHERE feature_key = 'payment_enforcement';
```

This will:
- Stop all payment requirements
- Restore full access to everyone
- Give you time to fix issues

---

## Legal & Compliance

### Before Launch:
1. ✅ Terms of Service (mention subscription billing)
2. ✅ Privacy Policy (mention payment data handling)
3. ✅ Refund Policy (Stripe handles most of this)
4. ✅ PCI Compliance (Stripe handles this)

### After Launch:
- Send invoice receipts (Stripe does this automatically)
- Handle subscription cancellations (Stripe Customer Portal)
- Process refunds when needed (Stripe dashboard)

---

## FAQ for Beta Testers

**Q: Will I lose my projects?**
A: No! All your data is preserved forever, regardless of plan.

**Q: Do I have to pay now?**
A: No, you have a 90-day grace period to decide.

**Q: What happens after the grace period?**
A: You can select a paid plan or downgrade to the free tier (1 project limit).

**Q: Can I export my data?**
A: Yes, you can export all your project data at any time.

**Q: What if I can't afford a paid plan?**
A: Contact us! We offer discounts for students, nonprofits, and hardship cases.

---

## Next Steps

1. **Now:** Run migrations to set up database schema
2. **This Week:** Mark current users as beta testers
3. **2-4 Weeks Before Launch:** Set up Stripe
4. **1 Week Before Launch:** Email beta testers
5. **Launch Day:** Enable payment enforcement
6. **Post-Launch:** Monitor metrics and support users

---

## Support

For questions about the payment infrastructure:
- Database schema: `supabase/migrations/20250122000001_subscription_infrastructure.sql`
- Service layer: `src/services/subscriptionService.ts`
- Stripe integration: `src/services/stripeService.ts`
- React hooks: `src/hooks/useSubscription.ts`

Last Updated: 2025-10-22
