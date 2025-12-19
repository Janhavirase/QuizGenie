import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage on load to persist login
    const storedUser = localStorage.getItem('quizgenie_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
  setUser(userData);
  // We still use localStorage here to keep you logged in if you refresh the browser
  localStorage.setItem('quizgenie_user', JSON.stringify(userData));
};

  const logout = () => {
    setUser(null);
    localStorage.removeItem('quizgenie_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};