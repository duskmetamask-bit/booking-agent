# Booking Agent — PRD.md

## 1. Problem Statement

Service businesses lose leads to phone tag. A prospect calls to book an appointment, gets voicemail, leaves a message, waits for a callback — and never hears back. Or they call during business hours, wait on hold, and give up. Phone-first businesses are hemorrhaging leads in 2026 because AI booking exists but hasn't been deployed to the SMB market.

---

## 2. User Stories

### As a Prospect (Caller)
- I call the business and reach a friendly AI within 1 ring
- I can speak naturally — no "press 1 for..." or "please hold"
- The AI captures my name, service needed, and preferred time
- The AI checks real availability and offers me slots
- I confirm and receive a booking — no follow-up call needed
- I receive an email confirmation

### As the Business Owner
- I get a Telegram notification the moment a booking is made
- The notification contains: caller name, phone, email, service, date/time
- All calls and bookings are logged in Supabase for review
- I can see no-shows, call outcomes, and conversion rates
- I never miss a booking opportunity to voicemail

---

## 3. Implementation Decisions

### Stack: VAPI + n8n + Cal.com + Supabase + MiniMax
- **VAPI:** Handles phone line, voice conversation, function calling
- **n8n:** Orchestrates the post-call workflow (AI qualification, Cal.com booking, Telegram notification, Supabase logging)
- **Cal.com:** Actual calendar + booking engine (self-hosted on VPS)
- **Supabase:** Logging database (calls, appointments)
- **MiniMax:** LLM for lead qualification + voice

### Why not Zapier/Make?
- n8n is self-hosted (data stays on VPS)
- n8n has native VAPI webhook support
- n8n has native Cal.com node
- Already running on VPS

### Why not Voiceflow/Retell?
- VAPI is cheaper and more developer-friendly
- Function calling built-in
- MiniMax as the LLM keeps costs low

---

## 4. VAPI Configuration

```json
{
  "name": "Booking Agent",
  "model": "mini-max/max-01",
  "provider": "openai",
  "voice": "alloy",
  "serverUrl": "https://[vps-ip]:5678/webhook/booking-agent",
  "assistantPrompt": "You are a friendly, professional booking assistant for [Business Name]. Be warm, conversational, and efficient. Your goal is to capture the caller's name, understand what service they need, check calendar availability, and book an appointment. Never say 'I don't know' or 'I can't help with that' — always route to the right action. Keep responses under 15 words.",
  "functions": [
    {
      "name": "check_availability",
      "description": "Check Cal.com for available slots",
      "parameters": {
        "type": "object",
        "properties": {
          "date": {"type": "string", "description": "Date in YYYY-MM-DD format"},
          "duration": {"type": "integer", "description": "Duration in minutes"}
        }
      }
    },
    {
      "name": "book_appointment",
      "description": "Book an appointment in Cal.com",
      "parameters": {
        "type": "object",
        "properties": {
          "name": {"type": "string"},
          "email": {"type": "string"},
          "phone": {"type": "string"},
          "date": {"type": "string"},
          "time": {"type": "string"},
          "service": {"type": "string"}
        }
      }
    },
    {
      "name": "notify_owner",
      "description": "Send booking notification to owner via Telegram",
      "parameters": {
        "type": "object",
        "properties": {
          "caller_name": {"type": "string"},
          "service": {"type": "string"},
          "date_time": {"type": "string"},
          "phone": {"type": "string"},
          "email": {"type": "string"}
        }
      }
    }
  ]
}
```

---

## 5. n8n Workflow

```
Trigger: POST /webhook/booking-agent
(Auth: x-api-key header)

Node 1 — VAPI Webhook
- Receives: call_id, duration, recording_url, transcript

Node 2 — MiniMax (Qualify)
- System: Extract JSON {name, email, phone, service_type, intent_level, notes}
- Input: transcript

Node 3 — Cal.com (Check Availability)
- Action: getAvailableSlots
- Input: date range, duration

Node 4 — Cal.com (Book — after caller confirms slot)
- Action: createBooking
- Input: name, email, slot start/end

Node 5 — Telegram (Owner Notification)
- Chat ID: [owner's Telegram chat ID]
- Message: New booking template

Node 6 — Supabase (Log Call)
- Table: calls
- Insert: vapi_call_id, caller_number, duration, outcome

Node 7 — Supabase (Log Booking)
- Table: appointments
- Insert: caller details, booking details
```

---

## 6. Cal.com Setup

### Event Type: Discovery Call
- Duration: 30 minutes
- Location: Phone call (or video link if preferred)
- Booking link: cal.com/[username]/discovery-call
- Confirmation page: shows "We have received your booking"

### API Integration
- n8n uses Cal.com API v1
- Auth: Bearer token (stored in n8n credentials)
- Endpoints used:
  - `GET /availability/slots?eventTypeId=X&startTime=X&endTime=X`
  - `POST /bookings`

---

## 7. Supabase Schema

```sql
-- See SPEC.md for full schema

-- Key tables:
-- calls: vapi_call_id, caller_number, duration_seconds, outcome, created_at
-- appointments: caller_name, caller_email, caller_phone, service_type,
--                booked_at, cal_event_id, owner_notified, created_at

-- RLS: owner (authenticated user) can read all
-- RLS: service role can insert
```

---

## 8. Testing Plan

### Manual Tests
1. Call the VAPI number → verify greeting
2. Say a name → verify it captures correctly
3. Ask for availability → verify Cal.com check
4. Confirm a slot → verify booking created
5. Check Telegram → verify owner notification
6. Query Supabase → verify call + booking logged

### Automated Tests
- VAPI test call via API
- n8n workflow test with mock payload
- Supabase RLS test (unauthorized access blocked)

---

## 9. Out of Scope

- SMS reminders (Phase 2)
- Rescheduling / cancellation via voice
- Multi-timezone
- Multiple staff calendars
- Google Calendar sync
- Video meeting links
- Multi-language support

---

## 10. Success Metrics

- 100% of calls answered by AI (no voicemail unless explicitly declined)
- Booking rate: 60%+ of qualified calls result in a booking
- Owner notification: delivered within 10 seconds of booking
- Supabase logging: 100% of calls logged
- Cost per booking: < $0.10 (VAPI $0.001/min + MiniMax)
