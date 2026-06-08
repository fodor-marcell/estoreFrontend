import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { useLocation, useNavigate } from 'react-router-dom';
import '../../css/UserLogin.css';

export default function LoginRegister({ onSuccess, onSuccessRedirectTo = '/' }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const mode = location?.state?.mode;
    if (mode === 'register') setIsLogin(false);
    if (mode === 'login') setIsLogin(true);
  }, [location?.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const fn = isLogin ? login : register;
    const res = await fn(username, password);
    if (res.success) {
      onSuccess && onSuccess();
      navigate(onSuccessRedirectTo, { replace: true });
    } else {
      setError(res.message || 'Authentication failed');
    }
  };

  return (
    <div className="user-login-wrapper">
      <div className="user-login-card">
        <div className="user-login-header">
          <h2>{isLogin ? 'Login' : 'Register'}</h2>
          <p>{isLogin ? 'Sign in to place orders' : 'Create an account to start ordering'}</p>
        </div>

        <form onSubmit={handleSubmit} className="user-login-form">
          <div className="user-login-field">
            <label>Username</label>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="user-login-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="user-login-primary-btn" type="submit">
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>

        <button className="user-login-secondary-btn" type="button" onClick={() => setIsLogin(l => !l)}>
          {isLogin ? 'No account? Register' : 'Already have an account? Login'}
        </button>

        {error && <div className="user-login-error">{error}</div>}
      </div>
    </div>
  );
}
