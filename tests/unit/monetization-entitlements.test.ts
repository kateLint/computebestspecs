import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hasEntitlement, getEntitlementsState, recordPremiumFeatureInterest } from '@/lib/monetization/entitlements';
import { analytics } from '@/lib/observability/analytics/client';

vi.mock('@/lib/observability/analytics/client', () => ({
  analytics: {
    track: vi.fn(),
  },
}));

describe('Monetization Entitlements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('defaults all premium feature entitlements to false in current configuration', () => {
    expect(hasEntitlement('detailed_export')).toBe(false);
    expect(hasEntitlement('saved_comparisons')).toBe(false);
    expect(hasEntitlement('price_alerts')).toBe(false);
    expect(hasEntitlement('team_workspace')).toBe(false);
    expect(hasEntitlement('advanced_local_ai')).toBe(false);
    expect(hasEntitlement('api_access')).toBe(false);
  });

  it('returns safe fallback state from getEntitlementsState', () => {
    const state = getEntitlementsState();
    expect(state.tier).toBe('free');
    expect(state.features.detailed_export).toBe(false);
    expect(state.features.api_access).toBe(false);
  });

  it('emits premium_feature_interest_recorded event when user expresses interest', () => {
    recordPremiumFeatureInterest('detailed_export');
    expect(analytics.track).toHaveBeenCalledWith('premium_feature_interest_recorded', {
      featureName: 'detailed_export',
    });
  });
});
