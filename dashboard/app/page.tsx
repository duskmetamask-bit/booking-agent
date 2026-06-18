// Mock data — replace with Supabase fetch in production
const mockCalls = [
  { id: 'call_001', caller_number: '+614****5678', duration_seconds: 145, outcome: 'booked', created_at: '2026-06-18T09:23:00Z' },
  { id: 'call_002', caller_number: '+614****6789', duration_seconds: 67, outcome: 'no_answer', created_at: '2026-06-18T10:05:00Z' },
  { id: 'call_003', caller_number: '+614****7890', duration_seconds: 203, outcome: 'voicemail', created_at: '2026-06-17T14:30:00Z' },
  { id: 'call_004', caller_number: '+614****8901', duration_seconds: 91, outcome: 'declined', created_at: '2026-06-17T16:12:00Z' },
  { id: 'call_005', caller_number: '+614****9012', duration_seconds: 178, outcome: 'booked', created_at: '2026-06-16T11:00:00Z' },
];

const mockAppointments = [
  { id: 'apt_001', caller_name: 'Jane Smith', caller_email: 'jane@example.com', service_type: 'Discovery Call', booked_at: '2026-06-20T14:00:00Z', cal_confirmed: true },
  { id: 'apt_002', caller_name: 'Michael Chen', caller_email: 'mchen@startup.io', service_type: 'Strategy Session', booked_at: '2026-06-21T10:00:00Z', cal_confirmed: true },
  { id: 'apt_003', caller_name: 'Sarah Williams', caller_email: 'sarah.w@agency.co', service_type: 'Discovery Call', booked_at: '2026-06-22T15:30:00Z', cal_confirmed: false },
];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function outcomeClass(outcome: string): string {
  const map: Record<string, string> = {
    booked: 'badge-booked',
    no_answer: 'badge-no_answer',
    voicemail: 'badge-voicemail',
    declined: 'badge-declined',
  };
  return `badge ${map[outcome] ?? 'badge-no_answer'}`;
}

function outcomeLabel(outcome: string): string {
  return outcome.replace('_', ' ');
}

export default function DashboardPage() {
  const totalCalls = mockCalls.length;
  const bookedCalls = mockCalls.filter(c => c.outcome === 'booked').length;
  const bookingRate = totalCalls > 0 ? Math.round((bookedCalls / totalCalls) * 100) : 0;
  const totalAppointments = mockAppointments.length;
  const confirmedAppointments = mockAppointments.filter(a => a.cal_confirmed).length;
  const avgCallDuration = Math.round(mockCalls.reduce((s, c) => s + c.duration_seconds, 0) / totalCalls);

  return (
    <div>
      {/* Agent Status */}
      <div className="agent-panel">
        <div className="agent-status-row">
          <div>
            <span className="agent-status-dot" />
            <span className="agent-status-text">Booking Agent — Active</span>
          </div>
          <a href="/settings" className="btn btn-secondary">Configure</a>
        </div>
        <div className="agent-detail">
          VAPI connected &bull; Cal.com synced &bull; MiniMax AI active
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-row">
        <div className="kpi-card">
          <div className="kpi-label">Total Calls</div>
          <div className="kpi-value">{totalCalls}</div>
          <div className="kpi-sub">Last 7 days</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Bookings</div>
          <div className="kpi-value">{bookedCalls}</div>
          <div className="kpi-sub">{bookingRate}% booking rate</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Upcoming</div>
          <div className="kpi-value">{totalAppointments}</div>
          <div className="kpi-sub">{confirmedAppointments} confirmed</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Avg Call</div>
          <div className="kpi-value">{formatDuration(avgCallDuration)}</div>
          <div className="kpi-sub">avg duration</div>
        </div>
      </div>

      {/* Appointments */}
      <h2 className="section-heading" id="appointments">Upcoming Appointments</h2>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Service</th>
              <th>Date</th>
              <th>Time</th>
              <th>Email</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {mockAppointments.map(apt => (
              <tr key={apt.id}>
                <td style={{ fontWeight: 500 }}>{apt.caller_name}</td>
                <td>{apt.service_type}</td>
                <td>{formatDate(apt.booked_at)}</td>
                <td>{formatTime(apt.booked_at)}</td>
                <td style={{ color: 'var(--ink-subtle)' }}>{apt.caller_email}</td>
                <td>
                  <span className={apt.cal_confirmed ? 'badge badge-booked' : 'badge badge-no_answer'}>
                    {apt.cal_confirmed ? 'Confirmed' : 'Pending'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent Calls */}
      <h2 className="section-heading" id="calls">Recent Calls</h2>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Call ID</th>
              <th>Caller</th>
              <th>Duration</th>
              <th>Outcome</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {mockCalls.map(call => (
              <tr key={call.id}>
                <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--ink-subtle)' }}>{call.id}</td>
                <td>{call.caller_number}</td>
                <td>{formatDuration(call.duration_seconds)}</td>
                <td><span className={outcomeClass(call.outcome)}>{outcomeLabel(call.outcome)}</span></td>
                <td>{formatDate(call.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Settings Panel */}
      <h2 className="section-heading" id="settings">Settings</h2>
      <div className="agent-panel">
        <div style={{ display: 'grid', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--ink-subtle)', marginBottom: '4px' }}>BUSINESS NAME</div>
            <div style={{ fontSize: '14px', color: 'var(--ink)' }}>[Your Business Name]</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--ink-subtle)', marginBottom: '4px' }}>VAPI PHONE NUMBER</div>
            <div style={{ fontSize: '14px', color: 'var(--ink)' }}>+1 (555) 000-0000</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--ink-subtle)', marginBottom: '4px' }}>CAL.COM EVENT TYPE</div>
            <div style={{ fontSize: '14px', color: 'var(--ink)' }}>Discovery Call (30 min)</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--ink-subtle)', marginBottom: '4px' }}>TELEGRAM NOTIFICATIONS</div>
            <div style={{ fontSize: '14px', color: 'var(--semantic-success)' }}>Active</div>
          </div>
        </div>
      </div>
    </div>
  );
}
