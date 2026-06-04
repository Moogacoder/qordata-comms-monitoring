import React, { useState } from 'react';
import { ShieldCheck, User, ArrowRight, Settings } from 'lucide-react';
import type { UserRole } from '../types';

interface LoginProps {
  onLogin: (user: UserRole) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<'Compliance Officer' | 'IT Administrator' | 'Auditor'>('Compliance Officer');
  const [username, setUsername] = useState('compliance.officer@qordata.com');

  const handleRoleChange = (role: 'Compliance Officer' | 'IT Administrator' | 'Auditor') => {
    setSelectedRole(role);
    if (role === 'Compliance Officer') {
      setUsername('compliance.officer@qordata.com');
    } else if (role === 'IT Administrator') {
      setUsername('it.admin@qordata.com');
    } else {
      setUsername('auditor@qordata.com');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({
      id: selectedRole === 'Compliance Officer' ? 'u1' : selectedRole === 'IT Administrator' ? 'u2' : 'u3',
      name: selectedRole === 'Compliance Officer' ? 'Evelyn Compliance' : selectedRole === 'IT Administrator' ? 'Arthur IT' : 'Sarah Auditor',
      role: selectedRole
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 10% 20%, rgba(124, 58, 237, 0.05) 0%, rgba(255, 255, 255, 1) 90%)',
      padding: '24px'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '450px',
        padding: '40px',
        boxShadow: '0 20px 40px rgba(124, 58, 237, 0.08)',
        border: '1px solid rgba(124, 58, 237, 0.15)'
      }}>
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img 
            src="https://www.qordata.com/wp-content/uploads/2019/10/Updated_Logo_transparent.png" 
            alt="qordata" 
            style={{ width: '180px', height: 'auto', marginBottom: '16px', objectFit: 'contain' }} 
          />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '8px' }}>
            Communications Monitoring
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
            Life Sciences Compliance & Risk Auditing AI Portal
          </p>
        </div>

        {/* Role Selector Grid */}
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Select Audit Persona</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '8px' }}>
              <button
                type="button"
                className={`btn-secondary ${selectedRole === 'Compliance Officer' ? 'active-role' : ''}`}
                onClick={() => handleRoleChange('Compliance Officer')}
                style={{
                  padding: '12px 8px',
                  fontSize: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  borderColor: selectedRole === 'Compliance Officer' ? 'var(--color-primary)' : 'var(--color-border)',
                  background: selectedRole === 'Compliance Officer' ? 'var(--color-primary-glow)' : 'var(--color-surface)',
                  color: selectedRole === 'Compliance Officer' ? 'var(--color-primary)' : 'var(--color-text-main)',
                  fontWeight: selectedRole === 'Compliance Officer' ? 700 : 500
                }}
              >
                <ShieldCheck size={18} />
                <span>Compliance</span>
              </button>

              <button
                type="button"
                className={`btn-secondary ${selectedRole === 'IT Administrator' ? 'active-role' : ''}`}
                onClick={() => handleRoleChange('IT Administrator')}
                style={{
                  padding: '12px 8px',
                  fontSize: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  borderColor: selectedRole === 'IT Administrator' ? 'var(--color-primary)' : 'var(--color-border)',
                  background: selectedRole === 'IT Administrator' ? 'var(--color-primary-glow)' : 'var(--color-surface)',
                  color: selectedRole === 'IT Administrator' ? 'var(--color-primary)' : 'var(--color-text-main)',
                  fontWeight: selectedRole === 'IT Administrator' ? 700 : 500
                }}
              >
                <Settings size={18} />
                <span>IT Admin</span>
              </button>

              <button
                type="button"
                className={`btn-secondary ${selectedRole === 'Auditor' ? 'active-role' : ''}`}
                onClick={() => handleRoleChange('Auditor')}
                style={{
                  padding: '12px 8px',
                  fontSize: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  borderColor: selectedRole === 'Auditor' ? 'var(--color-primary)' : 'var(--color-border)',
                  background: selectedRole === 'Auditor' ? 'var(--color-primary-glow)' : 'var(--color-surface)',
                  color: selectedRole === 'Auditor' ? 'var(--color-primary)' : 'var(--color-text-main)',
                  fontWeight: selectedRole === 'Auditor' ? 700 : 500
                }}
              >
                <User size={18} />
                <span>Auditor</span>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="input-email">Authorized Email Address</label>
            <input
              id="input-email"
              type="email"
              className="form-input"
              value={username}
              disabled
              style={{ background: '#f1f5f9', cursor: 'not-allowed', color: 'var(--color-text-muted)' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="input-pwd">Access Key / Password</label>
            <input
              id="input-pwd"
              type="password"
              className="form-input"
              placeholder="••••••••••••"
              value="demopassword"
              disabled
              style={{ background: '#f1f5f9', cursor: 'not-allowed', color: 'var(--color-text-muted)' }}
            />
          </div>

          <button
            id="btn-login-submit"
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '14px', justifyContent: 'center', gap: '8px', fontSize: '0.95rem' }}
          >
            <span>Proceed to Workspace</span>
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
