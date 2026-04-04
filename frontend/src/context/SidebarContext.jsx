import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const SidebarContext = createContext(undefined);

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebarContext must be used within a SidebarProvider');
  }
  return context;
}

export function SidebarProvider({ children }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  const toggleMobileOpen = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  const toggleDesktopCollapsed = useCallback(() => {
    setIsDesktopCollapsed((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isMobileOpen) {
        setIsMobileOpen(false);
      }
      if (window.innerWidth < 768 && isDesktopCollapsed) {
        setIsDesktopCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileOpen, isDesktopCollapsed]);

  useEffect(() => {
    if (!isMobileOpen) return;

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setIsMobileOpen(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  const value = {
    isMobileOpen,
    toggleMobileOpen,
    closeMobile,
    isDesktopCollapsed,
    toggleDesktopCollapsed,
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}
