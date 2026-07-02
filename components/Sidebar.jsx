'use client';
import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { auth, signOut } from '../lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, FolderGit2, FileText, Settings, Menu, X, Trophy } from 'lucide-react';
import Image from 'next/image';

const NAV_ITEMS = [
  { section: 'MAIN', items: [
    { icon: <LayoutDashboard size={18} />, label: 'Overview', href: '/dashboard', id: 'dashboard' },
    { icon: <FolderGit2 size={18} />, label: 'Audits & Repos', href: '/repos', id: 'repos' },
    { icon: <FileText size={18} />, label: 'Reports', href: '/reports', id: 'reports' },
    { icon: <Trophy size={18} />, label: 'Leaderboard', href: '/leaderboard', id: 'leaderboard' },
    { icon: <Settings size={18} />, label: 'Settings', href: '/settings', id: 'settings' },
  ]},
];

export default function Sidebar({ activeId, auditCount }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="mobile-header">
        <div className="sidebar-logo" onClick={() => router.push(user ? '/dashboard' : '/')} style={{ cursor: 'pointer', padding: 0, border: 'none' }}>
          <Image src="/logo.png" alt="Logo" width={28} height={28} />
          <span style={{ fontSize: '18px' }}>BrutalAudit</span>
        </div>
        <button className="menu-toggle" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay for mobile */}
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(false)}></div>

      <aside className={`sidebar glass-panel ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo desktop-only" onClick={() => router.push(user ? '/dashboard' : '/')} style={{ cursor: 'pointer' }}>
          <Image src="/logo.png" alt="Logo" width={40} height={40} />
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
        <div className="profile-avatar" style={{ overflow: 'hidden', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: 36, height: 36 }}>
          <Image src={user?.photoURL || 'https://avatars.githubusercontent.com/u/9919?s=200&v=4'} alt="Avatar" fill style={{ objectFit: 'cover' }} sizes="36px" />
        </div>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div className="profile-name" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {user?.displayName || 'Developer'}
          </div>
          <button 
            className="btn-ghost btn-sm" 
            style={{ padding: '2px 6px', fontSize: '11px', marginTop: '4px', minHeight: '44px' }}
            onClick={() => signOut(auth).then(() => router.push('/'))}
          >
            Sign Out
          </button>
        </div>
        </div>
      </aside>
    </>
  );
}
