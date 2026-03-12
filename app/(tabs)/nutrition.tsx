/**
 * Nutrition Screen — Live with camera and stores
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../src/constants/theme';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useNutritionStore } from '../../src/stores/useNutritionStore';
import { VisionAnalyzer } from '../../src/services/ai/visionAnalyzer';
import type { MealLog } from '../../src/types/nutrition';
import { useColorScheme } from '../../components/useColorScheme';

export default function NutritionScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme];
  const styles = useMemo(() => createStyles(palette), [palette]);

  const { user } = useAuthStore();
  const { todaysMeals, isLoading: storeLoading, fetchTodaysMeals, getDailyTotals } = useNutritionStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const dailyTotals = getDailyTotals();
  const targets = {
    calories: { consumed: dailyTotals.calories, target: user?.dailyCalorieTarget ?? 2200 },
    protein: { consumed: dailyTotals.protein, target: user?.dailyProteinG ?? 150 },
    carbs: { consumed: dailyTotals.carbs, target: user?.dailyCarbsG ?? 250 },
    fat: { consumed: dailyTotals.fat, target: user?.dailyFatG ?? 75 },
  };

  useEffect(() => {
    if (user?.id) fetchTodaysMeals(user.id);
  }, [user?.id]);

  const handleLogMeal = async () => {
    const mealType = await new Promise<string | null>((resolve) => {
      Alert.alert('Log a Meal', 'Choose meal type:', [
        { text: 'Breakfast', onPress: () => resolve('breakfast') },
        { text: 'Lunch', onPress: () => resolve('lunch') },
        { text: 'Dinner', onPress: () => resolve('dinner') },
        { text: 'Snack', onPress: () => resolve('snack') },
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
      ]);
    });

    if (!mealType) return;

    // Ask for photo source
    const source = await new Promise<'camera' | 'library' | null>((resolve) => {
      Alert.alert('Add Photo', 'How would you like to add your meal photo?', [
        { text: '📸 Take Photo', onPress: () => resolve('camera') },
        { text: '🖼️ Choose from Library', onPress: () => resolve('library') },
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
      ]);
    });

    if (!source) return;

    try {
      let result: ImagePicker.ImagePickerResult;

      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Required', 'Camera access is needed to take meal photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Required', 'Photo library access is needed.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      }

      if (result.canceled || !result.assets[0]) return;

      const imageUri = result.assets[0].uri;
      setIsAnalyzing(true);

      if (user?.id) {
        const analyzer = new VisionAnalyzer(user.id);
        await analyzer.analyzeAndLogMeal(
          imageUri,
          mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack'
        );

        // Refresh meals
        await fetchTodaysMeals(user.id);
        Alert.alert('Meal Logged! 🐝', 'Your meal has been analyzed and logged successfully.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not analyze the meal. Please try again.');
      console.error('Meal analysis error:', error);
    } finally {
      setIsAnalyzing(false);
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
    : [
        { id: '1', type: 'Breakfast', time: '8:30 AM', items: 'Oatmeal, banana, almond butter', calories: 520, protein: 18, photoUrl: null, feedback: 'Great fiber-rich start!' },
        { id: '2', type: 'Lunch', time: '12:45 PM', items: 'Grilled chicken salad', calories: 580, protein: 45, photoUrl: null, feedback: 'Excellent protein!' },
      ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Macro Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily Nutrition</Text>
          <View style={styles.calorieRow}>
            <Text style={styles.calorieVal}>{targets.calories.consumed}</Text>
            <Text style={styles.calorieTarget}> / {targets.calories.target} kcal</Text>
          </View>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${Math.min((targets.calories.consumed / targets.calories.target) * 100, 100)}%`, backgroundColor: Colors.ringMove }]} />
          </View>
          <Text style={styles.remaining}>{Math.max(targets.calories.target - targets.calories.consumed, 0)} kcal remaining</Text>

          <View style={styles.macroRow}>
            <MacroBar label="Protein" val={targets.protein.consumed} max={targets.protein.target} color={Colors.systemBlue} styles={styles} />
            <MacroBar label="Carbs" val={targets.carbs.consumed} max={targets.carbs.target} color={Colors.systemOrange} styles={styles} />
            <MacroBar label="Fat" val={targets.fat.consumed} max={targets.fat.target} color={Colors.systemPurple} styles={styles} />
          </View>
        </View>

        {/* Log Meal CTA */}
        <TouchableOpacity
          style={[styles.ctaBtn, isAnalyzing && { opacity: 0.7 }]}
          onPress={handleLogMeal}
          activeOpacity={0.8}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <ActivityIndicator color="#FFF" size="small" />
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Text style={styles.ctaTitle}>Analyzing Meal...</Text>
                <Text style={styles.ctaSub}>AI is identifying your food</Text>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.ctaIcon}>📸</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.ctaTitle}>Log a Meal</Text>
                <Text style={styles.ctaSub}>Snap a photo — AI identifies food & calories</Text>
              </View>
              <Text style={styles.ctaArrow}>→</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Meal Timeline */}
        <Text style={styles.sectionTitle}>Today's Meals</Text>
        {displayMeals.map((m) => (
          <View key={m.id} style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <View style={styles.badge}><Text style={styles.badgeText}>{m.type}</Text></View>
              <Text style={styles.mealTime}>{m.time}</Text>
            </View>
            {m.photoUrl && (
              <Image source={{ uri: m.photoUrl }} style={styles.mealPhoto} resizeMode="cover" />
            )}
            <Text style={styles.mealItems}>{m.items}</Text>
            <View style={styles.mealStats}>
              <Text style={styles.statVal}>{m.calories} <Text style={styles.statLabel}>kcal</Text></Text>
              <View style={styles.divider} />
              <Text style={styles.statVal}>{m.protein}g <Text style={styles.statLabel}>protein</Text></Text>
            </View>
            {m.feedback && (
              <View style={styles.feedback}>
                <Text style={{ fontSize: 14 }}>🐝</Text>
                <Text style={styles.feedbackText}>{m.feedback}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function MacroBar({ label, val, max, color, styles }: { label: string; val: number; max: number; color: string; styles: Styles }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.macroLabel}>{label}</Text>
      <View style={styles.macroBarBg}>
        <View style={[styles.macroBarFill, { width: `${Math.min((val / max) * 100, 100)}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.macroVal}>{val}/{max}g</Text>
    </View>
  );
}

type Palette = typeof Colors.light;
type Styles = ReturnType<typeof createStyles>;

const createStyles = (palette: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.groupedBackground },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  card: { backgroundColor: palette.surfaceElevated, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.md },
  cardTitle: { ...Typography.headline, color: palette.text, marginBottom: Spacing.md },
  calorieRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: Spacing.sm },
  calorieVal: { fontSize: 36, fontWeight: '700', color: palette.text },
  calorieTarget: { ...Typography.body, color: palette.textSecondary },
  barBg: { height: 8, backgroundColor: palette.fill, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  remaining: { ...Typography.caption1, color: palette.textSecondary, marginTop: Spacing.xs, marginBottom: Spacing.lg },
  macroRow: { flexDirection: 'row', gap: Spacing.md },
  macroLabel: { ...Typography.caption2, color: palette.textSecondary, fontWeight: '600', marginBottom: 4 },
  macroBarBg: { height: 6, backgroundColor: palette.fill, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  macroBarFill: { height: '100%', borderRadius: 3 },
  macroVal: { ...Typography.caption2, color: palette.text, fontWeight: '600' },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadows.md },
  ctaIcon: { fontSize: 28, marginRight: Spacing.md },
  ctaTitle: { ...Typography.headline, color: '#FFF' },
  ctaSub: { ...Typography.caption1, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  ctaArrow: { fontSize: 20, color: '#FFF', fontWeight: '700' },
  sectionTitle: { ...Typography.headline, color: palette.text, marginBottom: Spacing.md },
  mealCard: { backgroundColor: palette.surfaceElevated, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.sm },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  badge: { backgroundColor: Colors.primary + '15', paddingHorizontal: 10, paddingVertical: 3, borderRadius: BorderRadius.full },
  badgeText: { ...Typography.caption1, color: Colors.primary, fontWeight: '600' },
  mealTime: { ...Typography.caption1, color: palette.textSecondary },
  mealPhoto: { width: '100%', height: 180, borderRadius: BorderRadius.md, marginBottom: Spacing.sm },
  mealItems: { ...Typography.body, color: palette.text, marginBottom: Spacing.sm },
  mealStats: { flexDirection: 'row', alignItems: 'center', paddingTop: Spacing.sm, borderTopWidth: 0.5, borderTopColor: palette.separator },
  statVal: { ...Typography.headline, color: palette.text },
  statLabel: { ...Typography.caption1, color: palette.textSecondary, fontWeight: '400' },
  divider: { width: 1, height: 16, backgroundColor: palette.separator, marginHorizontal: Spacing.md },
  feedback: { flexDirection: 'row', backgroundColor: Colors.primary + '08', borderRadius: BorderRadius.md, padding: Spacing.sm, marginTop: Spacing.sm, gap: Spacing.sm },
  feedbackText: { ...Typography.footnote, color: palette.textSecondary, flex: 1, lineHeight: 18 },
});
