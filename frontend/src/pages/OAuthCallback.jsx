import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

export const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setOAuthSession } = useAuth();
  const { success, error } = useToast();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;

    const token = searchParams.get('token');
    const err = searchParams.get('error');

    if (err) {
      processedRef.current = true;
      error(`Social authentication failed: ${err}`);
      navigate('/login');
      return;
    }

    if (token) {
      processedRef.current = true;
      localStorage.setItem('devchronicle_access_token', token);
      api
        .get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          setOAuthSession(token, res.data.data.user);
          success('Authenticated via OAuth successfully!');
          navigate('/');
        })
        .catch(() => {
          error('Failed to retrieve user profile after OAuth login');
          navigate('/login');
        });
    } else {
      processedRef.current = true;
      navigate('/login');
    }
  }, [searchParams, navigate, setOAuthSession, success, error]);

  return (
    <div className="container" style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--text-muted)' }}>
      Completing social login... Please wait.
    </div>
  );
};
