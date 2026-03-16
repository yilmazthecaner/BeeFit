/**
 * Plan Screen (Nutrition) — Nutrition Vision + History
 * Matches Stitch "AI Nutrition Vision" & "Nutrition History"
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useNutritionStore } from '../../src/stores/useNutritionStore';
import { VisionAnalyzer } from '../../src/services/ai/visionAnalyzer';
import type { MealLog } from '../../src/types/nutrition';
import { useColorScheme } from '../../components/useColorScheme';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscription } from '../../src/hooks/useSubscription';
import { useRouter } from 'expo-router';

// Safe Ad Mob Import
let InterstitialAd: any = null;
let AdEventType: any = null;
let TestIds: any = null;
try {
  const Ads = require('react-native-google-mobile-ads');
  InterstitialAd = Ads.InterstitialAd;
  AdEventType = Ads.AdEventType;
  TestIds = Ads.TestIds;
} catch (e) {}

export default function NutritionScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = useMemo(() => createStyles(isDark), [isDark]);

  const { user } = useAuthStore();
  const { isPremium } = useSubscription();
  const router = useRouter();
  const { todaysMeals, isLoading: storeLoading, fetchTodaysMeals, getDailyTotals } = useNutritionStore();
  
  const adUnitId = (__DEV__ && TestIds) ? TestIds.INTERSTITIAL : 'ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx';
  const interstitial = useMemo(() => (InterstitialAd ? InterstitialAd.createForAdRequest(adUnitId, {
    requestNonPersonalizedAdsOnly: true,
  }) : null), [adUnitId]);

  useEffect(() => {
    if (!interstitial) return;
    const unsubscribe = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      // Ad loaded
    });
    interstitial.load();
    return unsubscribe;
  }, [interstitial]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingImageUri, setAnalyzingImageUri] = useState<string | null>(null);

  const dailyTotals = getDailyTotals();
  const targets = {
    calories: { consumed: dailyTotals.calories, target: user?.dailyCalorieTarget ?? 2200 },
    protein: { consumed: dailyTotals.protein, target: user?.dailyProteinG ?? 150 },
    carbs: { consumed: dailyTotals.carbs, target: user?.dailyCarbsG ?? 250 },
    fat: { consumed: dailyTotals.fat, target: user?.dailyFatG ?? 75 },
  };

  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (user?.id) fetchTodaysMeals(user.id, selectedDate);
  }, [user?.id, selectedDate]);

  const handlePrevDay = () => setSelectedDate(d => { const nd = new Date(d); nd.setDate(nd.getDate() - 1); return nd; });
  const handleNextDay = () => setSelectedDate(d => { const nd = new Date(d); nd.setDate(nd.getDate() + 1); return nd; });

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const navTitleText = isToday ? 'Today' : selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
  const navSubtitleText = selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const handleLogMeal = async () => {
    Alert.alert('Log a Meal', 'Add a photo or search for food', [
      { text: '📸 AI Nutrition Vision', onPress: openCamera },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Camera access is needed for AI Vision.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const imageUri = result.assets[0].uri;
    setAnalyzingImageUri(imageUri);
    setIsAnalyzing(true);

    try {
      if (user?.id) {
        const analyzer = new VisionAnalyzer(user.id);
        await analyzer.analyzeAndLogMeal(imageUri, 'lunch');
        await fetchTodaysMeals(user.id, selectedDate);
        Alert.alert('Meal Logged! 🐝', 'AI analyzed and logged your meal successfully.');
        
        // Show ad for free users after success
        if (!isPremium && interstitial?.loaded) {
          interstitial.show();
        }
      }
    } catch (error: any) {
      if (error.message?.includes('limit')) {
        router.push('/paywall' as any);
      } else {
        Alert.alert('Error', 'Could not analyze the meal. Please try again.');
      }
    } finally {
      setIsAnalyzing(false);
      setAnalyzingImageUri(null);
    }
  };

  const displayMeals = todaysMeals.length > 0
    ? todaysMeals.map((m: MealLog) => ({
        id: m.id,
        type: m.mealType.charAt(0).toUpperCase() + m.mealType.slice(1),
        time: new Date(m.loggedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        items: (m.items ?? []).map((i: { foodName: string }) => i.foodName).join(', ') || 'Meal logged',
        calories: m.totalCalories,
        protein: Math.round(m.totalProteinG),
        photoUrl: m.photoUrl,
        feedback: m.aiFeedback,
      }))
    : []; // Show empty timeline when there are no meals for selected day!

  const renderHeader = () => (
    <View style={styles.topNav}>
      <TouchableOpacity style={styles.navButton} onPress={handlePrevDay}>
        <MaterialIcons name="chevron-left" size={28} color={isDark ? '#cbd5e1' : '#334155'} />
      </TouchableOpacity>
      <View style={styles.navTitleContainer}>
        <Text style={styles.navTitle}>{navTitleText}</Text>
        <Text style={styles.navSubtitle}>{navSubtitleText}</Text>
      </View>
      <TouchableOpacity style={styles.navButton} onPress={handleNextDay} disabled={isToday}>
        <MaterialIcons name="chevron-right" size={28} color={isToday ? (isDark ? '#334155' : '#e2e8f0') : (isDark ? '#cbd5e1' : '#334155')} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Macro Summary Overview */}
        <View style={styles.overviewSection}>
          <View style={styles.circularProgressContainer}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreValue}>{targets.calories.target - targets.calories.consumed}</Text>
              <Text style={styles.scoreLabel}>CALS LEFT</Text>
            </View>
            <View style={styles.overviewLabels}>
              <View style={styles.overviewRow}>
                <MaterialIcons name="flag" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
                <Text style={styles.overviewText}>Target: {targets.calories.target}</Text>
              </View>
              <View style={styles.overviewRow}>
                <MaterialIcons name="local-fire-department" size={16} color="#ec5b13" />
                <Text style={styles.overviewText}>Eaten: {targets.calories.consumed}</Text>
              </View>
            </View>
          </View>

          <View style={styles.macrosGrid}>
            <MacroCard label="Protein" consumed={targets.protein.consumed} target={targets.protein.target} unit="g" color="#10b981" styles={styles} />
            <MacroCard label="Carbs" consumed={targets.carbs.consumed} target={targets.carbs.target} unit="g" color="#3b82f6" styles={styles} />
            <MacroCard label="Fat" consumed={targets.fat.consumed} target={targets.fat.target} unit="g" color="#f59e0b" styles={styles} />
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.timelineContainer}>
          {displayMeals.map((m, index) => (
            <View key={m.id} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <Text style={styles.timelineTime}>{m.time}</Text>
                <View style={[styles.timelineLine, index === displayMeals.length - 1 && styles.timelineLineLast]} />
                <View style={styles.timelineDot} />
              </View>
              <View style={styles.timelineRight}>
                <View style={styles.mealCard}>
                  <View style={styles.mealHeader}>
                    <Text style={styles.mealType}>{m.type}</Text>
                    <Text style={styles.mealCalories}>{m.calories} kcal</Text>
                  </View>
                  <Text style={styles.mealItems}>{m.items}</Text>
                  {m.photoUrl && (
                    <Image source={{ uri: m.photoUrl }} style={styles.mealImage} />
                  )}
                  {m.feedback && (
                    <View style={styles.feedbackRow}>
                      <MaterialIcons name="auto-awesome" size={16} color="#ec5b13" />
                      <Text style={styles.feedbackText}>{m.feedback}</Text>
                    </View>
                  )}
                  <View style={styles.macrosRow}>
                    <Text style={styles.macroTag}>P: {m.protein}g</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}

          {/* Dinner CTA */}
          <View style={styles.timelineItem}>
            <View style={styles.timelineLeft}>
              <View style={[styles.timelineDot, styles.timelineDotEmpty]} />
            </View>
            <View style={styles.timelineRight}>
              <TouchableOpacity
                style={styles.addMealButton}
                activeOpacity={0.8}
                onPress={handleLogMeal}
              >
                <MaterialIcons name="add" size={20} color="#ec5b13" />
                <Text style={styles.addMealText}>Log Dinner</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.9}
        onPress={handleLogMeal}
      >
        <MaterialIcons name="center-focus-strong" size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* AI Vision Modal overlay */}
      <Modal visible={isAnalyzing} transparent animationType="fade">
        <View style={styles.visionModalOverlay}>
          {analyzingImageUri && (
            <Image source={{ uri: analyzingImageUri }} style={StyleSheet.absoluteFillObject} blurRadius={10} />
          )}
          <View style={styles.visionModalOverlayBg} />
          
          <View style={styles.visionScannerBox}>
            <ActivityIndicator size="large" color="#ec5b13" style={{ marginBottom: 24 }} />
            <MaterialIcons name="auto-awesome" size={48} color="#ec5b13" />
            <Text style={styles.visionScanningTitle}>AI Vision Analysis</Text>
            <Text style={styles.visionScanningText}>Identifying food items and estimating macronutrients...</Text>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

function MacroCard({ label, consumed, target, unit, color, styles }: any) {
  const percent = Math.min((consumed / target) * 100, 100);
  return (
    <View style={styles.macroCard}>
      <Text style={styles.macroCardLabel}>{label}</Text>
      <View style={styles.macroTrack}>
        <View style={[styles.macroFill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.macroCardValue}>{consumed} / {target}{unit}</Text>
    </View>
  );
}

type Styles = ReturnType<typeof createStyles>;

const createStyles = (isDark: boolean) => {
  const bgMain = isDark ? '#221610' : '#f8f6f6';
  const textMain = isDark ? '#f1f5f9' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? 'rgba(15, 23, 42, 0.5)' : '#ffffff';
  const borderColor = isDark ? '#1e293b' : '#e2e8f0';
  const primary = '#ec5b13';

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bgMain },
    topNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: isDark ? 'rgba(34, 22, 16, 0.8)' : 'rgba(248, 246, 246, 0.8)',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(236, 91, 19, 0.1)',
    },
    navButton: { padding: 8 },
    navTitleContainer: { alignItems: 'center' },
    navTitle: { fontSize: 18, fontWeight: '700', color: textMain },
    navSubtitle: { fontSize: 12, color: primary, fontWeight: '600' },
    scroll: { paddingBottom: 120 },

    // Overview Section
    overviewSection: {
      padding: 24,
      backgroundColor: isDark ? 'rgba(34, 22, 16, 0.5)' : '#ffffff',
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    circularProgressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 32,
      marginBottom: 32,
    },
    scoreCircle: {
      width: 140,
      height: 140,
      borderRadius: 70,
      borderWidth: 8,
      borderColor: primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    scoreValue: {
      fontSize: 36,
      fontWeight: '800',
      color: textMain,
      letterSpacing: -1,
    },
    scoreLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: textMuted,
      letterSpacing: 1,
    },
    overviewLabels: { gap: 12 },
    overviewRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    overviewText: { fontSize: 14, fontWeight: '600', color: textMuted },
    macrosGrid: { flexDirection: 'row', gap: 12 },
    macroCard: {
      flex: 1,
      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
      padding: 12,
      borderRadius: 12,
    },
    macroCardLabel: { fontSize: 12, fontWeight: '600', color: textMuted, marginBottom: 8 },
    macroTrack: { height: 6, backgroundColor: isDark ? '#334155' : '#e2e8f0', borderRadius: 3, marginBottom: 8, overflow: 'hidden' },
    macroFill: { height: '100%', borderRadius: 3 },
    macroCardValue: { fontSize: 12, fontWeight: '700', color: textMain },

    // Timeline
    timelineContainer: { padding: 24 },
    timelineItem: { flexDirection: 'row', marginBottom: 24 },
    timelineLeft: { width: 60, alignItems: 'center' },
    timelineTime: { fontSize: 12, fontWeight: '600', color: textMuted, marginBottom: 8 },
    timelineDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: primary,
      position: 'absolute',
      top: 24,
      zIndex: 2,
    },
    timelineDotEmpty: { backgroundColor: isDark ? '#334155' : '#cbd5e1', top: 0 },
    timelineLine: { width: 2, backgroundColor: isDark ? '#334155' : '#e2e8f0', flex: 1, position: 'absolute', top: 32, bottom: -24, zIndex: 1 },
    timelineLineLast: { bottom: 0 },
    timelineRight: { flex: 1, paddingTop: 16 },
    
    mealCard: {
      backgroundColor: cardBg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: borderColor,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    mealType: { fontSize: 16, fontWeight: '700', color: textMain },
    mealCalories: { fontSize: 14, fontWeight: '600', color: primary },
    mealItems: { fontSize: 14, color: textMuted, marginBottom: 12 },
    mealImage: { width: '100%', height: 160, borderRadius: 12, marginBottom: 12 },
    feedbackRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(236,91,19,0.1)', padding: 12, borderRadius: 8, marginBottom: 12 },
    feedbackText: { flex: 1, fontSize: 13, color: textMain, lineHeight: 18 },
    macrosRow: { flexDirection: 'row', gap: 8 },
    macroTag: { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontSize: 12, fontWeight: '600', color: textMuted },

    // Add Meal
    addMealButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 16,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: isDark ? '#334155' : '#cbd5e1',
      borderRadius: 16,
    },
    addMealText: { fontSize: 16, fontWeight: '600', color: textMuted },

    // FAB
    fab: {
      position: 'absolute',
      bottom: 24,
      alignSelf: 'center',
      backgroundColor: primary,
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },

    // Vision Modal
    visionModalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    visionModalOverlayBg: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.7)',
    },
    visionScannerBox: {
      alignItems: 'center',
      padding: 32,
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderRadius: 24,
      borderWidth: 2,
      borderColor: primary,
      width: '80%',
      shadowColor: primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 24,
      elevation: 24,
    },
    visionScanningTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: isDark ? '#ffffff' : '#0f172a',
      marginTop: 24,
      marginBottom: 8,
    },
    visionScanningText: {
      fontSize: 14,
      color: isDark ? '#94a3b8' : '#64748b',
      textAlign: 'center',
      lineHeight: 22,
    },
  });
};
