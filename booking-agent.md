# Booking Agent — SPEC.md

## 1. Concept & Vision

Booking Agent is a voice-first AI agent that handles appointment scheduling via phone and chat. It converse naturally with callers, qualifies their needs, checks Cal.com for availability, and books the slot — ending phone tag entirely. Owner gets instant notification with caller details.

**Type:** Build B — VAPI voice agent + n8n workflow + AI qualification + Cal.com + owner notification
**Target:** Service businesses (clinics, salons, consultancies, agencies) losing leads to phone tag.

---

## 2. Design Language

**Reference:** Linear dark aesthetic (CODING-SCOUT-REGISTER 2026-06-16)
- Canvas: `#010102`
- Surface-1: `#0f1011`
- Surface-2: `#141516`
- Surface-3: `#18191a`
- Hairline: `#23252a`
- Accent: `#5e6ad2` (primary), `#828fff` (hover)
- Ink: `#f7f8f8` (primary), `#d0d6e0` (muted), `#8a8f98` (subtle)
- Border radius: xs:4px, sm:6px, md:8px, lg:12px, xl:16px, pill:9999px

**Typography:** Inter variable (Google Fonts), font-display: swap
- Display: 80px/56px/40px, weight 600, tight letter-spacing
- Headline: 28px, weight 600
- Body: 16px, weight 400, line-height 1.50
- Caption: 12px, weight 400

**Spacing:** 4px base unit (xxs:4, xs:8, sm:12, md:16, lg:24, xl:32, xxl:48)

**Motion:** Grid dot animation (1600ms steps), agent grid (3200ms steps)

**Assets:** Lucide icons, aria-labels, skip-to-content link

---

## 3. Layout & Structure

### A. VAPI Voice Agent (primary product)

```
/vapi
  /booking-agent.json    — VAPI configuration (voice, model, tools)
```

**VAPI tools (function calling):**
- `check_availability(date, duration)` → queries Cal.com
- `book_appointment(name, email, phone, date, time, notes)` → books Cal.com
- `send_confirmation(appointment_id, contact)` → emails/SMS confirmation
- `notify_owner(appointment_details)` → Telegram/email to owner

### B. n8n Workflow

```
n8n workflow: booking-agent
Trigger: VAPI call ended webhook
Nodes:
  1. VAPI Webhook (call ended)
  2. MiniMax (qualify lead — extract name/email/need)
  3. Cal.com Node (check availability, book slot)
  4. Telegram Node (notify owner with booking details)
  5. Supabase (log call + booking)
```

### C. Supabase Schema

```sql
-- calls: each inbound call record
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vapi_call_id TEXT,
  caller_number TEXT,
  duration_seconds INTEGER,
  outcome TEXT, -- 'booked' | 'no_answer' | 'voicemail' | 'declined'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- appointments: successfully booked appointments
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vapi_call_id TEXT REFERENCES calls(vapi_call_id),
  caller_name TEXT,
  caller_email TEXT,
  caller_phone TEXT,
  service_type TEXT,
  booked_at TIMESTAMPTZ,
  cal_event_id TEXT,
  cal_confirmed BOOLEAN DEFAULT false,
  owner_notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: owner-only access
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
```

---

## 4. Features & Interactions

### Voice Conversation Flow

1. **Greeting:** "Hi, you've reached [Business Name]. I'm their AI booking assistant. What name should I use?"
2. **Capture name:** "Great [Name], what are you getting in touch about today?"
3. **Capture need:** "Thanks. And what type of service or appointment are you looking for?"
4. **Check availability:** "Let me check our calendar." [Tool: check_availability]
5. **Offer slots:** "We have [Slot A] and [Slot B]. Which works for you?"
6. **Confirm:** "Perfect, you're booked for [Day, Date] at [Time]. What's the best email to send confirmation to?"
7. **Capture email + close:** "You're all set. You'll receive a confirmation shortly. Thanks [Name], speak soon!"
8. **Post-call:** Owner notified via Telegram within 10 seconds.

### Owner Notification (Telegram)

```
New Booking
Name: Jane Smith
Service: Discovery Call
Date: Tuesday, June 23 at 2:00 PM
Phone: 0412 345 678
Email: jane@example.com
Status: Booked in Cal.com
```

### Fallback Behaviors

- **No availability:** "I'm sorry, we don't have any openings that day. Would you like me to suggest an alternative day?"
- **Voicemail:** Log call + voicemail, notify owner for manual callback
- **Declined/too busy:** "I understand. Feel free to call back when you're ready to book. Thanks!"
- **No answer after 3 retries:** Notify owner with "missed call from [number]"

### MiniMax Qualification Prompt

```
Extract the following from this conversation transcript:
- caller_name: the caller's full name
- caller_email: email if given, else null
- caller_phone: phone number if captured
- service_type: what they want to book
- intent_level: high | medium | low
- notes: any other context

Return as JSON.
```

---

## 5. Component Inventory

### VAPI Configuration

```json
{
  "name": "Booking Agent",
  "model": "mini-max/max-01",
  "provider": "openai",
  "voice": "alloy",
  "serverUrl": "[n8n webhook URL]",
  "assistantPrompt": "You are a friendly, professional booking assistant. Be conversational but efficient. Never say 'I don't know' — always route to the right action.",
  "functions": ["check_availability", "book_appointment", "send_confirmation", "notify_owner"]
}
```

### n8n Workflow Nodes

1. **VAPI Webhook** — POST /webhook/booking-agent call ended
2. **MiniMax Node** — Extract + qualify lead (OpenAI-compatible)
3. **Cal.com Node** — Get available slots / Create booking
4. **Telegram Node** — Send owner notification
5. **Supabase Node** — Log to calls + appointments tables

### Cal.com Setup Required

- Calendar connected to Cal.com account
- Event type created: "Discovery Call" (30min, 60min)
- API key stored in n8n credentials
- Webhook on booking created → n8n

---

## 6. Technical Approach

### Stack

- **Voice:** VAPI (telephony + LLM + function calling)
- **Workflow:** n8n (self-hosted on VPS)
- **AI:** MiniMax via OpenAI-compatible API
- **Calendar:** Cal.com
- **Database:** Supabase
- **Notifications:** Telegram bot

### n8n Workflow Trigger

```
URL: https://[vps-ip]:5678/webhook/booking-agent
Method: POST
Auth: header x-api-key = [n8n generic credential]
```

### Environment Variables

```
MINIMAX_API_KEY=...
CALCOM_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_OWNER_CHAT_ID=...
VAPI_WEBHOOK_SECRET=...
```

### Deployment

1. VAPI: import `vapi/booking-agent.json`
2. n8n: import `n8n/booking-agent-workflow.json`
3. Cal.com: create event type + copy API key
4. Supabase: run schema.sql
5. Test with test call to VAPI number

---

## 7. Out of Scope

- Multi-timezone handling (single timezone assumed)
- SMS reminders (Phase 2)
- Rescheduling / cancellation flows
- Calendar conflict resolution across multiple staff
- Google Calendar sync
- Video meeting links (Calendly-style)

---

## 8. Success Criteria

- [ ] VAPI call connects and converses naturally
- [ ] Cal.com slot checked in real-time during call
- [ ] Appointment booked in Cal.com with caller info
- [ ] Owner notified via Telegram within 10s of booking
- [ ] Call + booking logged in Supabase
- [ ] Voicemail fallback works when no answer
