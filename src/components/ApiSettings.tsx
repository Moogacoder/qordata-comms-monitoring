import React, { useState } from 'react';
import { Key, Copy, Plus, Terminal, RefreshCw, Send, Check } from 'lucide-react';
import type { ApiCredentials } from '../types';

interface ApiSettingsProps {
  apiKeys: ApiCredentials[];
  onCreateKey: (desc: string) => Promise<void>;
  onTriggerIngest: (payload: { sender: string; recipient: string; subject: string; body: string; source: string }, apiKey: string) => Promise<any>;
}

export const ApiSettings: React.FC<ApiSettingsProps> = ({
  apiKeys,
  onCreateKey,
  onTriggerIngest
}) => {
  const [description, setDescription] = useState('');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  
  // REST Simulator State
  const [simSender, setSimSender] = useState('agent.rep@qordata.com');
  const [simRecipient, setSimRecipient] = useState('dr.watson@clinic.org');
  const [simSubject, setSimSubject] = useState('Cardiorex speaker invitation and benefits');
  const [simBody, setSimBody] = useState('Hi Dr. Watson, I can sponsor your registration to the Oncology Conference ($3,500) if you prescribe at least 10 scripts of Cardiorex this month. Let me know if you can commit to that.');
  const [simSource, setSimSource] = useState('EMAIL');
  
  const [isSending, setIsSending] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  const handleCopy = (keyText: string, keyId: string) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKeyId(keyId);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return;
    await onCreateKey(description);
    setDescription('');
  };

  const handleSendSimulate = async () => {
    if (apiKeys.length === 0) {
      alert('Please generate an API Key first.');
      return;
    }
    setIsSending(true);
    setSimResult(null);
    try {
      const result = await onTriggerIngest({
        sender: simSender,
        recipient: simRecipient,
        subject: simSubject,
        body: simBody,
        source: simSource
      }, apiKeys[0].apiKey);
      setSimResult(result);
    } catch (err: any) {
      setSimResult({ error: err.message || 'Ingestion failed.' });
    } finally {
      setIsSending(false);
    }
  };

  // Mock curl command matching current inputs
  const curlCommand = `curl -X POST "https://qordata-comms-mon-2026.run.app/api/ingest" \\
  -H "Authorization: Bearer ${apiKeys[0]?.apiKey || 'qd_live_your_api_key'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "sender": "${simSender}",
    "recipient": "${simRecipient}",
    "subject": "${simSubject}",
    "source": "${simSource}",
    "body": "${simBody.replace(/'/g, "\\'")}"
  }'`;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'stretch' }}>
      
      {/* LEFT PANEL: API Keys list and generation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Keys List Card */}
        <div className="glass-card">
          <h3 className="heading-md" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Key size={20} style={{ color: 'var(--color-primary)' }} />
            <span>Active Integration API Credentials</span>
          </h3>

          <form onSubmit={handleCreate} style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <input
              id="input-key-desc"
              type="text"
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="API Key Name / Client Application Description..."
              required
              style={{ flex: 1 }}
            />
            <button
              id="btn-generate-key"
              type="submit"
              className="btn-primary"
              style={{ padding: '0 16px', height: '45px' }}
            >
              <Plus size={16} />
              <span>Generate Key</span>
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {apiKeys.length > 0 ? (
              apiKeys.map(key => (
                <div
                  key={key.keyId}
                  style={{
                    padding: '16px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                      {key.description}
                    </span>
                    <span className="badge badge-none" style={{ fontSize: '0.6rem' }}>
                      Calls: {key.callsCount}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-input"
                      value={key.apiKey}
                      readOnly
                      style={{ 
                        flex: 1, 
                        fontFamily: 'monospace', 
                        fontSize: '0.75rem', 
                        padding: '6px 12px', 
                        background: '#f1f5f9',
                        color: 'var(--color-text-muted)',
                        border: '1px dashed var(--color-border)'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(key.apiKey, key.keyId)}
                      className="btn-secondary"
                      style={{ padding: '6px 10px' }}
                    >
                      {copiedKeyId === key.keyId ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                    <span>Generated: {new Date(key.createdDate).toLocaleDateString()}</span>
                    {key.lastUsed && (
                      <span>Last Used: {new Date(key.lastUsed).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                No active API keys found. Generate one to enable integrations.
              </div>
            )}
          </div>
        </div>

        {/* Webhook Configuration Card */}
        <div className="glass-card">
          <h3 className="heading-md" style={{ marginBottom: '12px' }}>Outgoing Ingestion Webhooks</h3>
          <p className="text-muted" style={{ marginBottom: '16px' }}>
            Register endpoints to notify external compliance applications (such as ServiceNow or Veeva Vault) immediately when AI flags high-risk communications.
          </p>
          <div className="form-group">
            <label className="form-label" htmlFor="input-webhook">Webhook Listener URL</label>
            <input
              id="input-webhook"
              type="text"
              className="form-input"
              value="https://qordata-compliance.webhook.office.com/webhookb2/c8b329..."
              disabled
              style={{ background: '#f1f5f9', color: 'var(--color-text-muted)' }}
            />
          </div>
          <button className="btn-secondary" disabled style={{ width: '100%', justifyContent: 'center' }}>
            Configure Webhook Receivers (Beta)
          </button>
        </div>

      </div>

      {/* RIGHT PANEL: REST Ingestion Simulator playground */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h3 className="heading-md" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Terminal size={20} style={{ color: 'var(--color-primary)' }} />
            <span>Interactive REST API Simulator</span>
          </h3>
          <p className="text-muted" style={{ fontSize: '0.8rem' }}>
            Simulate a Salesforce / Veeva CRM pushing emails into the qordata AI compliance queue.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem' }}>Sender Email</label>
              <input
                id="sim-sender"
                type="text"
                className="form-input"
                value={simSender}
                onChange={(e) => setSimSender(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem' }}>Recipient Email</label>
              <input
                id="sim-recipient"
                type="text"
                className="form-input"
                value={simRecipient}
                onChange={(e) => setSimRecipient(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem' }}>Subject Line</label>
              <input
                id="sim-subject"
                type="text"
                className="form-input"
                value={simSubject}
                onChange={(e) => setSimSubject(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem' }}>Channel Source</label>
              <select
                id="sim-source"
                value={simSource}
                onChange={(e) => setSimSource(e.target.value)}
                className="form-input"
                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              >
                <option value="EMAIL">Email</option>
                <option value="TEXT">Text Message</option>
                <option value="SOCIAL">Social Media</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.7rem' }}>Communication Body</label>
            <textarea
              id="sim-body"
              className="form-input"
              rows={4}
              value={simBody}
              onChange={(e) => setSimBody(e.target.value)}
              style={{ fontSize: '0.85rem', lineHeight: '1.4' }}
            />
          </div>

          {/* cURL Console Display */}
          <div style={{
            background: '#0f172a',
            color: '#94a3b8',
            fontFamily: 'monospace',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.7rem',
            overflowX: 'auto',
            whiteSpace: 'pre',
            border: '1px solid #1e293b'
          }}>
            {curlCommand}
          </div>

          <button
            id="btn-simulate-post"
            type="button"
            onClick={handleSendSimulate}
            disabled={isSending || apiKeys.length === 0}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {isSending ? <RefreshCw size={16} className="logo-spin" /> : <Send size={16} />}
            <span>Execute Ingestion POST</span>
          </button>
        </div>

        {/* REST Response Console */}
        {simResult && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            background: '#1e293b',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #334155',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            color: '#38bdf8',
            overflowY: 'auto',
            maxHeight: '220px'
          }}>
            <div style={{ color: '#fff', fontWeight: 'bold', borderBottom: '1px solid #475569', paddingBottom: '4px' }}>
              Response payload (200 OK)
            </div>
            <pre style={{ whiteSpace: 'pre-wrap', color: simResult.error ? '#ef4444' : '#38bdf8' }}>
              {JSON.stringify(simResult, null, 2)}
            </pre>
          </div>
        )}
      </div>

    </div>
  );
};
