import React, { useState } from 'react';
import AuthLayout from './AuthLayout';
import './AuthStyles.css';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validate = () => {
    const next = {};
    if (!name.trim()) next.name = 'Full name is required';
    if (!email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email';
    if (!password) next.password = 'Password is required';
    else if (password.length < 8) next.password = 'At least 8 characters';
    if (!confirm) next.confirm = 'Please confirm your password';
    else if (confirm !== password) next.confirm = "Passwords don't match";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    // TODO: integrate API signup (include name, email, password)
    setTimeout(() => setLoading(false), 800);
  };

  return (
    <AuthLayout>
      <header className="auth__header">
        <h1 className="auth__title">Create an account</h1>
        <p className="auth__subtitle">Join us for personalized shopping and faster checkout</p>
      </header>

      <div className="auth__divider" role="separator" aria-label="or" />

      <form className="auth__form" onSubmit={onSubmit} noValidate>
        <label className="auth__label" htmlFor="signup-name">Full name</label>
        <input
          id="signup-name"
          type="text"
          className="auth__input form-control"
          placeholder="John Doe"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {errors.name && <div className="auth__error" role="alert">{errors.name}</div>}

        <label className="auth__label" htmlFor="signup-email">Email</label>
        <input
          id="signup-email"
          type="email"
          className="auth__input form-control"
          placeholder="john@doe.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && <div className="auth__error" role="alert">{errors.email}</div>}

        <label className="auth__label" htmlFor="signup-password">Password</label>
        <div className="auth__input-wrap">
          <input
            id="signup-password"
            type={showPassword ? 'text' : 'password'}
            className="auth__input form-control auth__input--with-toggle"
            placeholder="At least 8 characters"
            autoComplete="new-password"
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

        <label className="auth__label" htmlFor="signup-confirm">Confirm password</label>
        <div className="auth__input-wrap">
          <input
            id="signup-confirm"
            type={showConfirm ? 'text' : 'password'}
            className="auth__input form-control auth__input--with-toggle"
            placeholder="Repeat your password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <button
            type="button"
            className="auth__toggle"
            aria-label={showConfirm ? 'Hide password' : 'Show password'}
            onClick={() => setShowConfirm((v) => !v)}
          >
            <svg className="auth__toggle-svg" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5C6 5 2 12 2 12s4 7 10 7 10-7 10-7-4-7-10-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z" fill="currentColor"/>
            </svg>
            <span>{showConfirm ? 'Hide' : 'Show'}</span>
          </button>
        </div>
        {errors.confirm && <div className="auth__error" role="alert">{errors.confirm}</div>}

        <button className="auth__submit" type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <p className="auth__meta">
        Already have an account? <a className="auth__link" href="/auth/login">Login</a>
      </p>
    </AuthLayout>
  );
}