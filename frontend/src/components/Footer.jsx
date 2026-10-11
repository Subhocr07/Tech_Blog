import React from 'react';
import { BookOpen, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer style={{ borderTop: '1px solid var(--border-color)', padding: '2rem 0', background: 'var(--bg-card)', textAlign: 'center' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        © {new Date().getFullYear()} DevChronicle. All rights reserved.
      </div>
    </footer>
  );
};
