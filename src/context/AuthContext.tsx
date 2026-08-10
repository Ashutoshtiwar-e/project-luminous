import { API_BASE_URL } from '../utils/api';
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  _id: string;
  username: string;
  email: string;
  savedBooks: string[];
  joinedCommunities: string[];
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateSavedBooks: (savedBooks: string[]) => void;
  updateJoinedCommunities: (joinedCommunities: string[]) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/me`, {
      credentials: 'include'
    })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (data && !data.error) setUser(data);
    })
    .catch(console.error);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (res.ok) {
      const data = await res.json();
      
      setUser(data.user);
    } else {
      let errorMessage = 'Login failed';
      try {
        const errorData = await res.json();
        if (errorData.error) errorMessage = errorData.error;
      } catch (e) {}
      throw new Error(errorMessage);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    if (res.ok) {
      const data = await res.json();
      
      setUser(data.user);
    } else {
      let errorMessage = 'Registration failed';
      try {
        const errorData = await res.json();
        if (errorData.error) errorMessage = errorData.error;
      } catch (e) {}
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    
    setUser(null);
  };

  const updateSavedBooks = (savedBooks: string[]) => {
    if (user) {
      setUser({ ...user, savedBooks });
    }
  };

  const updateJoinedCommunities = (joinedCommunities: string[]) => {
    if (user) {
      setUser({ ...user, joinedCommunities });
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateSavedBooks, updateJoinedCommunities }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
