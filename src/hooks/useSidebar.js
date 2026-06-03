// src/hooks/useSidebar.js
import { useState, useEffect } from 'react';

export function useSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const toggleCollapse = () => setCollapsed(c => !c);
  const toggleMobile = () => setMobileOpen(m => !m);
  const closeMobile = () => setMobileOpen(false);

  return { collapsed, mobileOpen, toggleCollapse, toggleMobile, closeMobile };
}
