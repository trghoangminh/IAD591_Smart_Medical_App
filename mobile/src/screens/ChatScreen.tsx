import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Send, X, Bot } from 'lucide-react-native';
import { theme } from '../styles/theme';
import { User } from '../services/api';
import { ChatMessage, streamChat } from '../services/chat';

interface ChatScreenProps {
  user: User;
}

interface DisplayMessage extends ChatMessage {
  id: string;
  streaming?: boolean;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ user }) => {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<FlatList<DisplayMessage>>(null);
  const streamingIdRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  }, []);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || streaming) return;

    setError(null);
    setInput('');

    const userMsg: DisplayMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    };

    const assistantId = `assistant-${Date.now()}`;
    streamingIdRef.current = assistantId;

    const assistantPlaceholder: DisplayMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      streaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    setStreaming(true);
    scrollToBottom();

    const history: ChatMessage[] = messages
      .filter((m) => !m.streaming)
      .map((m) => ({ role: m.role, content: m.content }));

    abortRef.current = new AbortController();

    streamChat({
      userId: user.id,
      message: text,
      history,
      signal: abortRef.current.signal,
      onToken: (token) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + token } : m
          )
        );
        scrollToBottom();
      },
      onDone: () => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, streaming: false } : m
          )
        );
        setStreaming(false);
        streamingIdRef.current = null;
      },
      onError: (msg) => {
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        setError(msg);
        setStreaming(false);
        streamingIdRef.current = null;
      },
    });
  }, [input, streaming, messages, user.id, scrollToBottom]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    const assistantId = streamingIdRef.current;
    if (assistantId) {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m))
            .filter((m) => !(m.id === assistantId && m.content === ''))
      );
    }
    setStreaming(false);
    streamingIdRef.current = null;
  }, []);

  const renderMessage = useCallback(
    ({ item }: { item: DisplayMessage }) => {
      const isUser = item.role === 'user';
      return (
        <View style={[styles.bubbleRow, isUser ? styles.rowRight : styles.rowLeft]}>
          {!isUser && (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>AI</Text>
            </View>
          )}
          <View
            style={[
              styles.bubble,
              isUser ? styles.bubbleUser : styles.bubbleAssistant,
            ]}
          >
            {item.streaming && item.content === '' ? (
              <View style={styles.typingRow}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.typingText}>Đang soạn...</Text>
              </View>
            ) : (
              <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
                {item.content}
                {item.streaming && (
                  <Text style={styles.cursor}>▎</Text>
                )}
              </Text>
            )}
          </View>
        </View>
      );
    },
    []
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 140 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerDot}>
          <Bot size={20} color={theme.colors.primary} />
        </View>
        <View>
          <Text style={styles.headerTitle}>Trợ lý sức khoẻ AI</Text>
          <Text style={styles.headerSub}>Tư vấn dựa trên đơn thuốc của bạn</Text>
        </View>
      </View>

      {/* Messages */}
      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💊</Text>
          <Text style={styles.emptyTitle}>Xin chào, {user.name}!</Text>
          <Text style={styles.emptyDesc}>
            Tôi có thể trả lời các câu hỏi về đơn thuốc, lịch uống thuốc và nhắc nhở sức khoẻ của bạn.
          </Text>
          <Text style={styles.emptyDisclaimer}>
            ⚠️ Trợ lý AI không thay thế lời khuyên từ bác sĩ.
          </Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
        />
      )}

      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={16} color="#C0392B" />
          </TouchableOpacity>
        </View>
      )}

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={[styles.input, streaming && { opacity: 0.5 }]}
          value={input}
          onChangeText={setInput}
          placeholder="Nhập câu hỏi..."
          placeholderTextColor={theme.colors.textLight}
          maxLength={1000}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
          editable={!streaming}
        />
        {streaming ? (
          <TouchableOpacity style={[styles.sendBtn, styles.cancelBtn]} onPress={handleCancel}>
            <X size={20} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim()}
          >
            <Send size={20} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    marginBottom: 80,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F5',
  },
  headerDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textMain,
  },
  headerSub: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    gap: 8,
  },
  rowRight: {
    justifyContent: 'flex-end',
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleUser: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleText: {
    fontSize: 14,
    color: theme.colors.textMain,
    lineHeight: 21,
  },
  bubbleTextUser: {
    color: '#FFF',
  },
  cursor: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  typingText: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textMain,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  emptyDisclaimer: {
    fontSize: 12,
    color: theme.colors.warning,
    textAlign: 'center',
    lineHeight: 18,
    backgroundColor: '#FEF9E7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FDECEA',
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#C0392B',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#C0392B',
    lineHeight: 19,
    marginRight: 8,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#EEF1F5',
  },
  input: {
    flex: 1,
    height: 42,
    backgroundColor: theme.colors.background,
    borderRadius: 21,
    paddingHorizontal: 16,
    paddingVertical: 0,
    fontSize: 14,
    color: theme.colors.textMain,
    borderWidth: 1,
    borderColor: '#DDE1E7',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendBtnDisabled: {
    backgroundColor: theme.colors.textLight,
  },
  cancelBtn: {
    backgroundColor: theme.colors.danger,
  },
});
