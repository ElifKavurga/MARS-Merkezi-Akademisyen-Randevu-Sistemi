import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import marsLogo from '../assets/images/mars-logo.png';
import { ROUTES, getHomePathForRole } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { login } from '../services/authService';
import Loading from '../components/Loading';
import '../styles/LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated, user, setSession } = useAuth();

  const [institutionalEmail, setInstitutionalEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated && user) {
    return <Navigate to={getHomePathForRole(user.role)} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await login({ institutionalEmail, password });
      setSession(response);
      toast.success('Giriş başarılı.');
      navigate(getHomePathForRole(response.role), { replace: true });
    } catch (err) {
      let message = 'Giriş yapılamadı. Lütfen tekrar deneyin.';
      if (isAxiosError(err)) {
        const backendMessage = err.response?.data?.message;
        if (typeof backendMessage === 'string' && backendMessage.length > 0) {
          message = backendMessage;
        } else if (err.response?.status === 401 || err.response?.status === 403) {
          message = 'E-posta veya şifre hatalı.';
        }
      }
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page min-h-screen flex items-center justify-center p-6 font-body-md text-on-background">
      <main className="w-full max-w-md animate-fade-in">
        <div className="login-card bg-surface-container-lowest rounded-xl p-8 md:p-12 transition-all duration-300">
          <div className="flex flex-col items-center mb-10">
            <div className="login-logo w-24 h-24 mb-6">
              <img alt="MARS Logo" className="w-full h-full object-contain" src={marsLogo} />
            </div>
            <h1 className="font-headline-lg text-headline-lg text-primary text-center mb-2">
              Akademik Sisteme Giriş Yapın
            </h1>
            <p className="font-body-md text-on-secondary-container text-center max-w-[280px]">
              Kurumsal kimliğinizle güvenli erişim sağlayın.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <label
                className="block font-label-md text-label-md text-on-surface-variant px-1"
                htmlFor="email"
              >
                Kurumsal E-posta
              </label>
              <div className="login-field relative group">
                <span className="login-field-icon material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">
                  mail
                </span>
                <input
                  className="login-input w-full bg-white border border-outline-variant rounded-lg font-body-md focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/10 transition-all placeholder:text-outline-variant/60"
                  id="email"
                  name="institutionalEmail"
                  placeholder="ad.soyad@universite.edu.tr"
                  required
                  type="email"
                  autoComplete="username"
                  value={institutionalEmail}
                  onChange={(event) => setInstitutionalEmail(event.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label
                  className="block font-label-md text-label-md text-on-surface-variant"
                  htmlFor="password"
                >
                  Şifre
                </label>
              </div>
              <div className="login-field relative group">
                <span className="login-field-icon material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">
                  lock
                </span>
                <input
                  className="login-input login-input--password w-full bg-white border border-outline-variant rounded-lg font-body-md focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/10 transition-all placeholder:text-outline-variant/60"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                />
                <button
                  className="login-field-toggle text-outline hover:text-primary transition-colors"
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {error ? (
              <p className="font-label-sm text-label-sm text-error text-center" role="alert">
                {error}
              </p>
            ) : null}

            <button
              className="w-full py-4 bg-[#0b1641] text-on-primary font-headline-md text-body-md rounded-lg hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-container/10 disabled:opacity-80 disabled:pointer-events-none"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <Loading variant="inline" label="Loading..." className="text-on-primary" />
              ) : (
                <>
                  <span>Giriş Yap</span>
                  <span className="material-symbols-outlined text-[20px]">login</span>
                </>
              )}
            </button>

            <div className="pt-4 text-center">
              <Link
                className="font-label-md text-label-md text-primary-container hover:text-primary underline-offset-4 hover:underline transition-all"
                to={ROUTES.RESET_PASSWORD}
              >
                Şifremi Unuttum
              </Link>
            </div>
          </form>

          <div className="mt-12 pt-8 border-t border-outline-variant flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-outline-variant">
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              <span className="font-label-sm text-label-sm uppercase tracking-widest">
                Secure Institutional Access
              </span>
            </div>
            <p className="font-label-sm text-label-sm text-on-secondary-container/50 text-center italic">
              Bu sistem yalnızca yetkili akademik personel kullanımı içindir.
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-6 text-outline-variant">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="font-label-sm text-label-sm">Sistem Aktif</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-label-sm text-label-sm">v4.2.0-stable</span>
          </div>
        </div>
      </main>
    </div>
  );
}
