import Purchases, { PurchasesEntitlementInfo, LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';
import { supabase } from './supabase/client';

const API_KEYS = {
  apple: 'goog_dummy_api_key_ios', // Replace with real RevenueCat API keys
  google: 'goog_dummy_api_key_android',
};

export type SubscriptionTier = 'free' | 'premium' | 'trialing';

export class SubscriptionService {
  static async initialize(userId: string) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    if (Platform.OS === 'ios') {
      Purchases.configure({ apiKey: API_KEYS.apple, appUserID: userId });
    } else if (Platform.OS === 'android') {
      Purchases.configure({ apiKey: API_KEYS.google, appUserID: userId });
    }
  }

  static async getSubscriptionStatus(): Promise<SubscriptionTier> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      if (customerInfo.entitlements.active['Premium'] !== undefined) {
        return 'premium';
      }

      // If not premium, check Supabase for trial status
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return 'free';

      const { data: profile } = await supabase
        .from('users')
        .select('subscription_status, trial_ends_at')
        .eq('id', user.user.id)
        .single();

      if (profile?.subscription_status === 'premium') return 'premium';
      if (profile?.subscription_status === 'trialing') {
         // Double check date
         const now = new Date();
         const trialEnds = new Date(profile.trial_ends_at);
         if (trialEnds > now) return 'trialing';
         
         // If expired, update to free in background
         await supabase.from('users').update({ subscription_status: 'free' }).eq('id', user.user.id);
         return 'free';
      }

      return 'free';
    } catch (e) {
      console.error('Error fetching subscription status', e);
      return 'free';
    }
  }

  static async purchasePackage(pkg: any) {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      if (customerInfo.entitlements.active['Premium'] !== undefined) {
        // Update Supabase
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('users').update({ subscription_status: 'premium' }).eq('id', user.id);
        }
        return true;
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        throw e;
      }
    }
    return false;
  }

  static async restorePurchases() {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo.entitlements.active['Premium'] !== undefined;
  }
}
