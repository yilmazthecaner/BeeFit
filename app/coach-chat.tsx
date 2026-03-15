/**
 * AI Coach Chat Screen — Matches Stitch "AI Coach Chat" design
 *
 * Full chat UI with:
 * - Header with Brain icon + online status
 * - Chat messages (AI + user)
 * - Recipe suggestion cards
 * - Proactive insight bubble
 * - Message input with send button
 * - Wired to useCoachStore for real AI messaging
 */

import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '../components/useColorScheme';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCoachStore } from '../src/stores/useCoachStore';
import { useAuthStore } from '../src/stores/useAuthStore';

export default function CoachChatScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = useMemo(() => createStyles(isDark), [isDark]);
  const router = useRouter();

  const { user } = useAuthStore();
  const {
    messages,
    isLoading,
    suggestions,
    initializeCoach,
    sendMessage,
  } = useCoachStore();

  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (user?.id) {
      initializeCoach(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    // scroll to bottom when messages change
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;
    setInputText('');
    await sendMessage(text);
  };

  const handleSuggestionPress = async (suggestion: string) => {
    if (isLoading) return;
    setInputText('');
    await sendMessage(suggestion);
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarCircle}>
            <MaterialIcons name="psychology" size={24} color="#ffffff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>The Brain</Text>
            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.statusText}>PERSONAL COACH</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => router.back()}
        >
          <MaterialIcons
            name="close"
            size={22}
            color={isDark ? '#cbd5e1' : '#475569'}
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Chat Area */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Date Header */}
          <View style={styles.dateHeader}>
            <Text style={styles.dateText}>{dateStr}</Text>
          </View>

          {/* Welcome message if no messages */}
          {messages.length === 0 && (
            <>
              {/* AI welcome */}
              <View style={styles.aiMessageGroup}>
                <View style={styles.aiBubble}>
                  <Text style={styles.aiText}>
                    Good morning! I'm your personal AI health coach. I can help
                    with workout planning, nutrition advice, and health insights
                    based on your data. 🧠
                  </Text>
                </View>
                <View style={styles.aiBubble}>
                  <Text style={[styles.aiText, styles.aiTextHighlight]}>
                    What would you like to work on today?
                  </Text>
                </View>
                <Text style={styles.timestamp}>
                  {now.toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              {/* Suggestion chips */}
              <View style={styles.suggestionsContainer}>
                {suggestions.map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.suggestionChip}
                    onPress={() => handleSuggestionPress(s)}
                    disabled={isLoading}
                  >
                    <Text style={styles.suggestionText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Messages */}
          {messages.map((msg, index) => {
            if (msg.role === 'user') {
              return (
                <View key={index} style={styles.userMessageGroup}>
                  <View style={styles.userBubble}>
                    <Text style={styles.userText}>{msg.content}</Text>
                  </View>
                  <Text style={styles.timestampRight}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              );
            } else {
              return (
                <View key={index} style={styles.aiMessageGroup}>
                  <View style={styles.aiBubble}>
                    <Text style={styles.aiText}>{msg.content}</Text>
                  </View>
                  <Text style={styles.timestamp}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              );
            }
          })}

          {/* Loading indicator */}
          {isLoading && (
            <View style={styles.aiMessageGroup}>
              <View style={styles.aiBubble}>
                <View style={styles.typingIndicator}>
                  <View style={[styles.typingDot, { opacity: 0.4 }]} />
                  <View style={[styles.typingDot, { opacity: 0.6 }]} />
                  <View style={[styles.typingDot, { opacity: 0.8 }]} />
                </View>
              </View>
            </View>
          )}

          {/* Suggestions after messages */}
          {messages.length > 0 && suggestions.length > 0 && !isLoading && (
            <View style={styles.suggestionsContainer}>
              {suggestions.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.suggestionChip}
                  onPress={() => handleSuggestionPress(s)}
                  disabled={isLoading}
                >
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputArea}>
          <View style={styles.inputRow}>
            <TouchableOpacity>
              <MaterialIcons
                name="add-circle-outline"
                size={24}
                color={isDark ? '#64748b' : '#94a3b8'}
              />
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <MaterialIcons name="arrow-upward" size={18} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) => {
  const bgMain = isDark ? '#221610' : '#f8f6f6';
  const textMain = isDark ? '#f1f5f9' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const primary = '#ec5b13';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bgMain,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: isDark ? 'rgba(34, 22, 16, 0.8)' : 'rgba(248, 246, 246, 0.8)',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(236, 91, 19, 0.1)' : '#e2e8f0',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatarCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: textMain,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    onlineDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#22c55e',
    },
    statusText: {
      fontSize: 10,
      fontWeight: '600',
      color: textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    settingsBtn: {
      padding: 8,
      borderRadius: 20,
    },
    chatContent: {
      padding: 16,
      paddingBottom: 24,
    },

    // Date
    dateHeader: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    dateText: {
      fontSize: 12,
      fontWeight: '500',
      color: isDark ? '#475569' : '#94a3b8',
      textTransform: 'uppercase',
      letterSpacing: 2,
    },

    // AI messages
    aiMessageGroup: {
      maxWidth: '85%',
      marginBottom: 24,
      gap: 6,
    },
    aiBubble: {
      backgroundColor: isDark ? 'rgba(236, 91, 19, 0.1)' : '#ffffff',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(236, 91, 19, 0.2)' : '#e2e8f0',
      borderRadius: 16,
      borderBottomLeftRadius: 0,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    aiText: {
      fontSize: 15,
      color: textMain,
      lineHeight: 22,
    },
    aiTextHighlight: {
      fontWeight: '500',
      color: primary,
    },
    timestamp: {
      fontSize: 11,
      color: isDark ? '#475569' : '#94a3b8',
      marginLeft: 4,
    },

    // User messages
    userMessageGroup: {
      alignSelf: 'flex-end',
      maxWidth: '85%',
      marginBottom: 24,
      gap: 6,
      alignItems: 'flex-end',
    },
    userBubble: {
      backgroundColor: primary,
      borderRadius: 16,
      borderBottomRightRadius: 0,
      paddingHorizontal: 16,
      paddingVertical: 12,
      shadowColor: primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
    },
    userText: {
      fontSize: 15,
      color: '#ffffff',
      lineHeight: 22,
    },
    timestampRight: {
      fontSize: 11,
      color: isDark ? '#475569' : '#94a3b8',
      marginRight: 4,
    },

    // Typing indicator
    typingIndicator: {
      flexDirection: 'row',
      gap: 4,
      paddingVertical: 4,
    },
    typingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: primary,
    },

    // Suggestions
    suggestionsContainer: {
      gap: 8,
      marginBottom: 24,
    },
    suggestionChip: {
      backgroundColor: isDark ? 'rgba(236, 91, 19, 0.1)' : '#ffffff',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(236, 91, 19, 0.2)' : '#e2e8f0',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    suggestionText: {
      fontSize: 14,
      fontWeight: '500',
      color: primary,
    },

    // Input
    inputArea: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: isDark ? 'rgba(34, 22, 16, 0.8)' : 'rgba(248, 246, 246, 0.8)',
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(236, 91, 19, 0.1)' : '#e2e8f0',
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: isDark ? 'rgba(236, 91, 19, 0.2)' : '#f1f5f9',
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(236, 91, 19, 0.1)' : '#e2e8f0',
    },
    textInput: {
      flex: 1,
      fontSize: 14,
      color: textMain,
      paddingVertical: 8,
    },
    sendButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
  });
};
