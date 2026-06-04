import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Search, 
  AlertOctagon, 
  CheckCircle, 
  Scale, 
  Clock,
  Mail
} from 'lucide-react';
import type { CommunicationItem, CommStatus } from '../types';

interface EmailExplorerProps {
  comms: CommunicationItem[];
  selectedComm: CommunicationItem | null;
  setSelectedComm: (comm: CommunicationItem | null) => void;
  onUpdateCommStatus: (id: string, status: CommStatus, explanation?: string) => Promise<void>;
  onUploadEmail: (file: File) => Promise<void>;
  isUploading: boolean;
  currentUserRole: string;
}

export const EmailExplorer: React.FC<EmailExplorerProps> = ({
  comms,
  selectedComm,
  setSelectedComm,
  onUpdateCommStatus,
  onUploadEmail,
  isUploading,
  currentUserRole
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [justificationText, setJustificationText] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadEmail(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
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

  const getStatusBadge = (status: CommStatus) => {
    switch (status) {
      case 'FLAGGED':
        return <span className="badge badge-high" style={{ borderColor: '#fca5a5' }}>Flagged</span>;
      case 'DISMISSED':
        return <span className="badge badge-none">Dismissed</span>;
      case 'ESCALATED':
        return <span className="badge badge-low" style={{ background: '#fef3c7', color: '#d97706', borderColor: '#fde68a' }}>Escalated</span>;
      case 'PENDING_EXPLANATION':
        return <span className="badge badge-med">Pending Rep Justification</span>;
      default:
        return null;
    }
  };

  // Filter communications
  const filteredComms = comms.filter(c => {
    const matchesSearch = 
      c.sender.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.recipient.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.subject && c.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.body.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = severityFilter === 'ALL' || c.severity === severityFilter;
    const matchesCategory = categoryFilter === 'ALL' || c.riskCategory === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesCategory && matchesStatus;
  });

  const handleAction = async (status: CommStatus) => {
    if (!selectedComm) return;
    const exp = justificationText ? `Action Justification: ${justificationText}\n\nPrevious: ${selectedComm.explanation || ''}` : selectedComm.explanation;
    await onUpdateCommStatus(selectedComm.id, status, exp);
    setJustificationText('');
  };

  // Helper to highlight suspicious text in body
  const renderHighlightedBody = (body: string, flaggedSentences?: string[]) => {
    if (!flaggedSentences || flaggedSentences.length === 0) return <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{body}</p>;

    let elements: React.ReactNode[] = [];
    let indexKey = 0;

    // A simple replacement loop: look for the first occurrence of any flagged sentence
    // Sort flagged sentences by length descending to avoid partial matches on shorter segments first
    const sortedSentences = [...flaggedSentences].sort((a, b) => b.length - a.length);
    
    // We will do a regex-based split or character-by-character highlight.
    // For reliability in UI matching, we split the body into segments.
    // Let's create an array of indices where we find matches.
    const matches: { start: number; end: number; text: string }[] = [];
    
    sortedSentences.forEach(sentence => {
      const startIdx = body.indexOf(sentence);
      if (startIdx !== -1) {
        // Ensure no overlap
        const overlaps = matches.some(m => 
          (startIdx >= m.start && startIdx < m.end) || 
          (startIdx + sentence.length > m.start && startIdx + sentence.length <= m.end)
        );
        if (!overlaps) {
          matches.push({
            start: startIdx,
            end: startIdx + sentence.length,
            text: sentence
          });
        }
      }
    });

    // Sort matches by start index
    matches.sort((a, b) => a.start - b.start);

    let lastIndex = 0;
    matches.forEach(match => {
      // Add plain text before match
      if (match.start > lastIndex) {
        elements.push(<span key={`text-${indexKey++}`}>{body.substring(lastIndex, match.start)}</span>);
      }
      // Add highlighted text
      elements.push(
        <mark 
          key={`mark-${indexKey++}`} 
          style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.18)', 
            borderBottom: '2px solid var(--color-risk-high)',
            color: 'inherit',
            padding: '2px 4px',
            borderRadius: '4px',
            fontWeight: 500
          }}
        >
          {match.text}
        </mark>
      );
      lastIndex = match.end;
    });

    if (lastIndex < body.length) {
      elements.push(<span key={`text-${indexKey++}`}>{body.substring(lastIndex)}</span>);
    }

    return (
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.95rem' }}>
        {elements.length > 0 ? elements : body}
      </div>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px', alignItems: 'stretch', minHeight: 'calc(100vh - 180px)' }}>
      
      {/* LEFT PANEL: LIST OF EMAILS + UPLOADER */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Upload Card */}
        <div className="glass-card" style={{ padding: '20px', border: '1px dashed var(--color-primary)' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={16} />
            <span>Upload Email for Scanning</span>
          </h4>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".eml,.msg,.txt" 
            style={{ display: 'none' }} 
          />
          <button 
            id="btn-upload-trigger"
            onClick={triggerFileInput}
            disabled={isUploading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
          >
            {isUploading ? (
              <span>Scanning Content with AI...</span>
            ) : (
              <>
                <FileText size={18} />
                <span>Upload .EML / .TXT File</span>
              </>
            )}
          </button>
          <p className="text-muted" style={{ fontSize: '0.7rem', textAlign: 'center', marginTop: '8px' }}>
            Supports standard Microsoft Outlook EML mail files.
          </p>
        </div>

        {/* Filters Card */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <input
                id="search-comms"
                type="text"
                className="form-input"
                placeholder="Search senders, body..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--color-text-muted)' }} />
            </div>

            {/* Severity Filter */}
            <div>
              <label className="form-label" style={{ fontSize: '0.7rem' }}>Severity</label>
              <select
                id="filter-severity"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="form-input"
                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              >
                <option value="ALL">All Severities</option>
                <option value="HIGH">High Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="LOW">Low Risk</option>
                <option value="NONE">No Risk</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="form-label" style={{ fontSize: '0.7rem' }}>Risk Policy</label>
              <select
                id="filter-category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="form-input"
                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              >
                <option value="ALL">All Policies</option>
                <option value="OFF_LABEL_PROMOTION">Off-Label Promotion</option>
                <option value="KICKBACK_BRIBERY">Kickbacks & Bribery</option>
                <option value="MEDICAL_COMMERCIAL_BOUNDARY">Med/Comm Boundary</option>
                <option value="HIPAA_PII_LEAK">HIPAA / PII Leak</option>
                <option value="ADVERSE_EVENT_UNREPORTED">Adverse Event</option>
                <option value="NONE">No Policy Violations</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="form-label" style={{ fontSize: '0.7rem' }}>Workflow Status</label>
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-input"
                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="FLAGGED">Flagged</option>
                <option value="PENDING_EXPLANATION">Pending Rep Justification</option>
                <option value="ESCALATED">Escalated</option>
                <option value="DISMISSED">Dismissed</option>
              </select>
            </div>
          </div>
        </div>

        {/* List items */}
        <div style={{ flex: 1, overflowY: 'auto', maxHeight: '450px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredComms.length > 0 ? (
            filteredComms.map(comm => (
              <div
                key={comm.id}
                onClick={() => setSelectedComm(comm)}
                className={`glass-card dashboard-item ${selectedComm?.id === comm.id ? 'active-comm-item' : ''}`}
                style={{
                  padding: '16px',
                  cursor: 'pointer',
                  borderColor: selectedComm?.id === comm.id ? 'var(--color-primary)' : 'var(--color-border)',
                  background: selectedComm?.id === comm.id ? 'var(--color-primary-glow)' : 'var(--color-glass)',
                  transform: 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 650, color: 'var(--color-text-main)', wordBreak: 'break-all' }}>
                    {comm.sender}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                    {new Date(comm.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p style={{ 
                  fontSize: '0.85rem', 
                  fontWeight: 600, 
                  color: 'var(--color-text-main)', 
                  marginBottom: '6px',
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap' 
                }}>
                  {comm.subject || '(No Subject)'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                    {comm.riskCategory !== 'NONE' ? getRiskCategoryLabel(comm.riskCategory) : 'Safe'}
                  </span>
                  {comm.severity !== 'NONE' && (
                    <span className={`badge ${comm.severity === 'HIGH' ? 'badge-high' : comm.severity === 'MEDIUM' ? 'badge-med' : 'badge-low'}`} style={{ fontSize: '0.6rem', padding: '2px 6px' }}>
                      Score: {comm.riskScore}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-muted)', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)' }}>
              No matching communications found.
            </div>
          )}
        </div>

      </div>

      {/* RIGHT PANEL: DETAIL VIEW */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        
        {selectedComm ? (
          <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Headers Area */}
            <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                    {selectedComm.subject || '(No Subject)'}
                  </h2>
                  {selectedComm.originalFilename && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                      <FileText size={12} />
                      <span>Source File: {selectedComm.originalFilename}</span>
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {getStatusBadge(selectedComm.status)}
                  {selectedComm.severity !== 'NONE' && (
                    <span className={`badge ${selectedComm.severity === 'HIGH' ? 'badge-high' : selectedComm.severity === 'MEDIUM' ? 'badge-med' : 'badge-low'}`}>
                      AI RISK SCORE: {selectedComm.riskScore}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px 16px', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>From:</span>
                <span style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>{selectedComm.sender}</span>
                
                <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>To:</span>
                <span style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>{selectedComm.recipient}</span>

                <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>Channel:</span>
                <span style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>{selectedComm.source} (Microsoft Exchange synced)</span>

                <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>Date:</span>
                <span style={{ color: 'var(--color-text-muted)' }}>
                  {new Date(selectedComm.timestamp).toLocaleString([], { dateStyle: 'long', timeStyle: 'medium' })}
                </span>
              </div>
            </div>

            {/* Suspect Alert Section */}
            {selectedComm.riskCategory !== 'NONE' && (
              <div style={{ 
                background: selectedComm.severity === 'HIGH' ? 'var(--color-risk-high-bg)' : 'var(--color-risk-med-bg)',
                border: `1px solid ${selectedComm.severity === 'HIGH' ? 'var(--color-risk-high-border)' : 'var(--color-risk-med-border)'}`,
                padding: '16px',
                borderRadius: 'var(--radius-md)'
              }}>
                <h4 style={{ 
                  color: selectedComm.severity === 'HIGH' ? 'var(--color-risk-high)' : 'var(--color-risk-med)',
                  fontWeight: 700, 
                  fontSize: '0.9rem',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <AlertOctagon size={16} />
                  <span>AI Compliance Policy Match: {getRiskCategoryLabel(selectedComm.riskCategory)}</span>
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', lineHeight: '1.5' }}>
                  {selectedComm.explanation}
                </p>
              </div>
            )}

            {/* Email Body */}
            <div style={{ flex: 1, minHeight: '150px', background: 'var(--color-surface)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)', marginBottom: '12px', borderBottom: '1px solid var(--color-border)', paddingBottom: '4px' }}>
                Communication Content Body
              </div>
              {renderHighlightedBody(selectedComm.body, selectedComm.flaggedSentences)}
            </div>

            {/* Workflow Action Panel */}
            {currentUserRole !== 'Auditor' && (
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
                <h4 className="heading-md" style={{ fontSize: '0.95rem', marginBottom: '12px' }}>Audit Actions Workflow</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <textarea
                    id="action-justification"
                    className="form-input"
                    rows={2}
                    placeholder="Enter audit notes / justification comments here..."
                    value={justificationText}
                    onChange={(e) => setJustificationText(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  />

                  <div style={{ display: 'flex', gap: '12px' }}>
                    {selectedComm.status === 'FLAGGED' && (
                      <>
                        <button
                          id="btn-action-dismiss"
                          onClick={() => handleAction('DISMISSED')}
                          className="btn-secondary"
                          style={{ flex: 1, justifyContent: 'center' }}
                        >
                          <CheckCircle size={16} />
                          <span>Dismiss Flag</span>
                        </button>

                        <button
                          id="btn-action-request"
                          onClick={() => handleAction('PENDING_EXPLANATION')}
                          className="btn-secondary"
                          style={{ flex: 1, justifyContent: 'center', borderColor: 'var(--color-risk-med-border)', color: 'var(--color-risk-med)', background: 'rgba(245,158,11,0.04)' }}
                        >
                          <Clock size={16} />
                          <span>Request Rep Justify</span>
                        </button>

                        <button
                          id="btn-action-escalate"
                          onClick={() => handleAction('ESCALATED')}
                          className="btn-danger"
                          style={{ flex: 1, justifyContent: 'center' }}
                        >
                          <Scale size={16} />
                          <span>Escalate to Legal</span>
                        </button>
                      </>
                    )}

                    {selectedComm.status !== 'FLAGGED' && (
                      <button
                        id="btn-action-reopen"
                        onClick={() => handleAction('FLAGGED')}
                        className="btn-secondary"
                        style={{ flex: 1, justifyContent: 'center' }}
                      >
                        <AlertOctagon size={16} />
                        <span>Re-open Investigation</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', border: '2px dashed var(--color-border)' }}>
            <Mail size={48} style={{ opacity: 0.3, marginBottom: '16px', color: 'var(--color-primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '8px' }}>No Communication Selected</h3>
            <p style={{ fontSize: '0.85rem' }}>Select an email from the explorer feed or upload a new file to examine AI results.</p>
          </div>
        )}

      </div>

    </div>
  );
};
