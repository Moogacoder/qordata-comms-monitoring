import React, { useState } from 'react';
import { Shield, Sparkles, RefreshCw } from 'lucide-react';
import type { PolicyRule, RiskCategory, RiskSeverity } from '../types';

interface AiPoliciesProps {
  policies: PolicyRule[];
  onUpdatePolicy: (id: string, updated: PolicyRule) => Promise<void>;
  onRunSandbox: (text: string) => Promise<{
    riskScore: number;
    riskCategory: RiskCategory;
    severity: RiskSeverity;
    explanation: string;
    flaggedSentences: string[];
  }>;
}

export const AiPolicies: React.FC<AiPoliciesProps> = ({
  policies,
  onUpdatePolicy,
  onRunSandbox
}) => {
  const [activePolicyId, setActivePolicyId] = useState<string | null>(null);
  
  // Sandbox State
  const [sandboxText, setSandboxText] = useState(
    'Hi doctor, we are hosting a Cardiorex dinner program in New York. We can pay you a speakers fee of $12,000 for a 10 minute presentation. By the way, we really appreciate your support in increasing prescription volume for Cardiorex last quarter!'
  );
  const [isScanning, setIsScanning] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<any>(null);

  const activePolicy = policies.find(p => p.id === activePolicyId);

  const handleToggle = async (policy: PolicyRule) => {
    const updated = { ...policy, enabled: !policy.enabled };
    await onUpdatePolicy(policy.id, updated);
  };

  const handleSavePolicyPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePolicy) return;
    await onUpdatePolicy(activePolicy.id, activePolicy);
    alert('AI System Prompt prompt updated successfully.');
    setActivePolicyId(null);
  };

  const handleSandboxScan = async () => {
    if (!sandboxText.trim()) return;
    setIsScanning(true);
    setSandboxResult(null);
    try {
      const result = await onRunSandbox(sandboxText);
      setSandboxResult(result);
    } catch (err) {
      alert('AI Sandbox Scan failed.');
    } finally {
      setIsScanning(false);
    }
  };

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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', alignItems: 'stretch' }}>
      
      {/* LEFT PANEL: Policy configurations and details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Policies List Card */}
        <div className="glass-card">
          <h3 className="heading-md" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Shield size={20} style={{ color: 'var(--color-primary)' }} />
            <span>AI Life Sciences Policy Rules</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {policies.map(policy => (
              <div
                key={policy.id}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                      {policy.name}
                    </span>
                    <span className={`badge ${policy.severity === 'HIGH' ? 'badge-high' : 'badge-med'}`} style={{ fontSize: '0.6rem', padding: '2px 6px' }}>
                      {policy.severity}
                    </span>
                  </div>

                  <div>
                    <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '36px', height: '18px' }}>
                      <input
                        type="checkbox"
                        checked={policy.enabled}
                        onChange={() => handleToggle(policy)}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute',
                        cursor: 'pointer',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: policy.enabled ? 'var(--color-primary)' : '#cbd5e1',
                        transition: '0.3s',
                        borderRadius: '18px'
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '""',
                          height: '12px', width: '12px',
                          left: policy.enabled ? '20px' : '4px',
                          bottom: '3px',
                          backgroundColor: 'white',
                          transition: '0.3s',
                          borderRadius: '50%'
                        }}></span>
                      </span>
                    </label>
                  </div>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                  {policy.description}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  {policy.keywords.slice(0, 5).map(k => (
                    <span key={k} style={{ fontSize: '0.65rem', background: 'rgba(124, 58, 237, 0.05)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '2px 6px', color: 'var(--color-text-muted)' }}>
                      {k}
                    </span>
                  ))}
                  {policy.keywords.length > 5 && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-primary)', fontWeight: 'bold', padding: '2px 4px' }}>
                      +{policy.keywords.length - 5} more
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setActivePolicyId(policy.id)}
                    style={{ padding: '4px 10px', fontSize: '0.75rem', height: '28px' }}
                  >
                    Configure Prompts & Rules
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prompt configuration modal card */}
        {activePolicy && (
          <div className="glass-card" style={{ border: '2px solid var(--color-primary)' }}>
            <h3 className="heading-md" style={{ marginBottom: '12px' }}>Configure Prompts: {activePolicy.name}</h3>
            <form onSubmit={handleSavePolicyPrompt}>
              <div className="form-group">
                <label className="form-label" htmlFor="input-sysprompt">Custom System Prompts / Directives</label>
                <textarea
                  id="input-sysprompt"
                  className="form-input"
                  rows={4}
                  value={activePolicy.systemPrompt || `You are an expert auditor scanning for ${activePolicy.name}. Classify and flag emails offering financial incentives.`}
                  onChange={(e) => {
                    const val = e.target.value;
                    onUpdatePolicy(activePolicy.id, { ...activePolicy, systemPrompt: val });
                  }}
                  style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setActivePolicyId(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Save Prompts
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

      {/* RIGHT PANEL: AI Compliance Sandbox simulator */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h3 className="heading-md" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Sparkles size={20} style={{ color: 'var(--color-primary)' }} />
            <span>AI Policy Compliance Sandbox</span>
          </h3>
          <p className="text-muted" style={{ fontSize: '0.8rem' }}>
            Test email or message text copy against the live Gemini AI engine to observe classification.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Sample Message Body Copy</label>
            <textarea
              id="sandbox-text"
              className="form-input"
              rows={8}
              value={sandboxText}
              onChange={(e) => setSandboxText(e.target.value)}
              placeholder="Paste email or text message content here..."
              style={{ fontSize: '0.85rem', lineHeight: '1.4' }}
            />
          </div>

          <button
            id="btn-run-sandbox"
            type="button"
            onClick={handleSandboxScan}
            disabled={isScanning || !sandboxText.trim()}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {isScanning ? <RefreshCw size={16} className="logo-spin" /> : <Sparkles size={16} />}
            <span>Run AI Compliance Sandbox Scan</span>
          </button>
        </div>

        {/* Scan Results Console */}
        {sandboxResult && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            background: 'var(--color-surface)',
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--color-text-main)', fontSize: '0.85rem' }}>AI Scan Summary</span>
              <span className={`badge ${sandboxResult.severity === 'HIGH' ? 'badge-high' : sandboxResult.severity === 'MEDIUM' ? 'badge-med' : sandboxResult.severity === 'LOW' ? 'badge-low' : 'badge-none'}`}>
                Risk: {sandboxResult.riskScore}/100
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>Identified Policy Category:</span>
              <span style={{ color: sandboxResult.riskCategory !== 'NONE' ? 'var(--color-risk-high)' : 'var(--color-secondary)', fontWeight: 700 }}>
                {getRiskCategoryLabel(sandboxResult.riskCategory)}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>AI Audit Explanation:</span>
              <p style={{ color: 'var(--color-text-main)', lineHeight: '1.4' }}>{sandboxResult.explanation}</p>
            </div>

            {sandboxResult.flaggedSentences && sandboxResult.flaggedSentences.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>AI Flagged Citations:</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {sandboxResult.flaggedSentences.map((sentence: string, idx: number) => (
                    <div key={idx} style={{ 
                      background: 'rgba(239, 68, 68, 0.05)', 
                      borderLeft: '3px solid var(--color-risk-high)', 
                      padding: '8px 12px',
                      borderRadius: '0 4px 4px 0',
                      fontSize: '0.8rem',
                      fontStyle: 'italic',
                      color: 'var(--color-text-main)'
                    }}>
                      "{sentence}"
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
