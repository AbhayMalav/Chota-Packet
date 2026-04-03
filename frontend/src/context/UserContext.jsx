// src/context/UserContext.jsx
import React, { createContext, useContext, useState } from 'react';

const MOCK_USER = {
  name: 'Guest User',
  email: 'guest@example.com',
  avatar: null,
};

const UserContext = createContext(undefined);

export default function UserProvider({ children }) {
  const userState = useState(MOCK_USER);
  return (
    <UserContext.Provider value={userState}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context; // [user, setUser] tuple — destructure as: const [user] = useUser()
}