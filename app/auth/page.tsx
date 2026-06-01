'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

// GitLab logo SVG component
const GitLabLogo = () => (
  <svg width="64" height="64" viewBox="0 0 210 194" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M105.0614 193.655L105.0635 193.656L105.0657 193.655L143.798 107.192L66.3262 107.192L105.0614 193.655Z" fill="#E24329"/>
    <path d="M105.061 193.655L66.3262 107.192H19.2329L105.061 193.655Z" fill="#FC6D26"/>
    <path d="M19.2318 107.192L5.54568 148.525C4.32224 152.471 5.79355 156.819 9.16478 159.212L105.06 193.655L19.2318 107.192Z" fill="#FCA326"/>
    <path d="M19.2329 107.192H66.3262L47.3054 48.8419C46.2555 45.4995 41.4508 45.4995 40.4009 48.8419L19.2329 107.192Z" fill="#E24329"/>
    <path d="M105.061 193.655L143.798 107.192H190.891L105.061 193.655Z" fill="#FC6D26"/>
    <path d="M190.892 107.192L204.578 148.525C205.802 152.471 204.330 156.819 200.959 159.212L105.063 193.655L190.892 107.192Z" fill="#FCA326"/>
    <path d="M190.891 107.192H143.798L162.819 48.8419C163.869 45.4995 168.673 45.4995 169.723 48.8419L190.891 107.192Z" fill="#E24329"/>
  </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [rememberMeM365, setRememberMeM365] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Set the session token as a cookie
      document.cookie = `session_token=${encodeURIComponent(email)}; path=/; max-age=86400; SameSite=Strict`;

      // Verify access by attempting to navigate
      router.push('/utils');
    } catch (err) {
      setError('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1f1f1f] text-white">
      {/* Top Banner */}
      <div className="bg-[#375a7f] px-6 py-3 flex items-center gap-3">
        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM5.496 6.033h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286a.237.237 0 0 0 .241.247zm2.325 6.443c.61 0 1.029-.394 1.029-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94 0 .533.425.927 1.01.927z"/>
        </svg>
        <span className="text-sm">
          Le support aux utilisateurs et les demandes de création de comptes externes doivent être faites depuis les issues du projet{' '}
          <a href="#" className="underline hover:text-white font-medium">GitLab HEFR</a>
        </span>
      </div>

      {/* Main Content */}
      <div className="flex min-h-[calc(100vh-52px)]">
        {/* Left Panel - Info */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12">
          <div className="max-w-md space-y-6">
            <h1 className="text-3xl font-normal mb-8">HES-SO Fribourg - GitLab</h1>

            <div className="space-y-4 text-[#d1d1d1]">
              <p>
                HES-SO members: Please log in using your HES-SO Microsoft account using the "Microsoft M365" button.
              </p>

              <p>
                External users: Please use the credentials provided to you on the login form.
              </p>

              <p>
                For support, please contact{' '}
                <a href="mailto:FR-HEIA-Forge@hefr.ch" className="text-[#5b9dd9] hover:underline">
                  FR-HEIA-Forge@hefr.ch
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <GitLabLogo />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username/Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-normal text-[#d1d1d1] mb-2">
                  Username or primary email
                </label>
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#2b2b2b] border-2 border-[#1f75cb] rounded text-white text-base focus:outline-none focus:border-[#5b9dd9] transition-colors"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-normal text-[#d1d1d1] mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2.5 pr-10 bg-[#2b2b2b] border-2 border-[#1f75cb] rounded text-white text-base focus:outline-none focus:border-[#5b9dd9] transition-colors"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#d1d1d1] hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="text-right mt-2">
                  <a href="#" className="text-sm text-[#5b9dd9] hover:underline">
                    Forgot your password?
                  </a>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-[#2b2b2b] accent-[#5b9dd9]"
                />
                <label htmlFor="remember" className="text-sm text-[#d1d1d1]">
                  Remember me
                </label>
              </div>

              {error && (
                <div className="p-3 bg-red-900/50 border border-red-700 rounded">
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full py-2.5 bg-[#5b9dd9] text-[#1f1f1f] text-base font-medium rounded hover:bg-[#6faddb] disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>

              {/* Passkey Button */}
              <button
                type="button"
                className="w-full py-2.5 bg-[#54575f] text-white text-base font-medium rounded hover:bg-[#5f6269] transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M12.5 5.5a.5.5 0 0 1 1 0V7h1.5a.5.5 0 0 1 0 1H13.5v1.5a.5.5 0 0 1-1 0V8H11a.5.5 0 0 1 0-1h1.5V5.5z"/>
                  <path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H1s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C9.516 10.68 8.289 10 6 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                </svg>
                Passkey
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 py-2">
                <div className="flex-1 border-t border-gray-600"></div>
                <span className="text-sm text-[#d1d1d1]">or sign in with</span>
                <div className="flex-1 border-t border-gray-600"></div>
              </div>

              {/* Microsoft M365 Button */}
              <button
                type="button"
                className="w-full py-2.5 bg-[#54575f] text-white text-base font-medium rounded hover:bg-[#5f6269] transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none">
                  <rect width="11" height="11" fill="#F25022"/>
                  <rect x="12" width="11" height="11" fill="#7FBA00"/>
                  <rect y="12" width="11" height="11" fill="#00A4EF"/>
                  <rect x="12" y="12" width="11" height="11" fill="#FFB900"/>
                </svg>
                Microsoft M365
              </button>

              {/* Remember Me for M365 */}
              <div className="flex items-center justify-center gap-2">
                <input
                  type="checkbox"
                  id="rememberM365"
                  checked={rememberMeM365}
                  onChange={(e) => setRememberMeM365(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-[#2b2b2b] accent-[#5b9dd9]"
                />
                <label htmlFor="rememberM365" className="text-sm text-[#d1d1d1]">
                  Remember me
                </label>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
