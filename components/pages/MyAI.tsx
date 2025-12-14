import DayEventItem from '@/components/items/DayEventItem'
import { GEMINI_API_KEY, GEMINI_API_URL } from '@/firebase.config'
import { Text, View } from '@/theme/Themed'
import React from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, TextInput } from 'react-native'
import { IconButton } from 'react-native-paper'
import SegmentedControl from '../SegmentedControl'

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
}

const MyAI = () => {
  const [chatMessages, setChatMessages] = React.useState<Message[]>([]);
  const [eventMessages, setEventMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [streamingText, setStreamingText] = React.useState('');
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [modeIndex, setModeIndex] = React.useState(0); // 0 = event, 1 = chat
  const mode = modeIndex === 0 ? 'event' : 'chat';
  const [generatedEvent, setGeneratedEvent] = React.useState<any | null>(null);
  const scrollViewRef = React.useRef<ScrollView>(null);

  // Get current messages based on mode
  const messages = mode === 'chat' ? chatMessages : eventMessages;
  const setMessages = mode === 'chat' ? setChatMessages : setEventMessages;

  const extractJSON = (text: string) => {
    try {
      const cleaned = text
        .replace(/^```json[\r\n]*/i, '')
        .replace(/^```[\r\n]*/i, '')
        .replace(/```$/i, '')
        .trim();
      // Try direct parse first
      return JSON.parse(cleaned);
    } catch (_) {
      // Fallback: extract first {...} block heuristically
      const start = cleanedIndex(text, '{');
      const end = findMatchingBraceEnd(text, start);
      if (start >= 0 && end > start) {
        const candidate = text.substring(start, end + 1);
        try { return JSON.parse(candidate); } catch (e) { /* ignore */ }
      }
      throw new Error('No valid JSON found');
    }
  };

  const cleanedIndex = (s: string, ch: string) => s.indexOf(ch);
  const findMatchingBraceEnd = (s: string, start: number) => {
    if (start < 0) return -1;
    let depth = 0;
    for (let i = start; i < s.length; i++) {
      const c = s[i];
      if (c === '{') depth++;
      else if (c === '}') {
        depth--;
        if (depth === 0) return i;
      }
    }
    return -1;
  };

  // Build a Date using local wall time components
  const toLocalFromComponents = (y: number, m: number, d: number, hh: number, mm: number, ss = 0, ms = 0) =>
    new Date(y, m, d, hh, mm, ss, ms);

  // Convert an incoming date (ISO string or Date) to local using its components
  const toLocalDate = (v: any) => {
    if (!v) return new Date();
    const d = typeof v === 'string' ? new Date(v) : v instanceof Date ? v : new Date(v);
    return toLocalFromComponents(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      d.getHours(),
      d.getMinutes(),
      d.getSeconds(),
      d.getMilliseconds()
    );
  };

  // Parse times like "10:00am", "1pm", "midnight", "noon" from user prompt.
  const parseTimesFromPrompt = (prompt: string) => {
    const lower = prompt.toLowerCase();
    const now = new Date();
    const baseY = now.getFullYear();
    const baseM = now.getMonth();
    const baseD = now.getDate();

    const specialMap: Record<string, number> = { midnight: 0, noon: 12 };

    const timeRegex = /(\b\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/g; // captures up to multiple times
    const found: Array<{ h: number; m: number }>|null = [];

    // capture special words first
    Object.keys(specialMap).forEach(k => {
      if (lower.includes(k)) {
        found.push({ h: specialMap[k], m: 0 });
      }
    });

    // capture numeric times
    let match: RegExpExecArray | null;
    while ((match = timeRegex.exec(lower)) !== null) {
      let h = parseInt(match[1], 10);
      const m = match[2] ? parseInt(match[2], 10) : 0;
      const ap = match[3];
      if (ap === 'pm' && h < 12) h += 12;
      if (ap === 'am' && h === 12) h = 0;
      found.push({ h, m });
    }

    if (found.length === 0) return null;

    const makeLocal = (h: number, m: number) => toLocalFromComponents(baseY, baseM, baseD, h, m);

    const start = makeLocal(found[0].h, found[0].m);
    const end = found[1] ? makeLocal(found[1].h, found[1].m) : new Date(start.getTime() + 60 * 60 * 1000);
    // If end before start, roll over to next day
    const endFixed = end <= start ? new Date(end.getTime() + 24 * 60 * 60 * 1000) : end;

    return { start, end: endFixed };
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setLoading(true);

    try {
      const promptPayload =
        mode === 'event'
          ? {
              contents: [
                {
                  parts: [
                    {
                      text:
                        `From the following prompt, create a JSON object for an event that fits this TypeScript shape:

{
  id: string | null,
  title: string,
  description: string,
  imageUrl: string,
  image: string | null,
  blank: boolean,
  eventType: 'pager' | 'schedule' | 'public' | 'saved',
  modified: string (ISO date),
  fullDay: boolean,
  startDate: string (ISO date),
  endDate: string (ISO date),
  on: boolean,
  notification: boolean,
  repeats: boolean,
  repeatKey: 'none',
  ends: boolean,
  endAfter: string (ISO date),
  repeatRule: {
    rule: 'regular',
    regular: { number: string, unit: 'minutes'|'hours'|'days'|'weeks' },
    weekdays: {
      monday: { i: 1, active: boolean },
      tuesday: { i: 2, active: boolean },
      wednesday: { i: 3, active: boolean },
      thursday: { i: 4, active: boolean },
      friday: { i: 5, active: boolean },
      saturday: { i: 6, active: boolean },
      sunday: { i: 7, active: boolean }
    }
  }
}

Constraints:
- Ensure startDate < endDate.
- Use eventType 'pager' unless the prompt clearly indicates schedule/public/saved.
- If no image, set imageUrl to '' and image to null.
- If repeats are not requested, set repeats=false and repeatKey='none'.
- Respond ONLY with JSON, no prose.
 - Do NOT include markdown fences or code labels.
 - Return ONLY the JSON object (no explanations).

Prompt: ${currentInput}`,
                    },
                  ],
                },
              ],
            }
          : {
              contents: [
                {
                  parts: [
                    {
                      text: currentInput,
                    },
                  ],
                },
              ],
            };

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promptPayload)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'API request failed');
      }

      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';

      // If in event mode, parse JSON and render DayEventItem
      if (mode === 'event') {
        try {
          const parsed = extractJSON(aiText);
          const eventObject = {
            id: parsed.id ?? null,
            title: parsed.title ?? '',
            description: parsed.description ?? '',
            imageUrl: parsed.imageUrl ?? '',
            image: parsed.image ?? null,
            blank: !!parsed.blank,
            eventType: parsed.eventType ?? 'pager',
            modified: toLocalDate(parsed.modified) ?? new Date(),
            fullDay: !!parsed.fullDay,
            startDate: toLocalDate(parsed.startDate) ?? new Date(),
            endDate: toLocalDate(parsed.endDate) ?? new Date(new Date().getTime() + 60 * 60 * 1000),
            on: parsed.on ?? true,
            notification: parsed.notification ?? false,
            repeats: parsed.repeats ?? false,
            repeatKey: parsed.repeatKey ?? 'none',
            ends: parsed.ends ?? false,
            endAfter: toLocalDate(parsed.endAfter) ?? new Date(0),
            repeatRule: parsed.repeatRule ?? {
              rule: 'regular',
              regular: { number: '1', unit: 'days' },
              weekdays: {
                monday: { i: 1, active: false },
                tuesday: { i: 2, active: false },
                wednesday: { i: 3, active: false },
                thursday: { i: 4, active: false },
                friday: { i: 5, active: false },
                saturday: { i: 6, active: false },
                sunday: { i: 7, active: false },
              },
            },
          };
          // If the model omitted dates or produced invalid ones, or included timezone offsets
          // fall back to parsing times from the user's prompt to respect local time.
          const invalidDate = (d: any) => !(d instanceof Date) || isNaN(d.getTime());
          const hasTZ = (s: any) => typeof s === 'string' && /Z|[+-]\d{2}:?\d{2}/.test(s);
          if (invalidDate(eventObject.startDate) || invalidDate(eventObject.endDate) || hasTZ(parsed.startDate) || hasTZ(parsed.endDate)) {
            const fallback = parseTimesFromPrompt(currentInput);
            if (fallback) {
              eventObject.startDate = fallback.start;
              eventObject.endDate = fallback.end;
            } else {
              // default to a 1-hour event starting now in local time
              const nowLocal = new Date();
              eventObject.startDate = toLocalFromComponents(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate(), nowLocal.getHours(), nowLocal.getMinutes(), 0, 0);
              eventObject.endDate = new Date(eventObject.startDate.getTime() + 60 * 60 * 1000);
            }
          }
          // Snap to exact local midnight boundaries when requested
          const isMidnight = (d: Date) => d.getHours() === 0 && d.getMinutes() === 0;
          const looksLikeAlmostMidnight = (d: Date) => d.getHours() === 0 && d.getMinutes() === 59; // artifact
          if (eventObject.fullDay || (isMidnight(eventObject.startDate) && (isMidnight(eventObject.endDate) || looksLikeAlmostMidnight(eventObject.endDate)))) {
            const startLocal = toLocalFromComponents(eventObject.startDate.getFullYear(), eventObject.startDate.getMonth(), eventObject.startDate.getDate(), 0, 0, 0, 0);
            const endLocal = new Date(startLocal.getTime() + 24 * 60 * 60 * 1000);
            eventObject.startDate = startLocal;
            eventObject.endDate = endLocal;
          }
          // Ensure startDate < endDate
          if (eventObject.startDate >= eventObject.endDate) {
            eventObject.endDate = new Date(eventObject.startDate.getTime() + 60 * 60 * 1000);
          }
          setGeneratedEvent(eventObject);
          setLoading(false);
          setIsStreaming(false);
          setStreamingText('');
        } catch (e) {
          console.log('Failed to parse AI event JSON', e);
          setLoading(false);
          const errorMessage: Message = {
            role: 'ai',
            content: 'The AI did not return valid event JSON.',
            timestamp: Date.now(),
          };
          setMessages(prev => [...prev, errorMessage]);
        }
        return;
      }

      // Chat mode: stream text
      setLoading(false);
      setIsStreaming(true);
      setStreamingText('');

      // Stream the text letter by letter
      for (let i = 0; i <= aiText.length; i++) {
        setStreamingText(aiText.substring(0, i));
        // await new Promise(resolve => setTimeout(resolve, 20)); // 20ms delay per character kinda long story format
        // await new Promise(resolve => setTimeout(resolve, 5)) // 5ms still kind long
        await new Promise(resolve => setTimeout(resolve, 1)); // 1ms faster
        }

      const aiMessage: Message = {
        role: 'ai',
        content: aiText,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setStreamingText('');
      setIsStreaming(false);
    } catch (error) {
      console.error('AI Error:', error);
      setLoading(false);
      const errorMessage: Message = {
        role: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setStreamingText('');
      setIsStreaming(false);
    }
  };

  React.useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, streamingText]);

  return (
    <View style={styles.container}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, justifyContent: 'center', alignItems: 'center' }}>
        <SegmentedControl
          tabs={[
            { icon: 'calendar-plus', tab: 'Create Event' },
            { icon: 'chat', tab: 'Chat' },
          ]}
          currentIndex={modeIndex}
          onChange={(index: number) => setModeIndex(index)}
          segmentedControlBackgroundColor='rgb(69, 69, 112)'
          activeSegmentBackgroundColor='goldenrod'
          activeTextColor='white'
          textColor='white'
          width='100%'
        />
      </View>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        scrollEnabled={true}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            {/* switch depending on mode */}
            {mode === 'chat' ? (
              <>
                <Text style={styles.emptyText}>Start a conversation with AI</Text>
                <Text style={styles.emptySubtext}>Ask me anything!</Text>
              </>
            ) : (
              <>
                <Text style={styles.emptyText}>Create a new event with AI</Text>
                <Text style={styles.emptySubtext}>Describe your event details</Text>
              </>
            )}
          </View>
        ) : (
          messages.map((message, index) => (
            <View 
              key={index} 
              style={[
                styles.messageBubble,
                message.role === 'user' ? styles.userBubble : styles.aiBubble
              ]}
            >
              <Text style={styles.messageText}>{message.content}</Text>
            </View>
          ))
        )}
        {isStreaming && streamingText && (
          <View style={[styles.messageBubble, styles.aiBubble]}>
            <Text style={styles.messageText}>{streamingText}</Text>
          </View>
        )}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#fcba03" />
            <Text style={styles.loadingText}>AI is thinking...</Text>
          </View>
        )}

        {generatedEvent && (
          <View style={{ marginTop: 12 }}>
            <DayEventItem event={generatedEvent} />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type your message..."
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          multiline
          maxLength={1000}
          onSubmitEditing={sendMessage}
        />
        <IconButton
          icon="send"
          size={24}
          iconColor={input.trim() ? '#fcba03' : 'rgba(255, 255, 255, 0.3)'}
          onPress={sendMessage}
          disabled={!input.trim() || loading}
        />
      </View>
    </View>
  )
}

export default MyAI

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        position: 'relative',
    },
    messagesContainer: {
        flex: 1,
        minHeight: 0,
    },
    messagesContent: {
        padding: 16,
        paddingBottom: 80,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 16,
        opacity: 0.6,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 12,
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: '#fcba03',
    },
    aiBubble: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgb(69, 69, 112)',
    },
    messageText: {
        fontSize: 16,
        color: 'white',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        padding: 12,
        backgroundColor: 'rgb(69, 69, 112)',
        borderRadius: 16,
        marginBottom: 12,
    },
    loadingText: {
        marginLeft: 8,
        fontSize: 14,
        opacity: 0.7,
    },
    inputContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 8,
        paddingBottom: 16,
        backgroundColor: 'rgb(40, 40, 60)',
        zIndex: 100,
    },
    input: {
        flex: 1,
        backgroundColor: 'rgb(69, 69, 112)',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: 'white',
        maxHeight: 100,
    },
})