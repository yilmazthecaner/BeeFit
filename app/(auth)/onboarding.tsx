/**
 * Onboarding Screen — Collect user fitness profile after sign-up
 *
 * Multi-step flow:
 * 1. Fitness goal (lose weight, build muscle, etc.)
 * 2. Body metrics (height, weight, gender)
 * 3. Activity level
 * → Auto-calculates daily macro targets
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore, type OnboardingData } from '../../src/stores/useAuthStore';
import { useColorScheme } from '../../components/useColorScheme';
import { MaterialIcons } from '@expo/vector-icons';

type Step = 'goal' | 'metrics' | 'activity';

const goals = [
  { key: 'lose_weight', title: 'Weight Loss', desc: 'Burn fat and optimize metabolism' },
  { key: 'build_muscle', title: 'Muscle Gain', desc: 'Build strength and muscle density' },
  { key: 'better_sleep', title: 'Better Sleep', desc: 'Improve recovery and sleep quality' },
  { key: 'longevity', title: 'Longevity', desc: 'Maintain long-term vital health' },
] as const;

const activityLevels = [
  { key: 'sedentary', emoji: '🪑', title: 'Sedentary', desc: 'Little or no exercise' },
  { key: 'light', emoji: '🚶', title: 'Light', desc: '1-3 days/week' },
  { key: 'moderate', emoji: '🏋️', title: 'Moderate', desc: '3-5 days/week' },
  { key: 'active', emoji: '⚡', title: 'Active', desc: '6-7 days/week' },
  { key: 'very_active', emoji: '🔥', title: 'Very Active', desc: 'Athlete level' },
] as const;

export default function OnboardingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = useMemo(() => createStyles(isDark), [isDark]);

  const [step, setStep] = useState<Step>('goal');
  const [data, setData] = useState<Partial<OnboardingData>>({ fitnessGoal: 'lose_weight' as any });
  const { completeOnboarding, isLoading } = useAuthStore();

  const [heightStr, setHeightStr] = useState('');
  const [weightStr, setWeightStr] = useState('');

  const handleGoalSelect = (goal: string) => {
    setData({ ...data, fitnessGoal: goal as any });
  };

  const currentGoal = data.fitnessGoal ?? 'lose_weight';

  const handleMetricsNext = () => {
    setData({
      ...data,
      heightCm: heightStr ? parseFloat(heightStr) : undefined,
      weightKg: weightStr ? parseFloat(weightStr) : undefined,
    });
    setStep('activity');
  };

  const handleActivitySelect = async (level: OnboardingData['activityLevel']) => {
    const finalData: OnboardingData = {
      ...data,
      activityLevel: level,
      fitnessGoal: data.fitnessGoal ?? 'general',
    };

    await completeOnboarding(finalData);
  };

  const renderTopNav = () => (
    <View style={styles.topNav}>
      <TouchableOpacity 
        style={styles.navBackButton} 
        onPress={() => step === 'activity' ? setStep('metrics') : step === 'metrics' ? setStep('goal') : null}
        disabled={step === 'goal'}
      >
        <MaterialIcons 
          name="arrow-back-ios" 
          size={20} 
          color={step === 'goal' ? 'transparent' : (isDark ? '#94a3b8' : '#475569')} 
          style={{marginLeft: 6}}
        />
      </TouchableOpacity>
      
      <View style={styles.navDots}>
        {['goal', 'metrics', 'activity'].map((s_step) => (
          <View
            key={s_step}
            style={[
              styles.navDot,
              s_step === step ? styles.navDotActive : undefined,
            ]}
          />
        ))}
      </View>
      <TouchableOpacity onPress={() => handleMetricsNext()}>
        <Text style={styles.navSkipText}>Skip</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderTopNav()}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {step === 'goal' && (
          <View style={styles.stepContainer}>
            <View style={styles.headerSection}>
              <View style={styles.headerIconWrapper}>
                <MaterialIcons name="gps-fixed" size={36} color="#ec5b13" />
              </View>
              <Text style={styles.headerTitle}>Define your focus</Text>
              <Text style={styles.headerSubtitle}>Choose your primary goal so our AI can tailor your daily wellness routine.</Text>
            </View>
            
            <View style={styles.goalsList}>
              {goals.map((g) => {
                const isSelected = currentGoal === g.key;
                return (
                  <TouchableOpacity
                    key={g.key}
                    style={[styles.goalCard, isSelected && styles.goalCardSelected]}
                    onPress={() => handleGoalSelect(g.key)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.goalTextWrapper}>
                      <Text style={styles.goalTitle}>{g.title}</Text>
                      <Text style={styles.goalDesc}>{g.desc}</Text>
                    </View>
                    <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.bottomSection}>
              <View style={styles.healthKitCard}>
                <View style={styles.healthKitRow}>
                  <View style={styles.healthKitIconWrapper}>
                    <MaterialIcons name="favorite" size={24} color="#f43f5e" />
                  </View>
                  <View style={styles.healthKitTextWrapper}>
                    <Text style={styles.healthKitTitle}>Apple HealthKit</Text>
                    <Text style={styles.healthKitDesc}>
                      Sync your steps, heart rate, and sleep automatically for 40% more accurate AI coaching.
                    </Text>
                    <TouchableOpacity style={styles.healthKitBtn}>
                      <Text style={styles.healthKitBtnText}>Enable Sync</Text>
                      <MaterialIcons name="open-in-new" size={16} color="#ec5b13" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.btnContinue} onPress={() => setStep('metrics')} activeOpacity={0.8}>
                 <Text style={styles.btnContinueText}>Continue</Text>
              </TouchableOpacity>

              <View style={styles.footerVisual}>
                <View style={styles.homeIndicator} />
              </View>
            </View>
          </View>
        )}

        {step === 'metrics' && (
          <View style={[styles.stepContainer, {flex: 1}]}>
            <View style={styles.headerSection}>
              <View style={styles.headerIconWrapper}>
                <MaterialIcons name="person" size={36} color="#ec5b13" />
              </View>
              <Text style={styles.headerTitle}>About you</Text>
              <Text style={styles.headerSubtitle}>This helps personalize your baseline measurements.</Text>
            </View>

            <View style={styles.formContainer}>
               <Text style={styles.fieldLabel}>Gender</Text>
               <View style={styles.genderRow}>
                 {(['male', 'female', 'other'] as const).map((g) => {
                   const isActive = data.gender === g;
                   return (
                     <TouchableOpacity
                       key={g}
                       style={[styles.genderBtn, isActive && styles.genderBtnActive]}
                       onPress={() => setData({ ...data, gender: g })}
                       activeOpacity={0.7}
                     >
                       <Text style={[styles.genderText, isActive && styles.genderTextActive]}>
                         {g === 'male' ? '♂ Male' : g === 'female' ? '♀ Female' : '⚧ Other'}
                       </Text>
                     </TouchableOpacity>
                   );
                 })}
               </View>

               <View style={styles.metricsRow}>
                 <View style={styles.metricField}>
                   <Text style={styles.fieldLabel}>Height (cm)</Text>
                   <TextInput
                     style={styles.metricInput}
                     value={heightStr}
                     onChangeText={setHeightStr}
                     placeholder="175"
                     placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                     keyboardType="decimal-pad"
                   />
                 </View>
                 <View style={styles.metricField}>
                   <Text style={styles.fieldLabel}>Weight (kg)</Text>
                   <TextInput
                     style={styles.metricInput}
                     value={weightStr}
                     onChangeText={setWeightStr}
                     placeholder="75"
                     placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                     keyboardType="decimal-pad"
                   />
                 </View>
               </View>
            </View>

            <View style={styles.bottomSection}>
              <TouchableOpacity style={styles.btnContinue} onPress={handleMetricsNext} activeOpacity={0.8}>
                 <Text style={styles.btnContinueText}>Continue</Text>
              </TouchableOpacity>
              <View style={styles.footerVisual}>
                <View style={styles.homeIndicator} />
              </View>
            </View>
          </View>
        )}

        {step === 'activity' && (
          <View style={[styles.stepContainer, {flex: 1}]}>
             <View style={styles.headerSection}>
               <View style={styles.headerIconWrapper}>
                 <MaterialIcons name="directions-run" size={36} color="#ec5b13" />
               </View>
               <Text style={styles.headerTitle}>Activity level?</Text>
               <Text style={styles.headerSubtitle}>How often do you exercise?</Text>
             </View>

             <View style={styles.goalsList}>
               {activityLevels.map((a) => {
                 const isSelected = data.activityLevel === a.key;
                 return (
                   <TouchableOpacity
                     key={a.key}
                     style={[styles.goalCard, isSelected && styles.goalCardSelected]}
                     onPress={() => handleActivitySelect(a.key)}
                     activeOpacity={0.7}
                     disabled={isLoading}
                   >
                     {isLoading && isSelected ? (
                       <ActivityIndicator color="#ec5b13" style={{alignSelf: 'center'}}/>
                     ) : (
                       <View style={styles.goalTextWrapper}>
                         <Text style={styles.goalTitle}>{a.emoji} {a.title}</Text>
                         <Text style={styles.goalDesc}>{a.desc}</Text>
                       </View>
                     )}
                     <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                       {isSelected && <View style={styles.radioInner} />}
                     </View>
                   </TouchableOpacity>
                 );
               })}
             </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) => {
  const bgMain = isDark ? '#221610' : '#f8f6f6';
  const textMain = isDark ? '#f1f5f9' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b'; // slate-400 / slate-500
  const cardBg = isDark ? 'rgba(15, 23, 42, 0.5)' : '#ffffff';
  const cardBorder = isDark ? '#1e293b' : '#e2e8f0'; // slate-800 / slate-200
  const primary = '#ec5b13';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bgMain,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 32,
      paddingBottom: 32,
    },
    topNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      marginBottom: 32,
      marginTop: 16,
    },
    navBackButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#1e293b' : '#e2e8f0', // slate-800 : slate-200
    },
    navDots: {
      flexDirection: 'row',
      gap: 6,
    },
    navDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: 'rgba(236, 91, 19, 0.2)',
    },
    navDotActive: {
      backgroundColor: primary,
    },
    navSkipText: {
      color: primary,
      fontWeight: '600',
      fontSize: 14,
    },
    stepContainer: {
      flex: 1,
      flexDirection: 'column',
    },
    headerSection: {
      alignItems: 'center',
      marginBottom: 40,
    },
    headerIconWrapper: {
      width: 64,
      height: 64,
      borderRadius: 16,
      backgroundColor: 'rgba(236, 91, 19, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    headerTitle: {
      fontSize: 30,
      fontWeight: '700',
      color: textMain,
      letterSpacing: -0.5,
      marginBottom: 12,
      textAlign: 'center',
    },
    headerSubtitle: {
      fontSize: 18,
      color: textMuted,
      textAlign: 'center',
      lineHeight: 28,
    },
    goalsList: {
      flexDirection: 'column',
      gap: 16,
      marginBottom: 40,
    },
    goalCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: cardBorder,
      backgroundColor: cardBg,
    },
    goalCardSelected: {
      borderColor: 'rgba(236, 91, 19, 0.5)',
    },
    goalTextWrapper: {
      flex: 1,
      flexDirection: 'column',
    },
    goalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: textMain,
    },
    goalDesc: {
      fontSize: 14,
      color: textMuted,
      marginTop: 2,
    },
    radioOuter: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: isDark ? '#334155' : '#cbd5e1', // slate-700 / slate-300
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioOuterSelected: {
      borderColor: primary,
      backgroundColor: primary,
    },
    radioInner: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#ffffff',
    },
    bottomSection: {
      marginTop: 'auto',
    },
    healthKitCard: {
      padding: 24,
      borderRadius: 24,
      backgroundColor: 'rgba(236, 91, 19, 0.05)',
      borderWidth: 1,
      borderColor: 'rgba(236, 91, 19, 0.1)',
      marginBottom: 32,
    },
    healthKitRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 16,
    },
    healthKitIconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 2,
      shadowOffset: { width: 0, height: 1 },
      elevation: 2,
    },
    healthKitTextWrapper: {
      flex: 1,
    },
    healthKitTitle: {
      fontWeight: '700',
      color: textMain,
      fontSize: 16,
    },
    healthKitDesc: {
      fontSize: 14,
      color: textMuted,
      marginTop: 4,
      lineHeight: 20,
    },
    healthKitBtn: {
      marginTop: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    healthKitBtnText: {
      color: primary,
      fontWeight: '700',
      fontSize: 14,
    },
    btnContinue: {
      width: '100%',
      backgroundColor: primary,
      paddingVertical: 20,
      borderRadius: 16,
      alignItems: 'center',
      shadowColor: primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    btnContinueText: {
      color: '#ffffff',
      fontWeight: '700',
      fontSize: 18,
    },
    footerVisual: {
      marginTop: 32,
      alignItems: 'center',
      opacity: 0.3,
    },
    homeIndicator: {
      width: 128,
      height: 4,
      backgroundColor: isDark ? '#334155' : '#cbd5e1', // slate-700 / slate-300
      borderRadius: 2,
    },
    formContainer: {
      flexDirection: 'column',
      gap: 24,
      marginBottom: 32,
    },
    fieldLabel: {
      fontSize: 14,
      color: textMuted,
      fontWeight: '600',
      marginBottom: 8,
    },
    genderRow: {
      flexDirection: 'row',
      gap: 12,
    },
    genderBtn: {
      flex: 1,
      backgroundColor: cardBg,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: cardBorder,
    },
    genderBtnActive: {
      borderColor: primary,
      backgroundColor: 'rgba(236, 91, 19, 0.1)',
    },
    genderText: {
      fontSize: 16,
      color: textMuted,
      fontWeight: '500',
    },
    genderTextActive: {
      color: primary,
      fontWeight: '600',
    },
    metricsRow: {
      flexDirection: 'row',
      gap: 16,
    },
    metricField: {
      flex: 1,
    },
    metricInput: {
      backgroundColor: cardBg,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 16,
      fontSize: 20,
      fontWeight: '600',
      color: textMain,
      textAlign: 'center',
      borderWidth: 2,
      borderColor: cardBorder,
    },
  });
};

