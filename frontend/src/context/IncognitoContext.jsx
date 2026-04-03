import React, { createContext, useContext, useState, useCallback } from 'react';

const IncognitoContext = createContext(undefined);

export function IncognitoProvider({ children }) {
  const [isIncognito, setIsIncognito] = useState(false);

  const toggleIncognito = useCallback(() => {
    setIsIncognito(prev => !prev);
  }, []);

  return (
    <IncognitoContext.Provider value={{ isIncognito, toggleIncognito }}>
      {children}
    </IncognitoContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useIncognito() {
  const context = useContext(IncognitoContext);
  if (context === undefined) {
    throw new Error('useIncognito must be used within an IncognitoProvider. Did you forget to wrap your component in <IncognitoProvider>?');
  }
  return context;
}
