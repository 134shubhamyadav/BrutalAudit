'use client';
import { useAuth } from './AuthProvider';
import { auth, signOut } from '../lib/firebase';
import { useRouter } from 'next/navigation';

const NAV_ITEMS = [
  { section: 'MAIN', items: [
    { icon: '📊', label: 'Overview', href: '/dashboard', id: 'dashboard' },
    { icon: '📁', label: 'Audits & Repos', href: '/repos', id: 'repos' },
    { icon: '📋', label: 'Reports', href: '/reports', id: 'reports' },
    { icon: '⚙️', label: 'Settings', href: '/settings', id: 'settings' },
  ]},
];

export default function Sidebar({ activeId, auditCount }) {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-logo" onClick={() => router.push(user ? '/dashboard' : '/')} style={{ cursor: 'pointer' }}>
        <img src="/logo.png" alt="Logo" />
        <span>BrutalAudit</span>
      </div>

      <div className="sidebar-nav">
        {NAV_ITEMS.map((group) => (
          <div key={group.section}>
            <div className="nav-section">{group.section}</div>
            {group.items.map((item) => {
              const navItem = (
                <div
                  key={item.id}
                  className={`nav-item magnetic${activeId === item.id ? ' active' : ''}`}
                  onClick={() => user ? router.push(item.href) : null}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="icon">{item.icon}</span>
                    {item.label}
                    {item.id === 'repos' && auditCount > 0 && (
                      <span className="nav-badge">{auditCount}</span>
                    )}
                  </span>
                  {item.badge && (
                    <span style={{
                      fontSize: '9px', fontWeight: 600, letterSpacing: '0.5px',
                      background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)',
                      padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </div>
              );

              return navItem;
            })}
          </div>
        ))}
      </div>

      <div className="sidebar-profile">
        <div className="profile-avatar premium-glow" style={{ overflow: 'hidden', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={user?.photoURL || 'https://www.svgrepo.com/show/512317/github-142.svg'} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div className="profile-name" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {user?.displayName || 'Developer'}
          </div>
          <button 
            className="btn-ghost btn-sm" 
            style={{ padding: '2px 6px', fontSize: '11px', marginTop: '4px' }}
            onClick={() => signOut(auth).then(() => router.push('/'))}
          >
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
