import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../src/constants/theme';
import { useSubscription } from '../src/hooks/useSubscription';

const { width } = Dimensions.get('window');

const features = [
  { icon: 'bolt', text: 'AI Koç ile sınırsız sohbet', color: '#ff9500' },
  { icon: 'camera-alt', text: 'Sınırsız yemek analizi (Vision)', color: '#34c759' },
  { icon: 'fitness-center', text: 'Gelişmiş antrenman üretimi', color: '#5856d6' },
  { icon: 'watch', text: 'Health & Wearable Senkronizasyonu', color: '#007aff' },
  { icon: 'block', text: 'Tamamen Reklamsız Deneyim', color: '#ff3b30' },
];

export default function PaywallScreen() {
  const router = useRouter();
  const { tier, refreshStatus } = useSubscription();

  const handleSubscribe = async (tier: 'monthly' | 'yearly') => {
    // Logic for RevenueCat purchase would go here
    console.log(`Subscribing to ${tier} plan`);
    // In a real app: await SubscriptionService.purchasePackage(selectedPackage);
    // For demo, we'll just mock it or wait for user to finish.
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.badge}>
            <Text style={styles.badgeText}>ELITE ACCESS</Text>
          </View>
          
          <Text style={styles.title}>BeeFit Premium</Text>
          <Text style={styles.subtitle}>En iyi versiyonun seni bekliyor.</Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          {features.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={[styles.iconContainer, { backgroundColor: `${f.color}20` }]}>
                <MaterialIcons name={f.icon as any} size={22} color={f.color} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Pricing Options */}
        <View style={styles.plansContainer}>
          <TouchableOpacity style={styles.planCard} onPress={() => handleSubscribe('monthly')}>
            <View style={styles.planInfo}>
              <Text style={styles.planTitle}>Aylık</Text>
              <Text style={styles.planPrice}>₺199.99 / ay</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.planCard, styles.planCardActive]} onPress={() => handleSubscribe('yearly')}>
            <View style={styles.bestValueBadge}>
              <Text style={styles.bestValueText}>EN POPÜLER</Text>
            </View>
            <View style={styles.planInfo}>
              <Text style={[styles.planTitle, styles.planTitleActive]}>Yıllık</Text>
              <Text style={[styles.planPrice, styles.planPriceActive]}>₺1.499,99 / yıl</Text>
              <Text style={styles.savingsText}>2 ay bedava!</Text>
            </View>
            <MaterialIcons name="check-circle" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.footerNote}>Deneme süresi bittikten sonra seçili plan aktifleşecektir. İstediğin zaman iptal edebilirsin.</Text>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.subscribeButton} onPress={() => handleSubscribe('yearly')}>
          <Text style={styles.subscribeButtonText}>7 GÜNLÜK ÜCRETSİZ DENEME</Text>
        </TouchableOpacity>
        
        <View style={styles.legalLinks}>
          <TouchableOpacity><Text style={styles.legalText}>Kullanım Koşulları</Text></TouchableOpacity>
          <Text style={styles.legalSlash}>|</Text>
          <TouchableOpacity><Text style={styles.legalText}>Restore</Text></TouchableOpacity>
          <Text style={styles.legalSlash}>|</Text>
          <TouchableOpacity><Text style={styles.legalText}>Gizlilik Politikası</Text></TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // slate-900
  },
  scrollContent: {
    padding: 24,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  closeButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  badge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  badgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
  featuresContainer: {
    marginBottom: 40,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#f1f5f9',
    fontWeight: '500',
  },
  plansContainer: {
    gap: 16,
    marginBottom: 24,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  planCardActive: {
    backgroundColor: 'rgba(255, 149, 0, 0.05)',
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bestValueText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '800',
  },
  planInfo: {
    flex: 1,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  planTitleActive: {
    color: Colors.primary,
  },
  planPrice: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 2,
  },
  planPriceActive: {
    color: '#f8fafc',
  },
  savingsText: {
    fontSize: 12,
    color: '#34c759',
    fontWeight: '600',
    marginTop: 4,
  },
  footerNote: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  bottomActions: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  subscribeButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legalText: {
    fontSize: 11,
    color: '#64748b',
  },
  legalSlash: {
    color: '#334155',
    marginHorizontal: 8,
  },
  bottomAdPlaceholder: {
    height: 60,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
});
