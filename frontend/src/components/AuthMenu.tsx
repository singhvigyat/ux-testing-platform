import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../auth/AuthContext';

export default function AuthMenu() {
  const { ready, configured, user, quota, login, logout } = useAuth();
  const [error, setError] = useState('');

  if (!ready) {
    return <span className="auth-status">…</span>;
  }

  if (!user) {
    if (!configured) {
      return <span className="auth-status">Sign-in unavailable</span>;
    }

    return (
      <div className="auth-menu">
        <GoogleLogin
          onSuccess={(response) => {
            if (response.credential) {
              setError('');
              void login(response.credential).catch((err: unknown) => {
                setError((err as Error).message || 'Sign-in failed');
              });
            }
          }}
          onError={() => {
            setError('Google sign-in was cancelled.');
          }}
          theme="outline"
          size="medium"
          text="signin_with"
          shape="pill"
        />
        {error ? <span className="auth-status">{error}</span> : null}
      </div>
    );
  }

  const remaining = quota?.remaining ?? 0;

  return (
    <div className="auth-menu is-signed-in">
      {user.picture ? (
        <img src={user.picture} alt="" className="auth-avatar" referrerPolicy="no-referrer" />
      ) : null}
      <span className="auth-meta">
        <span className="auth-name">{user.name}</span>
        <span className="auth-quota">
          {remaining} left today
        </span>
      </span>
      <button type="button" className="nav-back" onClick={() => void logout()}>
        Sign out
      </button>
    </div>
  );
}
