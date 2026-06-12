// TenderAIPage.tsx — TenderAI chat: Claude claude-sonnet-4-6 with device context injection
import { useState, useRef, useEffect } from 'react';
import {
  Box, Paper, Stack, Typography, TextField, Button, IconButton,
  CircularProgress, Chip, Select, MenuItem, FormControl, InputLabel, Avatar,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import ScienceIcon from '@mui/icons-material/Science';
import { useProducts } from '../hooks/useProducts';
import { useTelemetry } from '../hooks/useTelemetry';

const C = {
  bg: '#0D2B1E', surface: '#1A3D2B', accent: '#4A7C59',
  gold: '#C8B882', goldMuted: '#8A7D55', danger: '#CC3333',
  warning: '#E8A020', white: '#F0EDE4',
};

const FUNCTIONS_URL = import.meta.env.VITE_FUNCTIONS_URL as string | undefined
  ?? 'http://127.0.0.1:5001/tender-cells/us-central1';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  ts: number;
}

const STARTER_PROMPTS = [
  "What does an ammonia reading of 8 ppm mean for my flock?",
  "My temperature is 87°F — what should I do?",
  "When should I run a cleaning cycle?",
  "How often should I collect eggs?",
  "What's a healthy feed level to maintain?",
  "Explain diagnostic code 50.",
];

function TelemetryChip({ icon, label, value, warn }: { icon: React.ReactNode; label: string; value: string; warn?: boolean }) {
  return (
    <Chip
      icon={<Box sx={{ color: warn ? C.warning : C.accent, display: 'flex', fontSize: 14 }}>{icon}</Box>}
      label={`${label}: ${value}`}
      size="small"
      sx={{ bgcolor: C.bg, color: warn ? C.warning : C.goldMuted, border: `1px solid ${warn ? C.warning : C.accent}44`, fontSize: 11 }}
    />
  );
}

function ChatBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <Stack direction={isUser ? 'row-reverse' : 'row'} spacing={1} alignItems="flex-start">
      <Avatar sx={{ bgcolor: isUser ? C.accent : '#2A5C3B', width: 32, height: 32, fontSize: 16 }}>
        {isUser ? <PersonIcon sx={{ fontSize: 18 }} /> : <SmartToyIcon sx={{ fontSize: 18 }} />}
      </Avatar>
      <Box sx={{ maxWidth: '78%' }}>
        <Paper elevation={0} sx={{
          bgcolor: isUser ? C.accent : C.surface,
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          px: 2, py: 1.5,
          border: `1px solid ${isUser ? C.accent : C.accent}44`,
        }}>
          <Typography sx={{ color: C.white, fontSize: 14, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {msg.content}
          </Typography>
        </Paper>
        <Typography sx={{ color: C.goldMuted, fontSize: 10, mt: 0.3, textAlign: isUser ? 'right' : 'left' }}>
          {new Date(msg.ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </Typography>
      </Box>
    </Stack>
  );
}

export default function TenderAIPage() {
  const { products } = useProducts();
  const [selectedDeviceId, setSelectedDeviceId] = useState('ct_001');
  const { data: telemetry } = useTelemetry(selectedDeviceId, 15000);

  const [messages, setMessages] = useState<Message[]>([{
    id: 'welcome',
    role: 'assistant',
    content: "Hi! I'm TenderAI — your intelligent assistant for Tender Cells automated animal care. I can help you interpret sensor readings, diagnose issues, optimize schedules, and explain what's happening with your flock. What would you like to know?",
    ts: Date.now(),
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const deviceOptions = products.length > 0
    ? products.map(p => ({ id: p.device_id ?? p.id, name: p.product_name }))
    : [{ id: 'ct_001', name: 'Chicken Tender (sim)' }];

  const buildContextMessage = (userText: string): string => {
    const t = telemetry;
    if (!t) return userText;
    return `Device: ${selectedDeviceId}
Current readings: Temp ${t.temperature ?? 'N/A'}°F, Humidity ${t.humidity ?? 'N/A'}%, Ammonia ${t.ammonia ?? 'N/A'} ppm, Feed ${t.feedLevel ?? 'N/A'}%, Water ${t.waterLevel ?? 'N/A'}%, Chickens detected: ${t.chickenCount ?? 'N/A'}, System state: ${t.systemState ?? 'unknown'}

User question: ${userText}`;
  };

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput('');
    setApiError(null);

    const userMsg: Message = { id: `u${Date.now()}`, role: 'user', content, ts: Date.now() };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);

    try {
      const res = await fetch(`${FUNCTIONS_URL}/aiChat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: `You are TenderAI, the intelligent assistant for Tender Cells automated animal care systems. Help diagnose issues, suggest schedule optimizations, interpret diagnostic codes, and explain what sensor readings mean for animal health. Always prioritize animal safety. If readings suggest immediate health risk, say so clearly first. Be concise and practical.`,
          messages: history.map(m => ({ role: m.role, content: m.id === userMsg.id ? buildContextMessage(m.content) : m.content })),
        }),
      });

      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json() as { content?: Array<{ text: string }> };
      const reply = data.content?.[0]?.text ?? 'Sorry, I could not generate a response.';

      setMessages(prev => [...prev, { id: `a${Date.now()}`, role: 'assistant', content: reply, ts: Date.now() }]);
    } catch {
      // Firebase Functions not deployed — use a helpful local fallback
      const fallback = getFallbackResponse(content);
      setMessages(prev => [...prev, { id: `a${Date.now()}`, role: 'assistant', content: fallback, ts: Date.now() }]);
      setApiError('Using local responses — deploy Firebase Functions to enable live AI.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100dvh', p: { xs: 1, sm: 2 }, display: 'flex', flexDirection: 'column' }}>
      <Stack spacing={2} sx={{ maxWidth: 800, mx: 'auto', width: '100%', flex: 1 }}>

        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <SmartToyIcon sx={{ color: C.accent, fontSize: 28 }} />
            <Box>
              <Typography variant="h5" sx={{ color: C.gold, fontWeight: 700 }}>TenderAI</Typography>
              <Typography sx={{ color: C.goldMuted, fontSize: 12 }}>Powered by Claude claude-sonnet-4-6</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel sx={{ color: C.goldMuted }}>Device context</InputLabel>
              <Select value={selectedDeviceId} label="Device context" onChange={e => setSelectedDeviceId(e.target.value)}
                sx={{ color: C.white, '& .MuiOutlinedInput-notchedOutline': { borderColor: C.accent } }}>
                {deviceOptions.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </Select>
            </FormControl>
            <IconButton onClick={() => setMessages([{ id: 'w2', role: 'assistant', content: 'Conversation cleared. How can I help?', ts: Date.now() }])}
              sx={{ color: C.goldMuted }} title="Clear chat">
              <DeleteSweepIcon />
            </IconButton>
          </Stack>
        </Stack>

        {/* Live telemetry chips */}
        {telemetry && (
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {telemetry.temperature != null && (
              <TelemetryChip icon={<ThermostatIcon />} label="Temp" value={`${telemetry.temperature}°F`} warn={(telemetry.temperature as number) > 85 || (telemetry.temperature as number) < 35} />
            )}
            {telemetry.humidity != null && (
              <TelemetryChip icon={<WaterDropIcon />} label="Humidity" value={`${telemetry.humidity}%`} />
            )}
            {telemetry.ammonia != null && (
              <TelemetryChip icon={<ScienceIcon />} label="Ammonia" value={`${telemetry.ammonia} ppm`} warn={(telemetry.ammonia as number) > 10} />
            )}
            {telemetry.feedLevel != null && (
              <TelemetryChip icon={<RestaurantIcon />} label="Feed" value={`${telemetry.feedLevel}%`} warn={(telemetry.feedLevel as number) < 20} />
            )}
          </Stack>
        )}

        {apiError && (
          <Paper elevation={0} sx={{ bgcolor: C.warning + '22', border: `1px solid ${C.warning}44`, borderRadius: 1.5, p: 1.5 }}>
            <Typography sx={{ color: C.warning, fontSize: 12 }}>⚠ {apiError}</Typography>
          </Paper>
        )}

        {/* Message thread */}
        <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: 2, p: 2, flex: 1, minHeight: 400, maxHeight: '55vh', overflowY: 'auto' }}>
          <Stack spacing={2}>
            {messages.map(m => <ChatBubble key={m.id} msg={m} />)}
            {loading && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar sx={{ bgcolor: '#2A5C3B', width: 32, height: 32 }}><SmartToyIcon sx={{ fontSize: 18 }} /></Avatar>
                <Paper elevation={0} sx={{ bgcolor: C.surface, border: `1px solid ${C.accent}44`, borderRadius: '16px 16px 16px 4px', px: 2, py: 1.5 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={14} sx={{ color: C.accent }} />
                    <Typography sx={{ color: C.goldMuted, fontSize: 13 }}>Thinking…</Typography>
                  </Stack>
                </Paper>
              </Stack>
            )}
            <div ref={bottomRef} />
          </Stack>
        </Paper>

        {/* Starter prompts */}
        {messages.length <= 2 && (
          <Stack direction="row" spacing={0.75} flexWrap="wrap">
            {STARTER_PROMPTS.map(p => (
              <Chip key={p} label={p} size="small" clickable onClick={() => void send(p)}
                sx={{ bgcolor: C.surface, color: C.goldMuted, border: `1px solid ${C.accent}33`, fontSize: 11, mb: 0.75 }} />
            ))}
          </Stack>
        )}

        {/* Input */}
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Ask TenderAI about your flock, sensor readings, or schedules…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': { color: C.white, '& fieldset': { borderColor: C.accent } },
              '& .MuiInputBase-input::placeholder': { color: C.goldMuted },
            }}
          />
          <Button variant="contained" onClick={() => void send()} disabled={!input.trim() || loading}
            sx={{ bgcolor: C.accent, minWidth: 48, px: 1.5 }}>
            <SendIcon />
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

// Local fallback responses when Firebase Functions aren't deployed
function getFallbackResponse(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('ammonia')) return 'Ammonia levels:\n• <10 ppm: Normal — good ventilation\n• 10-25 ppm: Warning — open vents, consider cleaning cycle\n• >25 ppm: Critical (Code 51) — immediate action required. Open doors, start cleaning cycle, check MQ-137 sensor calibration.';
  if (q.includes('temperature') || q.includes('temp') || q.includes('87') || q.includes('hot')) return 'Temperature guidelines:\n• 35-85°F: Healthy range\n• >85°F: Heat stress — open vents, add fans, provide extra water\n• >90°F: Critical (Code 50) — immediate cooling required\n• <35°F: Cold stress — activate heat lamp\n• <32°F: Critical (Code 50) — emergency heat required';
  if (q.includes('egg') || q.includes('collect')) return 'Egg collection best practices:\n• Collect 2× daily minimum (morning and afternoon)\n• More frequent collection in hot weather reduces spoilage\n• The egg map tracks which nest boxes are active\n• Consistent collection reduces broodiness\n• Handle gently — check for cracks before storing';
  if (q.includes('feed') || q.includes('food')) return 'Feed management:\n• Maintain feed level above 20% to avoid Code 40 alerts\n• Layers need ~0.25 lbs/day per bird\n• Check dispenser for jams if feed drops suddenly\n• Refill alerts trigger at 20% — schedule refill before then';
  if (q.includes('clean') || q.includes('waste')) return 'Cleaning cycles:\n• Run daily or every other day for healthy ammonia levels\n• The scraper arm sweeps the floor surface\n• Duration: up to 5 minutes per cycle\n• Do not run while chickens are on the floor — the system checks occupancy\n• Code 30/31 indicates a scraper fault — check for jams';
  if (q.includes('code 50') || q.includes('code50')) return 'Code 50 — Temperature Critical:\n• Triggered when temp exceeds 90°F or drops below 32°F\n• >90°F: Open all vents, activate fans, provide shade and cold water immediately\n• <32°F: Activate heat lamp, check for drafts, add extra bedding\n• Verify DHT22 sensor reading with a manual thermometer to rule out sensor fault';
  return 'I can help with: sensor readings, diagnostic codes, cleaning cycles, feeding schedules, temperature management, egg collection, and flock health. Deploy Firebase Functions with your Anthropic API key to enable full AI responses. What would you like to know?';
}
