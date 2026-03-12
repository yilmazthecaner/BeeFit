/**
 * Home / AI Coach Screen — Wired to live stores and services
 */

import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../src/constants/theme';
import { useNutritionStore } from '../../src/stores/useNutritionStore';
import { useAuthStore } from '../../src/stores/useAuthStore';
import CoachContextManager from '../../src/services/ai/coachContextManager';
import { useColorScheme } from '../../components/useColorScheme';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function CoachScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme];
  const styles = useMemo(() => createStyles(palette), [palette]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Good morning! 🐝 I'm your BeeFit Coach. I can help you with workout plans, nutrition advice, and tracking your fitness goals. What would you like to focus on today?",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const { user } = useAuthStore();
  const { getDailyTotals } = useNutritionStore();
  const dailyTotals = getDailyTotals();

  const suggestions = [
    "What's my workout for today?",
    'How am I doing on my goals?',
    'Suggest a healthy meal',
  ];

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text ?? inputText.trim();
    if (!messageText) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      if (user?.id) {
        const manager = new CoachContextManager(user.id);
        const response = await manager.sendMessage(messageText);
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        // Fallback for when not connected
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: getFallbackResponse(messageText),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      const errMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Let me try again in a moment. 🐝",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Daily Summary Card */}
          <DailySummaryCard
            caloriesConsumed={dailyTotals.calories}
            caloriesTarget={user?.dailyCalorieTarget ?? 2200}
            exerciseMin={0}
            exerciseTarget={60}
            proteinConsumed={dailyTotals.protein}
            proteinTarget={user?.dailyProteinG ?? 150}
            styles={styles}
          />

          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} styles={styles} />
          ))}

          {isLoading && (
            <View style={styles.loadingBubble}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          )}

          {!isLoading && messages.length <= 2 && (
            <View style={styles.suggestionsContainer}>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => handleSend(suggestion)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask your coach..."
              placeholderTextColor={palette.textSecondary}
              multiline
              maxLength={500}
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={() => handleSend()}
              disabled={!inputText.trim() || isLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.sendButtonText}>↑</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Sub-Components ──

function DailySummaryCard({
  caloriesConsumed, caloriesTarget,
  exerciseMin, exerciseTarget,
  proteinConsumed, proteinTarget,
  styles,
}: {
  caloriesConsumed: number; caloriesTarget: number;
  exerciseMin: number; exerciseTarget: number;
  proteinConsumed: number; proteinTarget: number;
  styles: Styles;
}) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Today's Overview</Text>
      <View style={styles.ringsRow}>
        <RingProgress label="Calories" value={caloriesConsumed} target={caloriesTarget} color={Colors.ringMove} unit="kcal" styles={styles} />
        <RingProgress label="Exercise" value={exerciseMin} target={exerciseTarget} color={Colors.ringExercise} unit="min" styles={styles} />
        <RingProgress label="Protein" value={proteinConsumed} target={proteinTarget} color={Colors.ringProtein} unit="g" styles={styles} />
      </View>
    </View>
  );
}

function RingProgress({ label, value, target, color, unit, styles }: { label: string; value: number; target: number; color: string; unit: string; styles: Styles }) {
  const progress = Math.min(value / target, 1);
  const percentage = Math.round(progress * 100);

  return (
    <View style={styles.ringContainer}>
      <View style={[styles.ringOuter, { borderColor: `${color}20` }]}>
        <Text style={[styles.ringValue, { color }]}>{percentage}%</Text>
      </View>
      <Text style={styles.ringLabel}>{label}</Text>
      <Text style={styles.ringDetail}>{value}/{target} {unit}</Text>
    </View>
  );
}

function ChatBubble({ message, styles }: { message: ChatMessage; styles: Styles }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubbleContainer, isUser ? styles.bubbleContainerUser : styles.bubbleContainerAssistant]}>
      {!isUser && <Text style={styles.coachAvatar}>🐝</Text>}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

function getFallbackResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('workout'))
    return "Based on your weekly plan, today is Upper Body Push day! 💪\n\n1. Bench Press — 4×8\n2. Overhead Press — 3×10\n3. Incline DB Press — 3×12\n4. Lateral Raises — 3×15\n5. Tricep Dips — 3×12\n\nEstimated duration: 45 min.";
  if (lower.includes('goal'))
    return "You're doing great this week! 📊\n\n• Workouts: 3/5 completed\n• Avg calories: 2,150/2,200 target\n• Protein avg: 135g/150g target\n\nSlightly under on protein — try adding a Greek yogurt snack!";
  if (lower.includes('meal') || lower.includes('eat'))
    return "Here's a balanced meal idea! 🥗\n\n**Grilled Chicken Bowl**\n• Chicken breast (200g) — 330 kcal, 62g protein\n• Brown rice (1 cup) — 215 kcal, 5g protein\n• Steamed broccoli — 55 kcal, 4g protein\n• Avocado (½) — 120 kcal\n\nTotal: ~720 kcal, 72.5g protein";
  return "Great question! Let me analyze your data and get back to you. In the meantime, stay hydrated — aim for at least 8 glasses of water today! 💧";
}

// ── Styles ──

type Palette = typeof Colors.light;
type Styles = ReturnType<typeof createStyles>;

const createStyles = (palette: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.groupedBackground },
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.lg },
  summaryCard: { backgroundColor: palette.surfaceElevated, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadows.md },
  summaryTitle: { ...Typography.headline, color: palette.text, marginBottom: Spacing.md },
  ringsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  ringContainer: { alignItems: 'center' },
  ringOuter: { width: 72, height: 72, borderRadius: 36, borderWidth: 6, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xs },
  ringValue: { ...Typography.caption1, fontWeight: '700' },
  ringLabel: { ...Typography.caption1, color: palette.text, fontWeight: '600' },
  ringDetail: { ...Typography.caption2, color: palette.textSecondary },
  bubbleContainer: { flexDirection: 'row', marginBottom: Spacing.sm, alignItems: 'flex-end' },
  bubbleContainerUser: { justifyContent: 'flex-end' },
  bubbleContainerAssistant: { justifyContent: 'flex-start' },
  coachAvatar: { fontSize: 24, marginRight: Spacing.xs, marginBottom: 2 },
  bubble: { maxWidth: '78%', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, borderRadius: BorderRadius.lg },
  bubbleUser: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleAssistant: { backgroundColor: palette.surfaceElevated, borderBottomLeftRadius: 4, ...Shadows.sm },
  bubbleText: { ...Typography.body, lineHeight: 22 },
  bubbleTextUser: { color: '#FFFFFF' },
  bubbleTextAssistant: { color: palette.text },
  loadingBubble: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginBottom: Spacing.sm },
  loadingText: { ...Typography.subhead, color: palette.textSecondary, marginLeft: Spacing.sm },
  suggestionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  suggestionChip: { backgroundColor: palette.surfaceElevated, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.primary + '30', ...Shadows.sm },
  suggestionText: { ...Typography.subhead, color: Colors.primary },
  inputContainer: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: palette.background, borderTopWidth: 0.5, borderTopColor: palette.separator },
  inputWrapper: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: palette.surface, borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.md, paddingVertical: Platform.OS === 'ios' ? Spacing.sm : 0, minHeight: 40 },
  textInput: { flex: 1, ...Typography.body, color: palette.text, maxHeight: 100, paddingVertical: 0 },
  sendButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginLeft: Spacing.sm },
  sendButtonDisabled: { backgroundColor: palette.textTertiary },
  sendButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});
