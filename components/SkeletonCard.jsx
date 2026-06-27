// Skeleton loaders that match the exact shape of real cards

export function RepoCardSkeleton() {
  return (
    <div className="glass repo-card" style={{ pointerEvents: 'none' }}>
      <div>
        <div className="skeleton" style={{ width: '40%', height: '18px', marginBottom: '8px', borderRadius: '6px' }} />
        <div className="skeleton" style={{ width: '75%', height: '14px', marginBottom: '12px', borderRadius: '4px' }} />
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="skeleton" style={{ width: '70px', height: '12px', borderRadius: '4px' }} />
          <div className="skeleton" style={{ width: '50px', height: '12px', borderRadius: '4px' }} />
          <div className="skeleton" style={{ width: '90px', height: '12px', borderRadius: '4px' }} />
        </div>
      </div>
      <div className="skeleton" style={{ width: '90px', height: '32px', borderRadius: '8px', flexShrink: 0 }} />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="glass ov-card" style={{ pointerEvents: 'none' }}>
      <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '8px', marginBottom: '10px' }} />
      <div className="skeleton" style={{ width: '60%', height: '13px', marginBottom: '8px', borderRadius: '4px' }} />
      <div className="skeleton" style={{ width: '40%', height: '28px', marginBottom: '6px', borderRadius: '6px' }} />
      <div className="skeleton" style={{ width: '70%', height: '12px', borderRadius: '4px' }} />
    </div>
  );
}

export function IssueCardSkeleton() {
  return (
    <div className="glass issue-card" style={{ pointerEvents: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div className="skeleton" style={{ width: '55%', height: '16px', borderRadius: '4px' }} />
        <div className="skeleton" style={{ width: '70px', height: '22px', borderRadius: '6px' }} />
      </div>
      <div className="skeleton" style={{ width: '90%', height: '13px', marginBottom: '6px', borderRadius: '4px' }} />
      <div className="skeleton" style={{ width: '70%', height: '13px', borderRadius: '4px' }} />
    </div>
  );
}
