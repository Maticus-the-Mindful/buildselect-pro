import { supabase } from '../lib/supabase';

/**
 * Subscription Service
 *
 * Manages user subscriptions, tiers, and feature access.
 * Designed to be non-intrusive during beta but ready for monetization.
 */

export type SubscriptionTier =
  | 'beta_tester'
  | 'free'
  | 'basic'
  | 'professional'
  | 'enterprise';

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'grace_period'
  | 'past_due'
  | 'canceled'
  | 'expired'
  | 'lifetime';

export interface UserSubscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  is_beta_tester: boolean;
  beta_tester_joined_at?: string;
  billing_cycle?: 'monthly' | 'yearly' | 'lifetime';
  current_period_start?: string;
  current_period_end?: string;
  grace_period_ends_at?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  projects_count: number;
  storage_used_gb: number;
  ai_analyses_this_month: number;
  ai_analyses_reset_at: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  description: string;
  price_monthly?: number;
  price_yearly?: number;
  max_projects?: number;
  max_files_per_project?: number;
  max_storage_gb?: number;
  max_ai_analyses_per_month?: number;
  features: string[];
  is_active: boolean;
}

export interface FeatureAccess {
  hasAccess: boolean;
  reason?: string;
  upgradeRequired?: SubscriptionTier;
}

export const subscriptionService = {
  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }

    return data;
  },

  /**
   * Check if user has access to a feature
   *
   * During beta, this is permissive. Later, it will enforce payment.
   */
  async checkFeatureAccess(
    userId: string,
    featureKey: string
  ): Promise<FeatureAccess> {
    try {
      // Call the database function to check access
      const { data, error } = await supabase.rpc('has_feature_access', {
        user_id_param: userId,
        feature_key_param: featureKey,
      });

      if (error) {
        console.error('Error checking feature access:', error);
        // During beta, default to allowing access if there's an error
        return {
          hasAccess: true,
          reason: 'Beta period - access granted by default',
        };
      }

      if (data === true) {
        return { hasAccess: true };
      }

      // Get user subscription to provide upgrade info
      const subscription = await this.getUserSubscription(userId);

      // During beta, be permissive
      if (subscription?.is_beta_tester) {
        return {
          hasAccess: true,
          reason: 'Beta tester access',
        };
      }

      // Check if in grace period
      if (
        subscription?.grace_period_ends_at &&
        new Date(subscription.grace_period_ends_at) > new Date()
      ) {
        return {
          hasAccess: true,
          reason: 'Grace period access',
        };
      }

      // Get feature requirements
      const { data: feature } = await supabase
        .from('feature_flags')
        .select('required_tier, feature_name')
        .eq('feature_key', featureKey)
        .single();

      return {
        hasAccess: false,
        reason: `This feature requires ${feature?.required_tier || 'a paid'} subscription`,
        upgradeRequired: feature?.required_tier as SubscriptionTier,
      };
    } catch (error) {
      console.error('Error checking feature access:', error);
      // Fail open during beta
      return {
        hasAccess: true,
        reason: 'Beta period - access granted by default',
      };
    }
  },

  /**
   * Check if user is within usage limits
   */
  async checkUsageLimits(
    userId: string
  ): Promise<{
    projects: { current: number; limit?: number; withinLimit: boolean };
    storage: { current: number; limit?: number; withinLimit: boolean };
    aiAnalyses: { current: number; limit?: number; withinLimit: boolean };
  }> {
    const subscription = await this.getUserSubscription(userId);
    const plan = subscription?.tier
      ? await this.getSubscriptionPlan(subscription.tier)
      : null;

    if (!subscription) {
      return {
        projects: { current: 0, limit: 1, withinLimit: true },
        storage: { current: 0, limit: 1, withinLimit: true },
        aiAnalyses: { current: 0, limit: 5, withinLimit: true },
      };
    }

    // Beta testers have no limits
    if (subscription.is_beta_tester || subscription.tier === 'beta_tester') {
      return {
        projects: { current: subscription.projects_count, withinLimit: true },
        storage: {
          current: subscription.storage_used_gb,
          withinLimit: true,
        },
        aiAnalyses: {
          current: subscription.ai_analyses_this_month,
          withinLimit: true,
        },
      };
    }

    return {
      projects: {
        current: subscription.projects_count,
        limit: plan?.max_projects,
        withinLimit: plan?.max_projects
          ? subscription.projects_count < plan.max_projects
          : true,
      },
      storage: {
        current: subscription.storage_used_gb,
        limit: plan?.max_storage_gb,
        withinLimit: plan?.max_storage_gb
          ? subscription.storage_used_gb < plan.max_storage_gb
          : true,
      },
      aiAnalyses: {
        current: subscription.ai_analyses_this_month,
        limit: plan?.max_ai_analyses_per_month,
        withinLimit: plan?.max_ai_analyses_per_month
          ? subscription.ai_analyses_this_month <
            plan.max_ai_analyses_per_month
          : true,
      },
    };
  },

  /**
   * Increment AI analysis counter
   */
  async incrementAIAnalysisCount(userId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_ai_analysis_count', {
      user_id_param: userId,
    });

    if (error) {
      console.error('Error incrementing AI analysis count:', error);
    }
  },

  /**
   * Get all available subscription plans
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      console.error('Error fetching subscription plans:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Get a specific subscription plan
   */
  async getSubscriptionPlan(
    tier: SubscriptionTier
  ): Promise<SubscriptionPlan | null> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('tier', tier)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching subscription plan:', error);
      return null;
    }

    return data;
  },

  /**
   * Mark user as beta tester
   *
   * This gives them special privileges and preserves their data
   * when payment is eventually required.
   */
  async markAsBetaTester(userId: string, notes?: string): Promise<void> {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        is_beta_tester: true,
        beta_tester_joined_at: new Date().toISOString(),
        beta_tester_notes: notes,
        tier: 'beta_tester',
        status: 'lifetime',
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error marking user as beta tester:', error);
      throw error;
    }
  },

  /**
   * Set grace period for a user
   *
   * Used when transitioning beta testers to paid tiers.
   * Gives them time to add payment without losing access.
   */
  async setGracePeriod(userId: string, days: number): Promise<void> {
    const gracePeriodEnd = new Date();
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + days);

    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        grace_period_ends_at: gracePeriodEnd.toISOString(),
        status: 'grace_period',
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error setting grace period:', error);
      throw error;
    }
  },

  /**
   * Transition beta tester to paid tier
   *
   * Preserves their data and gives them a grace period to add payment.
   */
  async transitionBetaTesterToPaid(
    userId: string,
    newTier: SubscriptionTier,
    gracePeriodDays: number = 30
  ): Promise<void> {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription?.is_beta_tester) {
      throw new Error('User is not a beta tester');
    }

    await this.setGracePeriod(userId, gracePeriodDays);

    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        tier: newTier,
        // Keep is_beta_tester true to track historical beta testers
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error transitioning beta tester:', error);
      throw error;
    }
  },

  /**
   * Get user's payment history
   */
  async getPaymentHistory(userId: string) {
    const { data, error } = await supabase
      .from('payment_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Check if payment enforcement is enabled
   *
   * This is a global flag that determines if we're enforcing payments yet.
   * During beta, this should return false.
   */
  async isPaymentEnforcementEnabled(): Promise<boolean> {
    // Check if there's a feature flag for payment enforcement
    const { data } = await supabase
      .from('feature_flags')
      .select('is_enabled')
      .eq('feature_key', 'payment_enforcement')
      .single();

    // Default to false (not enforcing) if flag doesn't exist
    return data?.is_enabled === true;
  },
};
