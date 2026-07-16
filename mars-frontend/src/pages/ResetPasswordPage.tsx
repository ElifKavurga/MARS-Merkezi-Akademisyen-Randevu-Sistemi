import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import marsLogo from '../assets/images/mars-logo.png';
import { ROUTES, UI_LABELS, getHomePathForRole } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { resetPassword } from '../services/authService';
import Loading from '../components/Loading';
import '../styles/LoginPage.css';

const backToLoginLinkClassName =
  'group font-label-md text-label-md text-primary-container hover:text-primary transition-all inline-flex items-center gap-1 no-underline';

function BackToLoginLink() {
  return (
    <Link to={ROUTES.LOGIN} className={backToLoginLinkClassName}>
      <span
        className="material-symbols-outlined text-[16px] leading-none no-underline"
        aria-hidden="true"
      >
        chevron_left
      </span>
      <span className="underline-offset-4 group-hover:underline">Giriş ekranına dön</span>
    </Link>
  );
}

export default function ResetPasswordPage() {
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();
  const [institutionalEmail, setInstitutionalEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (isAuthenticated && user) {
    return <Navigate to={getHomePathForRole(user.role)} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await resetPassword({ institutionalEmail });
      setSubmitted(true);
      toast.success('Şifre sıfırlama bağlantısı gönderildi.');
    } catch (err) {
      let message = 'İstek gönderilemedi. Lütfen tekrar deneyin.';
      if (isAxiosError(err)) {
        const backendMessage = err.response?.data?.message;
        if (typeof backendMessage === 'string' && backendMessage.length > 0) {
          message = backendMessage;
        }
      }
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setSubmitted(false);
    setError(null);
    setInstitutionalEmail('');
  };

  return (
    <div className="login-page min-h-screen flex items-center justify-center p-6 font-body-md text-on-background">
      <main className="w-full max-w-md animate-fade-in">
        <div className="login-card bg-surface-container-lowest rounded-xl p-8 md:p-12 transition-all duration-300">
          <div className="flex flex-col items-center mb-10">
            <div className="login-logo w-20 h-20">
              <img alt="MARS Logo" className="w-full h-full object-contain" src={marsLogo} />
            </div>
          </div>

          {submitted ? (
            <div className="text-center animate-fade-in">
              <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-container-low text-[#0b1641]">
                <span
                  className="material-symbols-outlined text-[32px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  aria-hidden="true"
                >
                  check_circle
                </span>
              </div>
              <h1 className="font-headline-md text-headline-md text-on-surface mb-3">
                Bağlantı Gönderildi
              </h1>
              <p className="font-body-md text-on-surface-variant leading-relaxed mb-8">
                Lütfen e-posta kutunuzu kontrol edin. Şifrenizi sıfırlamanız için gerekli adımlar
                kurumsal adresinize iletilmiştir.
              </p>
              <div className="p-4 bg-surface-container-low/50 rounded-lg border border-outline-variant/20 mb-8">
                <p className="text-label-sm font-label-sm text-on-secondary-container">
                  E-posta gelmedi mi? Gereksiz (Spam) klasörünü kontrol edin veya 2 dakika sonra
                  tekrar deneyin.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRetry}
                className="w-full py-3 px-6 border border-outline-variant text-primary font-label-md rounded-lg hover:bg-surface-bright transition-all"
              >
                Tekrar Dene
              </button>
              <div className="mt-6 text-center">
                <BackToLoginLink />
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="font-headline-md text-headline-md text-on-surface mb-3">
                  Şifre Sıfırlama
                </h1>
                <p className="font-body-md text-on-surface-variant leading-relaxed">
                  Lütfen kurumsal e-posta adresinizi girin. Size bir sıfırlama bağlantısı
                  göndereceğiz.
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                <div className="space-y-2">
                  <label
                    className="block font-label-md text-label-md text-on-surface-variant px-1"
                    htmlFor="reset-email"
                  >
                    Kurumsal E-posta
                  </label>
                  <div className="login-field relative group">
                    <span className="login-field-icon material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">
                      alternate_email
                    </span>
                    <input
                      className="login-input w-full bg-white border border-outline-variant rounded-lg font-body-md focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/10 transition-all placeholder:text-outline-variant/60"
                      id="reset-email"
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
                    <Loading variant="inline" label={UI_LABELS.submitting} className="text-on-primary" />
                  ) : (
                    <>
                      <span>Sıfırlama Bağlantısı Gönder</span>
                      <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <BackToLoginLink />
              </div>
            </>
          )}
        </div>

        <footer className="mt-8 text-center">
          <p className="font-label-sm text-label-sm text-on-tertiary-container/60">
            © 2024 MARS Akademik Yönetim Sistemleri. Tüm hakları saklıdır.
          </p>
        </footer>
      </main>
    </div>
  );
}
