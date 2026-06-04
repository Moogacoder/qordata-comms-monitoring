import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, RefreshCw, Server, Users } from 'lucide-react';
import type { ExchangeConnection, ExchangeMailbox } from '../types';

interface ExchangeSettingsProps {
  config: ExchangeConnection;
  onSaveConfig: (updatedConfig: ExchangeConnection) => Promise<void>;
  onTestConnection: (creds: { tenantId: string; clientId: string; clientSecret: string }) => Promise<string[]>;
}

export const ExchangeSettings: React.FC<ExchangeSettingsProps> = ({
  config,
  onSaveConfig,
  onTestConnection
}) => {
  const [tenantId, setTenantId] = useState(config.tenantId);
  const [clientId, setClientId] = useState(config.clientId);
  const [clientSecret] = useState('••••••••••••••••••••••••••••••••');
  const [rawSecret, setRawSecret] = useState('');
  const [isEditingSecret, setIsEditingSecret] = useState(false);
  const [syncFrequency, setSyncFrequency] = useState(config.syncFrequencyMinutes);
  const [mailboxes, setMailboxes] = useState<ExchangeMailbox[]>(config.mailboxes);
  
  const [isTesting, setIsTesting] = useState(false);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<'SUCCESS' | 'ERROR' | null>(null);

  const handleToggleMailbox = (email: string) => {
    const updated = mailboxes.map(mb => {
      if (mb.email === email) {
        const nextMonitored = !mb.monitored;
        return {
          ...mb,
          monitored: nextMonitored,
          status: nextMonitored ? 'ACTIVE' : 'INACTIVE' as any,
          lastScanned: nextMonitored ? new Date().toISOString() : undefined
        };
      }
      return mb;
    });
    setMailboxes(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ExchangeConnection = {
      ...config,
      tenantId,
      clientId,
      syncFrequencyMinutes: syncFrequency,
      mailboxes
    };
    if (isEditingSecret && rawSecret) {
      updated.clientSecret = rawSecret;
    }
    await onSaveConfig(updated);
    setIsEditingSecret(false);
    alert('Exchange sync configurations updated successfully.');
  };

  const handleTest = async () => {
    if (!tenantId || !clientId) {
      alert('Please enter Tenant ID and Client ID to test connection.');
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    setTestLogs(['Initializing connection to login.microsoftonline.com...']);
    
    try {
      const logs = await onTestConnection({
        tenantId,
        clientId,
        clientSecret: isEditingSecret ? rawSecret : (config.clientSecret || 'demosecret')
      });
      
      // Print logs sequentially to simulate action
      let currentLogs: string[] = [];
      for (let i = 0; i < logs.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 600));
        currentLogs.push(logs[i]);
        setTestLogs([...currentLogs]);
      }
      setTestResult('SUCCESS');
    } catch (err) {
      setTestLogs(prev => [...prev, 'CRITICAL ERROR: Failed to exchange Client Secret for token.', 'Connection aborting.']);
      setTestResult('ERROR');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', alignItems: 'stretch' }}>
      
      {/* Configuration Form */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 className="heading-md" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Server size={20} style={{ color: 'var(--color-primary)' }} />
          <span>Microsoft Exchange API Credentials</span>
        </h3>

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label" htmlFor="input-tenant">Microsoft Tenant ID (Azure AD)</label>
            <input
              id="input-tenant"
              type="text"
              className="form-input"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder="e.g. 8f244199-a681-42cb-b1b0-2b1574ce8356"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="input-client">Application (Client) ID</label>
            <input
              id="input-client"
              type="text"
              className="form-input"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="e.g. d6f18962-d28c-4fc9-b59a-df18902ef82b"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="input-secret">Client Secret (Azure AD OAuth)</label>
            {isEditingSecret ? (
              <input
                id="input-secret"
                type="text"
                className="form-input"
                value={rawSecret}
                onChange={(e) => setRawSecret(e.target.value)}
                placeholder="Enter client secret value"
                required
              />
            ) : (
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  id="input-secret-masked"
                  type="text"
                  className="form-input"
                  value={clientSecret}
                  disabled
                  style={{ flex: 1, background: 'var(--color-surface-hover)' }}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsEditingSecret(true)}
                  style={{ padding: '0 16px' }}
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="input-frequency">Scanning Sync Frequency</label>
            <select
              id="input-frequency"
              className="form-input"
              value={syncFrequency}
              onChange={(e) => setSyncFrequency(parseInt(e.target.value))}
            >
              <option value={5}>Every 5 minutes</option>
              <option value={15}>Every 15 minutes</option>
              <option value={60}>Every hour</option>
              <option value={1440}>Once daily</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              id="btn-test-exchange"
              type="button"
              onClick={handleTest}
              disabled={isTesting}
              className="btn-secondary"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              {isTesting ? <RefreshCw size={16} className="logo-spin" /> : <RefreshCw size={16} />}
              <span>Test Connection</span>
            </button>

            <button
              id="btn-save-exchange"
              type="submit"
              className="btn-primary"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <span>Save Configuration</span>
            </button>
          </div>
        </form>

        {/* Connection Diagnostics Console */}
        {testLogs.length > 0 && (
          <div style={{
            background: 'var(--color-text-main)',
            color: '#10b981',
            fontFamily: 'monospace',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8rem',
            lineHeight: '1.6',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            marginTop: '12px'
          }}>
            <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #334155', paddingBottom: '4px' }}>
              Connection Logs
            </div>
            {testLogs.map((log, idx) => (
              <div key={idx}>{`> ${log}`}</div>
            ))}
            {testResult === 'SUCCESS' && (
              <div style={{ color: '#10b981', fontWeight: 'bold', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={14} />
                <span>OAUTH CREDENTIALS VALIDATED SUCCESSFULLY</span>
              </div>
            )}
            {testResult === 'ERROR' && (
              <div style={{ color: '#ef4444', fontWeight: 'bold', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldAlert size={14} />
                <span>CONNECTION DIAGNOSTICS FAILURE</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Monitored Mailboxes Sidebar */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h3 className="heading-md" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Users size={20} style={{ color: 'var(--color-primary)' }} />
            <span>Monitored Mailboxes</span>
          </h3>
          <p className="text-muted" style={{ fontSize: '0.8rem' }}>
            Select the corporate Exchange mailboxes the AI agent should scan.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
          {mailboxes.map(mb => (
            <div
              key={mb.email}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                background: mb.monitored ? 'var(--color-surface)' : '#fdfdfd'
              }}
            >
              <div style={{ minWidth: 0, flex: 1, marginRight: '12px' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 650, color: 'var(--color-text-main)' }}>{mb.name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mb.email}</p>
                {mb.monitored && mb.lastScanned && (
                  <p style={{ fontSize: '0.65rem', color: 'var(--color-secondary)', fontWeight: 500, marginTop: '4px' }}>
                    Last Scanned: {new Date(mb.lastScanned).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>

              <div>
                <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '20px' }}>
                  <input
                    type="checkbox"
                    checked={mb.monitored}
                    onChange={() => handleToggleMailbox(mb.email)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: mb.monitored ? 'var(--color-secondary)' : '#cbd5e1',
                    transition: '0.3s',
                    borderRadius: '20px'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '14px', width: '14px',
                      left: mb.monitored ? '22px' : '4px',
                      bottom: '3px',
                      backgroundColor: 'white',
                      transition: '0.3s',
                      borderRadius: '50%'
                    }}></span>
                  </span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
