import React from 'react';
import { 
  LayoutDashboard, 
  Mail, 
  Key, 
  ShieldCheck, 
  LogOut, 
  Database
} from 'lucide-react';
import type { UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserRole;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  currentUser, 
  onLogout 
}) => {
  return (
    <aside className="sidebar">
      {/* Brand Header consistent with engageagent */}
      <div style={{ marginBottom: '32px', padding: '0 10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <img 
          src="https://www.qordata.com/wp-content/uploads/2019/10/Updated_Logo_transparent.png" 
          alt="qordata" 
          style={{ width: '150px', height: 'auto', objectFit: 'contain' }} 
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ 
            fontSize: '0.65rem', 
            fontWeight: 800, 
            letterSpacing: '1px', 
            color: 'var(--color-primary)', 
            background: 'var(--color-primary-glow)', 
            padding: '2px 6px', 
            borderRadius: '4px',
            textTransform: 'uppercase'
          }}>
            Comms Monitoring
          </span>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-secondary)' }}>
            v1.2.0
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{ flex: 1 }}>
        <ul className="nav-list">
          <li 
            id="nav-dashboard"
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard Overview</span>
          </li>
          
          <li 
            id="nav-explorer"
            className={`nav-item ${activeTab === 'explorer' ? 'active' : ''}`}
            onClick={() => setActiveTab('explorer')}
          >
            <Mail size={18} />
            <span>Email Explorer</span>
          </li>

          <li 
            id="nav-exchange"
            className={`nav-item ${activeTab === 'exchange' ? 'active' : ''}`}
            onClick={() => setActiveTab('exchange')}
          >
            <Database size={18} />
            <span>Microsoft Exchange</span>
          </li>

          <li 
            id="nav-api"
            className={`nav-item ${activeTab === 'api' ? 'active' : ''}`}
            onClick={() => setActiveTab('api')}
          >
            <Key size={18} />
            <span>API Ingestion</span>
          </li>

          <li 
            id="nav-policies"
            className={`nav-item ${activeTab === 'policies' ? 'active' : ''}`}
            onClick={() => setActiveTab('policies')}
          >
            <ShieldCheck size={18} />
            <span>AI Risk Policies</span>
          </li>
        </ul>
      </nav>

      {/* User Session Footer */}
      <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          marginBottom: '16px',
          background: 'var(--color-surface-hover)',
          padding: '12px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.85rem'
          }}>
            {currentUser.name.charAt(0)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser.name}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              {currentUser.role}
            </span>
          </div>
        </div>

        <button 
          id="btn-logout"
          onClick={onLogout}
          className="btn-danger"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
