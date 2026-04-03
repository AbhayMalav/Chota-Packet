import { createContext, useContext } from 'react';

export const SessionContext = createContext(null);

export function useSessionStore() {
  const context = useContext(SessionContext);
  if (!context) {
    return { resetSession: null };
  }
  return context;
}
