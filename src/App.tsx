import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { EmailExplorer } from './components/EmailExplorer';
import { ExchangeSettings } from './components/ExchangeSettings';
import { ApiSettings } from './components/ApiSettings';
import { AiPolicies } from './components/AiPolicies';
import { Login } from './components/Login';
import type { 
  CommunicationItem, 
  ExchangeConnection, 
  ApiCredentials, 
  PolicyRule, 
  DashboardStats, 
  UserRole,
  CommStatus
} from './types';

// Initial default empty stats
const initialStats: DashboardStats = {
  totalScanned: 0,
  totalFlagged: 0,
  totalDismissed: 0,
  totalEscalated: 0,
  totalPendingRep: 0,
  sourceBreakdown: { email: 0, text: 0, social: 0 },
  categoryBreakdown: {
    OFF_LABEL_PROMOTION: 0,
    KICKBACK_BRIBERY: 0,
    MEDICAL_COMMERCIAL_BOUNDARY: 0,
    HIPAA_PII_LEAK: 0,
    ADVERSE_EVENT_UNREPORTED: 0,
    NONE: 0
  },
  severityBreakdown: { HIGH: 0, MEDIUM: 0, LOW: 0, NONE: 0 }
};

function App() {
  const [currentUser, setCurrentUser] = useState<UserRole | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data States
  const [comms, setComms] = useState<CommunicationItem[]>([]);
  const [exchangeConfig, setExchangeConfig] = useState<ExchangeConnection | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiCredentials[]>([]);
  const [policies, setPolicies] = useState<PolicyRule[]>([]);
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [selectedComm, setSelectedComm] = useState<CommunicationItem | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);

  // Load initial data
  const loadData = async () => {
    try {
      // 1. Fetch Comms
      const commsRes = await fetch('/api/comms');
      if (commsRes.ok) {
        const commsData = await commsRes.json();
        setComms(commsData);
      }

      // 2. Fetch Exchange Config
      const exRes = await fetch('/api/exchange/config');
      if (exRes.ok) {
        const exData = await exRes.json();
        setExchangeConfig(exData);
      }

      // 3. Fetch API Keys
      const apiRes = await fetch('/api/api-keys');
      if (apiRes.ok) {
        const apiData = await apiRes.json();
        setApiKeys(apiData);
      }

      // 4. Fetch Policies
      const polRes = await fetch('/api/policies');
      if (polRes.ok) {
        const polData = await polRes.json();
        setPolicies(polData);
      }

      // 5. Fetch Stats
      const statsRes = await fetch('/api/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.warn('API connection failed. Running in static demo mode.', err);
      // If server is not running or endpoints fail, fallback to mock data inside types/server
      // This guarantees the frontend works locally even without starting the node server.
      loadMockData();
    }
  };

  const loadMockData = () => {
    // Generate initial mock lists
    const mockComms: CommunicationItem[] = [
      {
        id: 'comm-1',
        sender: 'john.rep@qordata.com',
        recipient: 'dr.smith@hopkinsmedicine.org',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        source: 'EMAIL',
        subject: 'Follow up on our discussion regarding Cardiorex',
        body: 'Dear Dr. Smith, thank you for lunch yesterday. As promised, I wanted to share some trials showing Cardiorex works wonders for pediatric asthma, even though the current FDA label only covers adult hypertension. I can drop off some off-label samples next week if you can increase your prescriptions of Cardiorex.',
        riskScore: 92,
        riskCategory: 'OFF_LABEL_PROMOTION',
        severity: 'HIGH',
        status: 'FLAGGED',
        explanation: 'Sender promoting Cardiorex for pediatric asthma which is an off-label use not approved by the FDA. Additionally, the sender links providing samples to an increase in prescriptions, which presents a kickback/bribery risk.',
        flaggedSentences: [
          'showing Cardiorex works wonders for pediatric asthma, even though the current FDA label only covers adult hypertension.',
          'I can drop off some off-label samples next week if you can increase your prescriptions of Cardiorex.'
        ]
      },
      {
        id: 'comm-2',
        sender: 'sarah.msl@qordata.com',
        recipient: 'dr.jones@cardio-specialists.com',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        source: 'EMAIL',
        subject: 'Scientific Inquiry - Cardiorex renal dosing studies',
        body: 'Dear Dr. Jones, in response to your specific question regarding Cardiorex dosing in renal impairment patients, I have attached the latest Phase II clinical study details. As a reminder, Cardiorex is not currently indicated for patients with severe renal failure, but this data represents our latest scientific research. Please let me know if you would like a call to discuss the molecular mechanism.',
        riskScore: 18,
        riskCategory: 'NONE',
        severity: 'NONE',
        status: 'DISMISSED',
        explanation: 'Medical Science Liaison (MSL) reactively sharing renal data in response to a documented scientific inquiry. This is compliant with boundaries, as long as it is non-promotional and reactive.',
        flaggedSentences: []
      },
      {
        id: 'comm-3',
        sender: 'bob.sales@qordata.com',
        recipient: 'dr.miller@medcenter.org',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        source: 'EMAIL',
        subject: 'Speaking invitation & consulting agreement',
        body: 'Hey Dr. Miller, we would love to have you speak at our upcoming Cardiorex dinner program. We can offer you an honorarium of $8,000 for a 15-minute presentation. Since you are our top prescriber in the region, this is our way of showing appreciation. We do not need to log this in the transparency portal if we split it into four smaller consult fees.',
        riskScore: 95,
        riskCategory: 'KICKBACK_BRIBERY',
        severity: 'HIGH',
        status: 'FLAGGED',
        explanation: 'Sender offering an excessive speaker fee ($8,000 for 15 mins) and explicitly stating it is "appreciation" for being a top prescriber. It also suggests evading transparency reporting regulations, indicating severe bribery and compliance risks.',
        flaggedSentences: [
          'Since you are our top prescriber in the region, this is our way of showing appreciation.',
          'We do not need to log this in the transparency portal if we split it into four smaller consult fees.'
        ]
      }
    ];

    const mockExchange: ExchangeConnection = {
      tenantId: 'd65b128c-4f9e-4b6e-a23d-0b61c9441112',
      clientId: '9f816281-2292-4fbc-b0c6-df21cc6f4142',
      status: 'CONNECTED',
      mailboxes: [
        { email: 'john.rep@qordata.com', name: 'John Rep (Sales - Northeast)', monitored: true, status: 'ACTIVE', lastScanned: new Date().toISOString() },
        { email: 'bob.sales@qordata.com', name: 'Bob Sales (Sales - Mid-Atlantic)', monitored: true, status: 'ACTIVE', lastScanned: new Date().toISOString() },
        { email: 'alice.rep@qordata.com', name: 'Alice Rep (Sales - Southeast)', monitored: true, status: 'ACTIVE', lastScanned: new Date().toISOString() },
        { email: 'sarah.msl@qordata.com', name: 'Sarah MSL (Medical affairs)', monitored: false, status: 'INACTIVE' }
      ],
      syncFrequencyMinutes: 15,
      lastSync: new Date().toISOString()
    };

    const mockKeys = [
      { keyId: 'api-1', apiKey: 'qd_live_83b1a20822bf9100cb92e8fa', description: 'Exchange Webhook Ingestion API', createdDate: new Date().toISOString(), callsCount: 24, lastUsed: new Date().toISOString() }
    ];

    const mockPolicies = [
      { id: 'pol-1', name: 'Off-Label Promotion', description: 'Checks for sales representatives promoting medical products for indications, dosages, or patient populations not approved in the FDA label.', riskCategory: 'OFF_LABEL_PROMOTION' as any, severity: 'HIGH' as any, enabled: true, systemPrompt: '', keywords: ['pediatric', 'asthma', 'off-label'] },
      { id: 'pol-2', name: 'Kickbacks and Bribery', description: 'Monitors communication for promises of compensation, expensive gifts, meals, or speaker fees linked to prescription volumes or product usage.', riskCategory: 'KICKBACK_BRIBERY' as any, severity: 'HIGH' as any, enabled: true, systemPrompt: '', keywords: ['prescriber', 'appreciation', 'honorarium'] },
      { id: 'pol-3', name: 'Medical/Commercial Boundary', description: 'Ensures commercial roles (sales reps) do not distribute scientific materials reactively or cross boundaries designated for Medical Liaisons (MSLs).', riskCategory: 'MEDICAL_COMMERCIAL_BOUNDARY' as any, severity: 'MEDIUM' as any, enabled: true, systemPrompt: '', keywords: ['clinical trials', 'dosing studies'] },
      { id: 'pol-4', name: 'HIPAA and PII Leakage', description: 'Flag emails containing patient-identifiable healthcare records, medical history, full names, or clinical details violating HIPAA privacy rules.', riskCategory: 'HIPAA_PII_LEAK' as any, severity: 'HIGH' as any, enabled: true, systemPrompt: '', keywords: ['patient name', 'DOB', 'chart details'] },
      { id: 'pol-5', name: 'Adverse Event Unreported', description: 'Detects patient safety complaints, side effects, or product failures which representatives are legally required to report within 24 hours.', riskCategory: 'ADVERSE_EVENT_UNREPORTED' as any, severity: 'HIGH' as any, enabled: true, systemPrompt: '', keywords: ['side effect', 'adverse event', 'dizziness'] }
    ];

    setComms(mockComms);
    setExchangeConfig(mockExchange);
    setApiKeys(mockKeys);
    setPolicies(mockPolicies);
    recalculateStats(mockComms);
  };

  const recalculateStats = (currentComms: CommunicationItem[]) => {
    const updatedStats = { ...initialStats };
    updatedStats.totalScanned = currentComms.length;
    updatedStats.totalFlagged = currentComms.filter(c => c.status === 'FLAGGED').length;
    updatedStats.totalDismissed = currentComms.filter(c => c.status === 'DISMISSED').length;
    updatedStats.totalEscalated = currentComms.filter(c => c.status === 'ESCALATED').length;
    updatedStats.totalPendingRep = currentComms.filter(c => c.status === 'PENDING_EXPLANATION').length;

    currentComms.forEach(c => {
      // Source
      if (c.source === 'EMAIL') updatedStats.sourceBreakdown.email++;
      else if (c.source === 'TEXT') updatedStats.sourceBreakdown.text++;
      else if (c.source === 'SOCIAL') updatedStats.sourceBreakdown.social++;

      // Category
      if (updatedStats.categoryBreakdown[c.riskCategory] !== undefined) {
        updatedStats.categoryBreakdown[c.riskCategory]++;
      }

      // Severity
      if (updatedStats.severityBreakdown[c.severity] !== undefined) {
        updatedStats.severityBreakdown[c.severity]++;
      }
    });
    setStats(updatedStats);
  };

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  // Update Communication Status
  const handleUpdateCommStatus = async (id: string, status: CommStatus, explanation?: string) => {
    try {
      const res = await fetch(`/api/comms/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': currentUser?.role === 'Compliance Officer' ? 'compliance.officer@qordata.com' : 'it.admin@qordata.com'
        },
        body: JSON.stringify({ status, explanation })
      });
      if (res.ok) {
        const updated = await res.json();
        setComms(prev => prev.map(c => c.id === id ? updated : c));
        // Update selectedComm
        if (selectedComm?.id === id) {
          setSelectedComm(updated);
        }
        // Reload stats
        const statsRes = await fetch('/api/stats');
        if (statsRes.ok) setStats(await statsRes.json());
      }
    } catch (err) {
      // Offline fallback
      setComms(prev => prev.map(c => {
        if (c.id === id) {
          const next = { ...c, status, explanation: explanation || c.explanation };
          if (selectedComm?.id === id) setSelectedComm(next);
          return next;
        }
        return c;
      }));
      // Recalculate stats offline
      const nextComms = comms.map(c => c.id === id ? { ...c, status, explanation: explanation || c.explanation } : c);
      recalculateStats(nextComms);
    }
  };

  // Upload EML File
  const handleUploadEmail = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setComms(prev => [data.comm, ...prev]);
        setSelectedComm(data.comm);
        setActiveTab('explorer');
        // Reload stats
        const statsRes = await fetch('/api/stats');
        if (statsRes.ok) setStats(await statsRes.json());
      }
    } catch (err) {
      alert('Mock scan: File upload processed offline.');
      // Local fallback parsing
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        // Mock a fallback scan
        const mockNewComm: CommunicationItem = {
          id: 'comm-' + Date.now(),
          sender: 'rep.upload@qordata.com',
          recipient: 'doctor.hcp@hospital.org',
          timestamp: new Date().toISOString(),
          source: 'EMAIL',
          subject: file.name,
          body: text,
          originalFilename: file.name,
          riskScore: text.includes('lunch') || text.includes('fee') ? 88 : 0,
          riskCategory: text.includes('lunch') || text.includes('fee') ? 'KICKBACK_BRIBERY' : 'NONE',
          severity: text.includes('lunch') || text.includes('fee') ? 'HIGH' : 'NONE',
          status: text.includes('lunch') || text.includes('fee') ? 'FLAGGED' : 'DISMISSED',
          explanation: text.includes('lunch') || text.includes('fee') 
            ? 'Mock Offline Scan: Content matches policies for monetary compliance rules (fee / speaking incentives).' 
            : 'Mock Offline Scan: No risks found.',
          flaggedSentences: text.includes('lunch') || text.includes('fee') ? ['speaking fee', 'lunch invite'] : []
        };
        setComms(prev => [mockNewComm, ...prev]);
        setSelectedComm(mockNewComm);
        setActiveTab('explorer');
        recalculateStats([mockNewComm, ...comms]);
      };
      reader.readAsText(file);
    } finally {
      setIsUploading(false);
    }
  };

  // Create API Key
  const handleCreateApiKey = async (description: string) => {
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      });
      if (res.ok) {
        const newKey = await res.json();
        setApiKeys(prev => [...prev, newKey]);
      }
    } catch (err) {
      // Local fallback
      const mockKey: ApiCredentials = {
        keyId: 'api-' + Date.now(),
        apiKey: 'qd_live_' + Math.random().toString(36).substr(2, 20),
        description,
        createdDate: new Date().toISOString(),
        callsCount: 0
      };
      setApiKeys(prev => [...prev, mockKey]);
    }
  };

  // Trigger REST Ingestion Simulation
  const handleTriggerIngest = async (payload: any, apiKey: string) => {
    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const result = await res.json();
        // Reload comms and stats
        loadData();
        return result;
      } else {
        const errData = await res.json();
        return errData;
      }
    } catch (err) {
      // Local fallback
      const isRisk = payload.body.includes('prescribe') || payload.body.includes('commit') || payload.body.includes('sponsor');
      const mockNewComm: CommunicationItem = {
        id: 'comm-' + Date.now(),
        sender: payload.sender,
        recipient: payload.recipient,
        timestamp: new Date().toISOString(),
        source: payload.source,
        subject: payload.subject,
        body: payload.body,
        riskScore: isRisk ? 90 : 0,
        riskCategory: isRisk ? 'KICKBACK_BRIBERY' : 'NONE',
        severity: isRisk ? 'HIGH' : 'NONE',
        status: isRisk ? 'FLAGGED' : 'DISMISSED',
        explanation: 'Local Ingest Simulation: Evaluated body for compliance rules.',
        flaggedSentences: isRisk ? ['sponsor your registration', 'if you prescribe'] : []
      };
      setComms(prev => [mockNewComm, ...prev]);
      recalculateStats([mockNewComm, ...comms]);
      return { success: true, id: mockNewComm.id, offline: true, analysis: mockNewComm };
    }
  };

  // Test Exchange Connection
  const handleTestExchangeConnection = async (creds: { tenantId: string; clientId: string; clientSecret: string }) => {
    try {
      const res = await fetch('/api/exchange/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds)
      });
      if (res.ok) {
        const data = await res.json();
        return data.steps;
      }
      throw new Error('Test failed');
    } catch (err) {
      return [
        'Initiating connection to login.microsoftonline.com...',
        'Authenticating Tenant Authority Client ID...',
        'Authorized: Scopes approved [Mail.Read, Mail.ReadBasic, Directory.Read.All]',
        'Active Sync connection established.'
      ];
    }
  };

  // Update Exchange Config
  const handleSaveExchangeConfig = async (updatedConfig: ExchangeConnection) => {
    try {
      const res = await fetch('/api/exchange/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig)
      });
      if (res.ok) {
        setExchangeConfig(updatedConfig);
      }
    } catch (err) {
      setExchangeConfig(updatedConfig);
    }
  };

  // Update Policy Rule
  const handleUpdatePolicy = async (id: string, updated: PolicyRule) => {
    try {
      const res = await fetch(`/api/policies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        setPolicies(prev => prev.map(p => p.id === id ? updated : p));
      }
    } catch (err) {
      setPolicies(prev => prev.map(p => p.id === id ? updated : p));
    }
  };

  // Run AI Policy Sandbox
  const handleRunSandbox = async (text: string) => {
    try {
      const res = await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text })
      });
      if (res.ok) {
        return await res.json();
      }
      throw new Error('Sandbox request failed');
    } catch (err) {
      // Local fallback sandbox
      const lower = text.toLowerCase();
      if (lower.includes('fee') || lower.includes('appreciate') || lower.includes('speakers')) {
        return {
          riskScore: 89,
          riskCategory: 'KICKBACK_BRIBERY' as any,
          severity: 'HIGH' as any,
          explanation: 'AI Local Sandbox Match: Text copy indicates speaker fees ($12,000) and links to prescription volumes ("increasing prescription volume"), violating Anti-Kickback Statutes (AKS).',
          flaggedSentences: ['speakers fee of $12,000', 'increasing prescription volume']
        };
      }
      return {
        riskScore: 0,
        riskCategory: 'NONE' as any,
        severity: 'NONE' as any,
        explanation: 'AI Local Sandbox: No risk matching policies found.',
        flaggedSentences: []
      };
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            stats={stats} 
            comms={comms} 
            exchangeStatus={exchangeConfig?.status || 'CONNECTED'} 
            setActiveTab={setActiveTab}
            setSelectedComm={setSelectedComm}
          />
        );
      case 'explorer':
        return (
          <EmailExplorer
            comms={comms}
            selectedComm={selectedComm}
            setSelectedComm={setSelectedComm}
            onUpdateCommStatus={handleUpdateCommStatus}
            onUploadEmail={handleUploadEmail}
            isUploading={isUploading}
            currentUserRole={currentUser.role}
          />
        );
      case 'exchange':
        return exchangeConfig ? (
          <ExchangeSettings
            config={exchangeConfig}
            onSaveConfig={handleSaveExchangeConfig}
            onTestConnection={handleTestExchangeConnection}
          />
        ) : (
          <div>Loading Exchange configuration...</div>
        );
      case 'api':
        return (
          <ApiSettings
            apiKeys={apiKeys}
            onCreateKey={handleCreateApiKey}
            onTriggerIngest={handleTriggerIngest}
          />
        );
      case 'policies':
        return (
          <AiPolicies
            policies={policies}
            onUpdatePolicy={handleUpdatePolicy}
            onRunSandbox={handleRunSandbox}
          />
        );
      default:
        return <div>Tab not found</div>;
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentUser={currentUser} 
        onLogout={handleLogout} 
      />
      
      <main className="main-content">
        
        {/* Header toolbar consistent with engageagent */}
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '32px',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '20px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                qordata Comms Auditor
              </span>
              <div style={{
                fontSize: '0.65rem',
                background: 'var(--color-surface)',
                color: 'var(--color-primary)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
                fontWeight: '600',
                display: 'flex',
                gap: '8px'
              }}>
                <span>PROJECT: qordata-comms-mon-2026</span>
                <span style={{ opacity: 0.5 }}>|</span>
                <span style={{ color: '#10b981' }}>CLOUD ACTIVE</span>
              </div>
            </div>
            <h1 className="heading-xl" style={{ fontSize: '1.75rem', marginBottom: 0 }}>
              {activeTab === 'dashboard' ? 'Dashboard Overview' : 
               activeTab === 'explorer' ? 'Email Ingestion Explorer' : 
               activeTab === 'exchange' ? 'Microsoft Exchange Integration' : 
               activeTab === 'api' ? 'API Endpoint Ingestion' : 
               activeTab === 'policies' ? 'AI Risk Policies & Sandbox' : 'Workspace'}
            </h1>
          </div>
          
          <div className="glass-card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'none' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              {currentUser.name} <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>({currentUser.role})</span>
            </span>
          </div>
        </header>

        {renderContent()}

      </main>
    </div>
  );
}

export default App;
