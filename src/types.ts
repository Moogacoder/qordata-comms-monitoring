export type RiskCategory = 
  | 'OFF_LABEL_PROMOTION' 
  | 'KICKBACK_BRIBERY' 
  | 'MEDICAL_COMMERCIAL_BOUNDARY' 
  | 'HIPAA_PII_LEAK' 
  | 'ADVERSE_EVENT_UNREPORTED'
  | 'NONE';

export type RiskSeverity = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

export type CommSource = 'EMAIL' | 'TEXT' | 'SOCIAL';

export type CommStatus = 'FLAGGED' | 'DISMISSED' | 'ESCALATED' | 'PENDING_EXPLANATION';

export interface CommunicationItem {
  id: string;
  sender: string;
  recipient: string;
  timestamp: string;
  source: CommSource;
  subject?: string;
  body: string;
  riskScore: number; // 0 to 100
  riskCategory: RiskCategory;
  severity: RiskSeverity;
  status: CommStatus;
  explanation?: string;
  flaggedSentences?: string[];
  originalFilename?: string;
  recipientDetails?: string;
  senderDetails?: string;
}

export interface ExchangeMailbox {
  email: string;
  name: string;
  monitored: boolean;
  lastScanned?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
}

export interface ExchangeConnection {
  tenantId: string;
  clientId: string;
  clientSecret?: string;
  authorityUrl?: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'TESTING' | 'ERROR';
  mailboxes: ExchangeMailbox[];
  lastSync?: string;
  syncFrequencyMinutes: number;
}

export interface ApiCredentials {
  keyId: string;
  apiKey: string;
  description: string;
  createdDate: string;
  lastUsed?: string;
  callsCount: number;
}

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  riskCategory: RiskCategory;
  severity: RiskSeverity;
  enabled: boolean;
  systemPrompt: string;
  keywords: string[];
}

export interface DashboardStats {
  totalScanned: number;
  totalFlagged: number;
  totalDismissed: number;
  totalEscalated: number;
  totalPendingRep: number;
  sourceBreakdown: {
    email: number;
    text: number;
    social: number;
  };
  categoryBreakdown: Record<RiskCategory, number>;
  severityBreakdown: Record<RiskSeverity, number>;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  targetId?: string;
}

export interface UserRole {
  role: 'IT Administrator' | 'Compliance Officer' | 'Auditor';
  name: string;
  id: string;
}
