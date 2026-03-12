/**
 * Coach Store — Zustand state for AI Coach conversations
 */

import { create } from 'zustand';
import type { CoachMessage, CoachQueryResponse } from '../types/coach';
import CoachContextManager from '../services/ai/coachContextManager';

interface CoachState {
  // ── State ──
  messages: CoachMessage[];
  isLoading: boolean;
  suggestions: string[];
  dailyBriefing: string | null;
  conversationId: string | null;
  contextManager: CoachContextManager | null;

  // ── Actions ──
  initializeCoach: (userId: string) => void;
  sendMessage: (message: string) => Promise<void>;
  loadDailyBriefing: () => Promise<void>;
  clearConversation: () => void;
}

export const useCoachStore = create<CoachState>((set, get) => ({
  messages: [],
  isLoading: false,
  suggestions: [
    "What's my workout for today?",
    'How am I doing on my goals?',
    'Suggest a healthy meal',
  ],
  dailyBriefing: null,
  conversationId: null,
  contextManager: null,

  initializeCoach: (userId: string) => {
    set({ contextManager: new CoachContextManager(userId) });
  },

  sendMessage: async (message: string) => {
    const { contextManager } = get();
    if (!contextManager) return;

    const now = new Date().toISOString();

    // Optimistically add user message
    set((state) => ({
      messages: [
        ...state.messages,
        { role: 'user' as const, content: message, timestamp: now },
      ],
      isLoading: true,
    }));

    try {
      const response: CoachQueryResponse =
        await contextManager.sendMessage(message);

      set((state) => ({
        messages: [
          ...state.messages,
          {
            role: 'assistant' as const,
            content: response.reply,
            timestamp: new Date().toISOString(),
          },
        ],
        conversationId: response.conversationId,
        suggestions: response.suggestions ?? [],
        isLoading: false,
      }));
    } catch (error) {
      set((state) => ({
        messages: [
          ...state.messages,
          {
            role: 'assistant' as const,
            content:
              "I'm sorry, I encountered an error. Please try again in a moment.",
            timestamp: new Date().toISOString(),
          },
        ],
        isLoading: false,
      }));
      console.error('[CoachStore] Error:', error);
    }
  },

  loadDailyBriefing: async () => {
    const { contextManager } = get();
    if (!contextManager) return;

    try {
      const briefing = await contextManager.getDailyBriefing();
      set({ dailyBriefing: briefing });
    } catch (error) {
      console.error('[CoachStore] Daily briefing error:', error);
    }
  },

  clearConversation: () => {
    set({
      messages: [],
      conversationId: null,
      suggestions: [
        "What's my workout for today?",
        'How am I doing on my goals?',
        'Suggest a healthy meal',
      ],
    });
  },
}));

export default useCoachStore;
