import React, { useState } from 'react';
import { Card, Button, Icons } from '../components/UI';
import { api } from '../api';

interface AuthProps {
  onLogin: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await api.login(email.trim(), password.trim());
      } else {
        await api.register(email.trim(), password.trim(), name.trim());
      }
      onLogin(); // Proceed to app
    } catch (err) {
      console.error(err);
      setError("Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Enhanced Auth Component with Saturated Light Theme & Grid
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100">
      {/* Animated Background Grid & Characters */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">

        {/* Moving Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.4] animate-scroll"></div>

        {/* Blobs for depth (Saturated) */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/30 rounded-full blur-[100px] animate-blob mix-blend-multiply filter"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-400/30 rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-multiply filter"></div>
        <div className="absolute top-[40%] left-[40%] w-[40%] h-[40%] bg-pink-400/20 rounded-full blur-[120px] animate-blob animation-delay-4000 mix-blend-multiply filter"></div>

        {/* Floating Icons (Vibrant Colors) */}
        <div className="absolute top-[15%] left-[10%] text-blue-500 animate-float animation-delay-500 transform hover:scale-110 transition-transform duration-300">
          <Icons.Robot className="w-16 h-16 opacity-80 rotate-[-10deg] drop-shadow-lg" />
        </div>
        <div className="absolute bottom-[20%] left-[15%] text-indigo-600 animate-float animation-delay-2000 transform hover:scale-110 transition-transform duration-300">
          <Icons.Code className="w-14 h-14 opacity-80 rotate-[15deg] drop-shadow-md" />
        </div>
        <div className="absolute top-[20%] right-[10%] text-rose-500 animate-float animation-delay-4000 transform hover:scale-110 transition-transform duration-300">
          <Icons.Bug className="w-14 h-14 opacity-80 rotate-[5deg] drop-shadow-lg" />
        </div>
        <div className="absolute bottom-[15%] right-[20%] text-amber-600 animate-float animation-delay-700 transform hover:scale-110 transition-transform duration-300">
          <Icons.Coffee className="w-12 h-12 opacity-80 rotate-[-5deg] drop-shadow-md" />
        </div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-3xl mb-6 ring-1 ring-indigo-50 animate-float">
            <Icons.Brain className="text-indigo-600 w-10 h-10" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-800 mb-3 tracking-tight animate-fade-in-up">DevMind</h1>
          <p className="text-slate-500 text-lg font-medium animate-fade-in-up animation-delay-500">Cognitive analytics for the modern developer.</p>
        </div>

        <div className="animate-fade-in-up animation-delay-700">
          <Card className="bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 rounded-3xl overflow-hidden hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500">
            <div className="p-8 space-y-6">
              {/* Toggle Switch */}
              <div className="flex bg-slate-100/50 p-1.5 rounded-xl mb-6 relative border border-slate-200/50">
                <div
                  className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-lg shadow-sm transition-all duration-300 ease-out transform ${isLogin ? 'translate-x-0' : 'translate-x-full left-[6px]'}`}
                ></div>
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 relative z-10 py-2.5 text-sm font-semibold transition-colors duration-300 ${isLogin ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 relative z-10 py-2.5 text-sm font-semibold transition-colors duration-300 ${!isLogin ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all duration-200 text-slate-700"
                      placeholder="John Doe"
                      required={!isLogin}
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all duration-200 text-slate-700"
                    placeholder="dev@example.com"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all duration-200 text-slate-700"
                    placeholder="••••••••"
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 animate-shake">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    <p className="text-xs font-medium text-red-600">{error}</p>
                  </div>
                )}

                {!isLogin && (
                  <div className="flex items-start space-x-3 mt-2 px-1">
                    <div className="relative flex items-center">
                      <input type="checkbox" className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-300 checked:border-indigo-500 checked:bg-indigo-500 transition-all" required />
                      <Icons.Check className="pointer-events-none absolute left-0 top-0 h-4 w-4 text-white opacity-0 peer-checked:opacity-100" />
                    </div>
                    <p className="text-xs text-slate-500 leading-tight">I agree to the <span className="font-semibold text-indigo-600 cursor-pointer hover:underline">Terms of Service</span> and <span className="font-semibold text-indigo-600 cursor-pointer hover:underline">Privacy Policy</span>.</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-3.5 rounded-xl shadow-[0_10px_20px_rgba(99,102,241,0.2)] hover:shadow-[0_15px_30px_rgba(99,102,241,0.3)] transform transition-all active:scale-[0.98]"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (isLogin ? 'Sign In' : 'Join DevMind')}
                </Button>
              </form>

              {isLogin && (
                <div className="text-center pt-2">
                  <a href="#" className="text-sm text-indigo-500 hover:text-indigo-700 font-semibold transition-colors">Forgot password?</a>
                </div>
              )}
            </div>
          </Card>
        </div>

        <p className="text-center text-xs text-slate-400 mt-8 font-medium animate-fade-in-up animation-delay-700">
          &copy; 2024 DevMind Labs. Built by developers, for developers.
        </p>
      </div>
    </div>
  );
};
