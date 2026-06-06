import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    authAPI.me()
      .then((r) => setUser(r.data.data))
      .catch(() => localStorage.clear())
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const r = await authAPI.login({ email, password });
    const { user, token } = r.data.data;
    localStorage.setItem('token', token);
    setUser(user);
    return user;
  };

  // Step 1: send registration data → triggers OTP email, no token yet
  const registerRequest = async (data) => {
    await authAPI.register(data);
  };

  // Step 2: verify OTP → creates account, returns token
  const registerVerify = async (email, otp) => {
    const r = await authAPI.verifyRegisterOtp({ email, otp });
    const { user, token } = r.data.data;
    localStorage.setItem('token', token);
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, registerRequest, registerVerify, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
