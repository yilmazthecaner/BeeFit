import { useState, useEffect } from 'react';
import { SubscriptionService, SubscriptionTier } from '../services/subscription';
import { supabase } from '../services/supabase/client';

export function useSubscription() {
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [loading, setLoading] = useState(true);

  const refreshStatus = async () => {
    const status = await SubscriptionService.getSubscriptionStatus();
    setTier(status);
    setLoading(false);
  };

  useEffect(() => {
    // Initial fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        SubscriptionService.initialize(session.user.id);
        refreshStatus();
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        SubscriptionService.initialize(session.user.id);
        refreshStatus();
      } else {
        setTier('free');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const isPremium = tier === 'premium' || tier === 'trialing';

  return { tier, isPremium, loading, refreshStatus };
}
