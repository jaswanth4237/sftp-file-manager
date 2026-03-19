import React from 'react';

export default function Skeleton({ count = 5 }) {
  return (
    <div style={{ padding: 20 }}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="loading-skeleton" style={{ width: '100%', marginBottom: 15, height: 40 }} />
      ))}
    </div>
  );
}
