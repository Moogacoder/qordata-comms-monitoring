import React from 'react';
import { 
  BarChart as ReBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ReTooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  Database,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';
import type { CommunicationItem, DashboardStats } from '../types';

interface DashboardProps {
  stats: DashboardStats;
  comms: CommunicationItem[];
  exchangeStatus: string;
  exchangeConfig?: any;
  auditLogs?: any[];
  setActiveTab: (tab: string) => void;
  setSelectedComm: (comm: CommunicationItem | null) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  comms,
  exchangeStatus,
  exchangeConfig,
  auditLogs = [],
  setActiveTab,
  setSelectedComm
}) => {
  // Setup data for category chart
  const categoryData = [
    { name: 'Off-Label Promotion', value: stats.categoryBreakdown.OFF_LABEL_PROMOTION, color: '#a78bfa' },
    { name: 'Kickbacks & Bribery', value: stats.categoryBreakdown.KICKBACK_BRIBERY, color: '#fca5a5' },
    { name: 'Med/Comm Boundary', value: stats.categoryBreakdown.MEDICAL_COMMERCIAL_BOUNDARY, color: '#fde047' },
    { name: 'HIPAA & PII Leak', value: stats.categoryBreakdown.HIPAA_PII_LEAK, color: '#93c5fd' },
    { name: 'Adverse Event', value: stats.categoryBreakdown.ADVERSE_EVENT_UNREPORTED, color: '#fda4af' }
  ].filter(d => d.value > 0);

  // Setup data for source pie chart
  const sourceData = [
    { name: 'Emails Scanned', value: stats.sourceBreakdown.email, color: '#7c3aed' },
    { name: 'Texts Scanned', value: stats.sourceBreakdown.text, color: '#3b82f6' },
    { name: 'Social Media Channels', value: stats.sourceBreakdown.social, color: '#10b981' }
  ];

  const recentAlerts = comms.filter(c => c.status === 'FLAGGED').slice(0, 4);

  const getRiskCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'OFF_LABEL_PROMOTION': return 'Off-Label Promotion';
      case 'KICKBACK_BRIBERY': return 'Kickbacks / Bribery';
      case 'MEDICAL_COMMERCIAL_BOUNDARY': return 'Med/Comm Boundary';
      case 'HIPAA_PII_LEAK': return 'HIPAA / PII Leak';
      case 'ADVERSE_EVENT_UNREPORTED': return 'Adverse Event Unreported';
      default: return 'None';
    }
  };

  const handleAlertClick = (comm: CommunicationItem) => {
    setSelectedComm(comm);
    setActiveTab('explorer');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* 4 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        
        <div className="glass-card dashboard-item" style={{ borderLeft: '4px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p className="text-muted" style={{ fontWeight: 600 }}>Total Communications</p>
              <h3 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: 'var(--color-text-main)' }}>
                {stats.totalScanned}
              </h3>
            </div>
            <div style={{ background: 'var(--color-primary-glow)', padding: '12px', borderRadius: '50%', color: 'var(--color-primary)' }}>
              <Activity size={24} />
            </div>
          </div>
          <div style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#10b981', fontWeight: 600 }}>+12%</span>
            <span>vs previous week</span>
          </div>
        </div>

        <div className="glass-card dashboard-item" style={{ borderLeft: '4px solid var(--color-risk-high)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p className="text-muted" style={{ fontWeight: 600 }}>High Risk Alerts</p>
              <h3 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: 'var(--color-risk-high)' }}>
                {stats.totalFlagged}
              </h3>
            </div>
            <div style={{ background: 'var(--color-risk-high-bg)', padding: '12px', borderRadius: '50%', color: 'var(--color-risk-high)' }}>
              <ShieldAlert size={24} />
            </div>
          </div>
          <div style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#ef4444', fontWeight: 600 }}>{stats.totalPendingRep}</span>
            <span>pending rep justification</span>
          </div>
        </div>

        <div className="glass-card dashboard-item" style={{ borderLeft: '4px solid var(--color-secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p className="text-muted" style={{ fontWeight: 600 }}>Resolved Violations</p>
              <h3 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: 'var(--color-secondary)' }}>
                {stats.totalDismissed + stats.totalEscalated}
              </h3>
            </div>
            <div style={{ background: 'var(--color-secondary-glow)', padding: '12px', borderRadius: '50%', color: 'var(--color-secondary)' }}>
              <ShieldCheck size={24} />
            </div>
          </div>
          <div style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{stats.totalEscalated}</span>
            <span>escalated to Legal/HR</span>
          </div>
        </div>

        <div className="glass-card dashboard-item" style={{ borderLeft: '4px solid var(--color-risk-low)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p className="text-muted" style={{ fontWeight: 600 }}>Exchange Sync Status</p>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '14px', color: exchangeStatus === 'CONNECTED' ? 'var(--color-secondary)' : '#ef4444' }}>
                {exchangeStatus === 'CONNECTED' ? 'ACTIVE SYNCING' : 'DISCONNECTED'}
              </h3>
            </div>
            <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '12px', borderRadius: '50%', color: 'var(--color-risk-low)' }}>
              <Database size={24} />
            </div>
          </div>
          <div style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Active mon. mailboxes:</span>
            <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
              {exchangeConfig?.mailboxes?.filter((m: any) => m.monitored)?.length || 0} / {exchangeConfig?.mailboxes?.length || 0}
            </span>
          </div>
        </div>

      </div>

      {/* Grid for charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* Violation category bar chart */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
          <h3 className="heading-md" style={{ marginBottom: '20px' }}>AI Compliance Violation Breakdown</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={categoryData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <ReTooltip 
                    contentStyle={{ background: 'var(--color-glass)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                    labelStyle={{ fontWeight: 'bold', color: 'var(--color-text-main)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </ReBarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                No violations flagged currently.
              </div>
            )}
          </div>
        </div>

        {/* Source breakdown Pie chart */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
          <h3 className="heading-md" style={{ marginBottom: '20px' }}>Communication Channels</h3>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="70%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ReTooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', padding: '0 10px', fontSize: '0.8rem' }}>
              {sourceData.map((entry, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: entry.color }}></span>
                    <span style={{ color: 'var(--color-text-muted)' }}>{entry.name}</span>
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Grid for Recent Alerts and Ingestion Logs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
        
        {/* Recent Alerts List */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 className="heading-md">Recent Flagged Communications</h3>
            <button 
              className="btn-secondary" 
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              onClick={() => setActiveTab('explorer')}
            >
              <span>Explore All</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {recentAlerts.length > 0 ? (
              recentAlerts.map(alert => (
                <div 
                  key={alert.id}
                  onClick={() => handleAlertClick(alert)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  className="dashboard-item"
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'var(--color-risk-high)', marginTop: '2px' }}>
                      <AlertTriangle size={18} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 650, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
                          {alert.sender}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          • {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {alert.subject || '(No Subject)'}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {alert.body}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <span className="badge badge-high" style={{ fontSize: '0.65rem' }}>
                      Score: {alert.riskScore}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                      {getRiskCategoryLabel(alert.riskCategory)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ display: 'flex', padding: '40px', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                No active compliance alerts.
              </div>
            )}
          </div>
        </div>

        {/* Sync Info / Activity */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', maxHeight: '400px', overflowY: 'auto' }}>
          <h3 className="heading-md" style={{ marginBottom: '20px' }}>System Audit Logs</h3>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {auditLogs && auditLogs.length > 0 ? (
              auditLogs.slice(0, 5).map((log: any) => (
                <div key={log.id} style={{ fontSize: '0.85rem', borderLeft: `2px solid ${log.action.includes('STATUS') ? 'var(--color-primary)' : 'var(--color-secondary)'}`, paddingLeft: '12px' }}>
                  <p style={{ fontWeight: 600 }}>{log.action.replace(/_/g, ' ')}</p>
                  <p style={{ color: 'var(--color-text-main)', fontSize: '0.8rem', marginTop: '2px' }}>{log.details}</p>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem', marginTop: '2px' }}>
                    {new Date(log.timestamp).toLocaleString()} • User: {log.user}
                  </p>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px' }}>
                No recent system logs.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
