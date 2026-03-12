/**
 * AI Coach Type Definitions
 */

export type MessageRole = 'system' | 'user' | 'assistant';

export type ContextEntryType =
  | 'workout'
  | 'meal'
  | 'goal_change'
  | 'coach_note'
  | 'wearable_sync';

// ── Chat message in coach conversation ──
export interface CoachMessage {
  role: MessageRole;
  content: string;
  timestamp: string;
}

// ── Full coach conversation ──
export interface CoachConversation {
  id: string;
  userId: string;
  messages: CoachMessage[];
  summary?: string;           // rolling summary for context window management
  createdAt: string;
  updatedAt: string;
}

// ── Context entry for RAG-based retrieval ──
export interface AIContextEntry {
  id: string;
  userId: string;
  entryType: ContextEntryType;
  content: string;            // human-readable summary for LLM
  embedding?: number[];       // 1536-dim vector (not stored client-side)
  sourceTable?: string;       // e.g., 'workout_logs', 'meal_logs'
  sourceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ── Coach query request (sent to edge function) ──
export interface CoachQueryRequest {
  userId: string;
  message: string;
  conversationId?: string;
  includeContext?: boolean;   // whether to perform RAG retrieval
}

// ── Coach query response ──
export interface CoachQueryResponse {
  reply: string;
  conversationId: string;
  contextUsed: string[];      // IDs of context entries used
  suggestions?: string[];     // quick-reply suggestions
}

// ── Context window (assembled for the LLM) ──
export interface AssembledContext {
  systemPrompt: string;
  userProfile: string;
  todaysSummary: string;
  relevantHistory: string[];
  conversationHistory: CoachMessage[];
}
