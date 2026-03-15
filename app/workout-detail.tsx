/**
 * Workout Detail Screen — Matches Stitch "Workout Detail" design
 *
 * Shows:
 * - Hero image with gradient overlay
 * - Title, metadata (duration, intensity, type)
 * - Description
 * - Exercise list with images
 * - Start Workout CTA
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '../components/useColorScheme';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// Default exercise data for the workout detail
const workoutData = {
  title: 'Morning Yoga Flow',
  duration: '25 mins',
  intensity: 'Low Intensity',
  type: 'Recovery',
  description:
    'A gentle sequence designed to wake up your body, improve flexibility, and center your mind for the day ahead. Perfect for all skill levels.',
  heroImage:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD_uzcJQhNaKBCUpTjiBrOQCZD5iLKai4BGWAG01T28JXOEMRxB5KjPfdcSBZxOTa-vNoTBoychr1M-p6FQyykiWt9UNCoI6Dqn5CbW5A3G1tWuOd54tiblJJTAW6OJeF5k8w5WfXzPk1uQ71B7Zo_Kt7zoY6B_E5VWZCzXoGMkuRuG1-ocua0Vd2lgDLus3B5StzXy5xNrodXbqXkKYDUHpBdXNVPDpYhFJxNfotl0fqb8qEafaPnykWMLbPsd0-c7M1IEo8qDfO_j',
  exercises: [
    {
      id: '1',
      name: "Child's Pose",
      detail: 'Warm-up • 2 minutes',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBuEZvRy9NYv16umVEKhQzwHfHO1mPXdm9Y_3fcYknYWGhgQCdG8rf9dyubng8KZp7X1mMuq7V22zquO3JS7sMxw1BU2ysIvRg5XwHzKgl2Tg45NQlAtQUV3R_PQmDLj96GH7_y35F5VKHACljWxE8WmPsig0jn7a49QLL7n8zNasRAycTz3ai_O_gY046xCpJs7XkDeaC369UMjhLw-wA1hornk6BCao73U3wxopdeD_tB0nnTs-SStQLjyRgICsrAxUW251YGXzMZ',
    },
    {
      id: '2',
      name: 'Cat-Cow Stretch',
      detail: 'Spine Mobility • 10 Reps',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuABBGZNIshbB55X6I56egf1WmsyUuB4zZCsUOLjqBdcwbDRuE1B71yxIZnAkXzR6bEdiSVvW1nfJX38GIDNGPuCHZOUz3rZoUZwwyDLP4dE-WbXbA5GScEGEhGTimdi9OHV1BPtx0FzIzjDbt1Mz_cPNh0r-fu2D6NhyGzyebs9k7VNhNH1Iz_vAEz0ZyGHce62pwlK-hoLtD-pvl1yZf1j9akNPn65AVVZbzIC9FFs2PzMa_AEbdR5fQZrctzFTcHAhn43viYov-ND',
    },
    {
      id: '3',
      name: 'Downward Facing Dog',
      detail: 'Full Body Stretch • 1.5 minutes',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDLrxkZGkHVAlHI9zgTqPLM-0Dw4-IhNhfCDaxbivPpYH0qPkaawx4qlrNDQaQKGFks3xE9QbSicte5RJOOywAtoJYDj-cKqaGaX84lXStMvvAi9DBACFfjgayn1ywDG613DZON23qZPed9njhreIxg1tW1Pluua5yiujydPoL4UPrPpR6JI6n_iqnV2LRWaY9_ILvYeI_x-qsBbM53QJjrLmPEbUgZ9pIzIFNWHEVIwFPT3_sfphgNL22EXHt78-ka4xwRAlx8uA0z',
    },
    {
      id: '4',
      name: 'Warrior I',
      detail: 'Strength • 1 minute each side',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAiu52NXEHP8JtnFdPjRrkfTt8x1XLTdga0l4C5lrSsYtuMRdAV8zGuL2tcaTrP5hPAR2XQzWzJpkO2GLYTIPf30J2qazW2y_ZYFStoBQIX3aQRIdHSsBS5KT-2gNZOqhR5DgEddYx1piPeIxEqeVmegF4G18VMuX25HJyHd04Hz-JXlIf1OXys8iVo0oul2UZdmR9TgQaM1OvrjwOGijhlJx0IRmu6t2h-yHqsyrOG02e01Qc_zp1BATag-YS9-Tqvr1tnxbGEIErY',
    },
    {
      id: '5',
      name: 'Sun Salutations',
      detail: 'Flow • 5 rounds',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDxeYn5QxalgFYh-nHlXdw63JPE_AH4rP1bmsKLxQLjKh3ZVpveC-991i9rDrZ8eXTkNiqZHiR7Z17OCu1RqgBPiaxOgIT8x_DaR2tTpUTxfGtOqBlgHunL9nj6pc3SCZPwi1SOfP5RK0EyZwDph5qTCPoa2SOjjMbCxfwYmf7FgPApKcsBs6qojZBgkllMiQRS1UdTQfA_T364bj9IeqSFRxHFfh5KoOOeWXYV88-OVmaf_yRk_w5dneeWlELXjsYCO1dR95OPx0bf',
    },
  ],
};

export default function WorkoutDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = useMemo(() => createStyles(isDark), [isDark]);
  const router = useRouter();
  const params = useLocalSearchParams<{ title?: string }>();

  const title = params.title || workoutData.title;

  const handleStartWorkout = () => {
    Alert.alert('🏋️ Workout Started!', `${title} has begun. Good luck!`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => router.back()}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={isDark ? '#cbd5e1' : '#334155'}
          />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Workout Details</Text>
        <TouchableOpacity style={styles.navButton}>
          <MaterialIcons
            name="share"
            size={24}
            color={isDark ? '#cbd5e1' : '#334155'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: workoutData.heroImage }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
          <View style={styles.heroBadge}>
            <MaterialIcons name="bolt" size={14} color="#ffffff" />
            <Text style={styles.heroBadgeText}>NEW WORKOUT</Text>
          </View>
        </View>

        {/* Title and Meta */}
        <View style={styles.titleSection}>
          <Text style={styles.workoutTitle}>{title}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MaterialIcons name="schedule" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
              <Text style={styles.metaText}>{workoutData.duration}</Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialIcons name="fitness-center" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
              <Text style={styles.metaText}>{workoutData.intensity}</Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialIcons name="self-improvement" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
              <Text style={styles.metaText}>{workoutData.type}</Text>
            </View>
          </View>
          <Text style={styles.descriptionText}>{workoutData.description}</Text>
        </View>

        {/* Exercise List */}
        <View style={styles.exerciseSection}>
          <View style={styles.exerciseHeader}>
            <MaterialIcons name="format-list-bulleted" size={22} color="#ec5b13" />
            <Text style={styles.exerciseHeaderText}>
              Routine ({workoutData.exercises.length} Exercises)
            </Text>
          </View>

          {workoutData.exercises.map((exercise) => (
            <TouchableOpacity key={exercise.id} style={styles.exerciseCard} activeOpacity={0.7}>
              <View style={styles.exerciseImageWrapper}>
                <Image source={{ uri: exercise.image }} style={styles.exerciseImage} />
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseDetail}>{exercise.detail}</Text>
              </View>
              <MaterialIcons name="play-circle-outline" size={24} color={isDark ? '#64748b' : '#94a3b8'} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Fixed Start Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.startButton}
          activeOpacity={0.8}
          onPress={handleStartWorkout}
        >
          <MaterialIcons name="play-arrow" size={24} color="#ffffff" />
          <Text style={styles.startButtonText}>Start Workout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) => {
  const bgMain = isDark ? '#221610' : '#f8f6f6';
  const textMain = isDark ? '#f1f5f9' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? 'rgba(15, 23, 42, 0.4)' : '#ffffff';
  const borderColor = isDark ? '#1e293b' : '#f1f5f9';
  const primary = '#ec5b13';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bgMain,
    },
    topNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: isDark ? 'rgba(34, 22, 16, 0.8)' : 'rgba(248, 246, 246, 0.8)',
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    navButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: textMain,
      flex: 1,
      textAlign: 'center',
    },
    scrollContent: {
      paddingBottom: 120,
    },

    // Hero
    heroContainer: {
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 12,
      overflow: 'hidden',
      height: 200,
      position: 'relative',
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    heroOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    heroBadge: {
      position: 'absolute',
      bottom: 16,
      left: 16,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: primary,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 9999,
      gap: 4,
    },
    heroBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#ffffff',
      letterSpacing: 1,
    },

    // Title Section
    titleSection: {
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    workoutTitle: {
      fontSize: 30,
      fontWeight: '800',
      color: textMain,
      letterSpacing: -0.5,
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
      marginTop: 12,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    metaText: {
      fontSize: 14,
      fontWeight: '500',
      color: textMuted,
    },
    descriptionText: {
      marginTop: 20,
      fontSize: 15,
      color: isDark ? '#cbd5e1' : '#475569',
      lineHeight: 24,
    },

    // Exercise Section
    exerciseSection: {
      marginTop: 32,
      paddingHorizontal: 16,
    },
    exerciseHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
    },
    exerciseHeaderText: {
      fontSize: 20,
      fontWeight: '700',
      color: textMain,
    },
    exerciseCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      padding: 12,
      backgroundColor: cardBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: borderColor,
      marginBottom: 16,
    },
    exerciseImageWrapper: {
      width: 80,
      height: 80,
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
    },
    exerciseImage: {
      width: '100%',
      height: '100%',
    },
    exerciseInfo: {
      flex: 1,
    },
    exerciseName: {
      fontSize: 16,
      fontWeight: '700',
      color: textMain,
    },
    exerciseDetail: {
      fontSize: 14,
      color: textMuted,
      marginTop: 2,
    },

    // Bottom Bar
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 24,
      paddingBottom: 40,
      paddingTop: 16,
      backgroundColor: bgMain,
    },
    startButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: primary,
      paddingVertical: 16,
      borderRadius: 12,
      gap: 8,
      shadowColor: primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    startButtonText: {
      fontSize: 18,
      fontWeight: '700',
      color: '#ffffff',
    },
  });
};
