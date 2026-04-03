import React from 'react';
import { SessionContext } from './SessionContext';

export function SessionProvider({ children, resetSession }) {
  return (
    <SessionContext.Provider value={{ resetSession }}>
      {children}
    </SessionContext.Provider>
  );
}
