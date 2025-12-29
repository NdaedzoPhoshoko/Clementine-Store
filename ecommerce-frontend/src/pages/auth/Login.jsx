import React, { useState, useEffect } from 'react';
import AuthLayout from './AuthLayout';
import './AuthStyles.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthLogin } from '../../hooks/use_auth';
import SuccessModal from '../../components/modals/success_modal/SuccessModal.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading: loginLoading, error: loginError } = useAuthLogin();
  const [modal, setModal] = useState({ open: false, variant: 'success', title: '', message: '' });
  const navigate = useNavigate();
  const location = useLocation();
  const nextParam = new URLSearchParams(location.search).get('next');
  const destination = nextParam && nextParam.startsWith('/') ? nextParam : '/shop-all';

  const validate = () => {
    const next = {};
    if (!email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email';
    if (!password) next.password = 'Password is required';
    else if (password.length < 8) next.password = 'At least 8 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await login({ email, password });
      setModal({
        open: true,
        variant: 'success',
        title: 'Welcome back',
        message: "You're in! Explore new arrivals, trending fits, and exclusive deals.",
      });
    } catch (_) {
      // handled via loginError state from hook
    }
  };

  useEffect(() => {
    if (loginError) {
      const msg = typeof loginError === 'string'
        ? loginError
        : 'There was an error logging you in.';
      setModal({ open: true, variant: 'error', title: 'Try Again', message: msg });
    }
  }, [loginError]);

  return (
    <AuthLayout>
      <header className="auth__header">
        <h1 className="auth__title">Welcome</h1>
        <p className="auth__subtitle">Get started for a seamless shopping experience</p>
      </header>

      <div className="auth__divider" role="separator" aria-label="or" />

      <form className="auth__form" onSubmit={onSubmit} noValidate>
        <label className="auth__label" htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          className="auth__input form-control"
          placeholder="john@doe.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && <div className="auth__error" role="alert">{errors.email}</div>}

        <div className="auth__field-row">
          <label className="auth__label" htmlFor="login-password">Password</label>
          <Link className="auth__link" to="/auth/forgot" aria-label="Forgot password">Forgot password?</Link>
        </div>
        <div className="auth__input-wrap">
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            className="auth__input form-control auth__input--with-toggle"
            placeholder="At least 8 characters"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="auth__toggle"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword((v) => !v)}
          >
            <svg className="auth__toggle-svg" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5C6 5 2 12 2 12s4 7 10 7 10-7 10-7-4-7-10-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z" fill="currentColor"/>
            </svg>
            <span>{showPassword ? 'Hide' : 'Show'}</span>
          </button>
        </div>
        {errors.password && <div className="auth__error" role="alert">{errors.password}</div>}
        {/* DB errors are shown via modal; keep inline validation errors only */}

        <button className="auth__submit" type="submit" disabled={loginLoading}>
          {loginLoading ? 'Logging in…' : 'Login'}
        </button>
      </form>

      <p className="auth__meta">
        Don't have an account? <Link className="auth__link" to="/auth/signup">Register</Link>
      </p>

      <SuccessModal
        open={modal.open}
        variant={modal.variant}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
        onAfterClose={() => {
          if (modal.variant === 'success') {
            navigate(destination);
          }
        }}
        autoCloseMs={10000}
      />
    </AuthLayout>
  );
}
