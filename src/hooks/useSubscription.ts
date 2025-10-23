import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { subscriptionService, type UserSubscription, type FeatureAccess } from '../services/subscriptionService';

/**
 * React hook for managing user subscriptions and feature access
 *
 * Usage:
 * ```tsx
 * const { subscription, hasFeatureAccess, checkFeature, isLoading } = useSubscription();
 *
 * // Check if user can use AI blueprint analysis
 * const canAnalyze = await checkFeature('ai_blueprint_analysis');
 * if (canAnalyze.hasAccess) {
 *   // Proceed with analysis
 * } else {
 *   // Show upgrade prompt
 *   alert(canAnalyze.reason);
 * }
 * ```
 */
export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user subscription on mount
  useEffect(() => {
    if (user) {
      loadSubscription();
    } else {
      setSubscription(null);
      setIsLoading(false);
    }
  }, [user]);

  const loadSubscription = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const sub = await subscriptionService.getUserSubscription(user.id);
      setSubscription(sub);
      setError(null);
    } catch (err) {
      console.error('Error loading subscription:', err);
      setError('Failed to load subscription');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check if user has access to a specific feature
   */
  const checkFeature = async (featureKey: string): Promise<FeatureAccess> => {
    if (!user) {
      return {
        hasAccess: false,
        reason: 'Please sign in to access this feature',
      };
    }

    return await subscriptionService.checkFeatureAccess(user.id, featureKey);
  };

  /**
   * Check if user is a beta tester
   */
  const isBetaTester = subscription?.is_beta_tester || subscription?.tier === 'beta_tester';

  /**
   * Check if user is in grace period
   */
  const isInGracePeriod =
    subscription?.grace_period_ends_at &&
    new Date(subscription.grace_period_ends_at) > new Date();

  /**
   * Check if user has an active paid subscription
   */
  const hasPaidSubscription =
    subscription?.tier &&
    ['basic', 'professional', 'enterprise'].includes(subscription.tier) &&
    ['active', 'trialing'].includes(subscription.status);

  /**
   * Get user's current tier display name
   */
  const tierDisplayName = subscription?.tier
    ? subscription.tier
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : 'Free';

  /**
   * Check if user is within usage limits
   */
  const checkUsageLimits = async () => {
    if (!user) return null;
    return await subscriptionService.checkUsageLimits(user.id);
  };

  return {
    subscription,
    isLoading,
    error,
    isBetaTester,
    isInGracePeriod,
    hasPaidSubscription,
    tierDisplayName,
    checkFeature,
    checkUsageLimits,
    refetch: loadSubscription,
  };
}

/**
 * Hook to check a specific feature access
 *
 * Usage:
 * ```tsx
 * const { hasAccess, isLoading, reason } = useFeatureAccess('ai_blueprint_analysis');
 *
 * if (isLoading) return <Spinner />;
 * if (!hasAccess) return <UpgradePrompt reason={reason} />;
 *
 * return <BlueprintAnalysisButton />;
 * ```
 */
export function useFeatureAccess(featureKey: string) {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(true); // Default to true during beta
  const [isLoading, setIsLoading] = useState(true);
  const [reason, setReason] = useState<string | undefined>();
  const [upgradeRequired, setUpgradeRequired] = useState<string | undefined>();

  useEffect(() => {
    if (user) {
      checkAccess();
    } else {
      setHasAccess(false);
      setReason('Please sign in to access this feature');
      setIsLoading(false);
    }
  }, [user, featureKey]);

  const checkAccess = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const access = await subscriptionService.checkFeatureAccess(user.id, featureKey);
      setHasAccess(access.hasAccess);
      setReason(access.reason);
      setUpgradeRequired(access.upgradeRequired);
    } catch (err) {
      console.error('Error checking feature access:', err);
      // Fail open during beta
      setHasAccess(true);
      setReason('Beta period - access granted by default');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    hasAccess,
    isLoading,
    reason,
    upgradeRequired,
    refetch: checkAccess,
  };
}
