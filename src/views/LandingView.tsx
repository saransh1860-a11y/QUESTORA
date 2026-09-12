import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Shield, Sparkles, ArrowRight, CheckCircle2, Flame, Award, Zap } from 'lucide-react';

export const LandingView: React.FC = () => {
  const { login, register, loginWithGoogle } = useGame();
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      if (isLoginMode) {
        await login(email, password);
      } else {
        if (!username) {
          setError('Username is required for signup.');
          setIsSubmitting(false);
          return;
        }
        await register(email, password, username, 'Balanced');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await login('hero@questora.app', 'demo1234');
    } catch (err: any) {
      setError('Demo login failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Background Decorative Glow Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className="px-6 py-5 max-w-7xl mx-auto w-full flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-[0_0_20px_rgba(139,92,246,0.6)]">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-wider font-['Orbitron'] text-white">QUESTORA</h1>
            <p className="text-[10px] text-violet-400 font-medium">Level Up Your Real Life</p>
          </div>
        </div>

        <button
          onClick={handleDemoLogin}
          disabled={isSubmitting}
          className="px-4 py-2 rounded-xl bg-violet-950/60 border border-violet-500/40 text-violet-300 hover:text-white text-xs font-mono font-bold transition-all hover:bg-violet-900/60"
        >
          ⚡ INSTANT DEMO LOGIN
        </button>
      </header>

      {/* Main Hero Section */}
      <main className="max-w-7xl mx-auto w-full px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Left Copy */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/60 border border-violet-500/40 text-violet-300 text-xs font-mono font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>GAMIFIED PERSONAL PROGRESSION PLATFORM</span>
          </div>

          <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black font-['Cinzel'] tracking-tight leading-none text-white">
            YOUR LIFE. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-300 to-amber-300">
              YOUR QUEST.
            </span> <br />
            YOUR CHARACTER.
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-xl font-normal leading-relaxed">
            Turn everyday real-world goals into quests, earn XP & Gold, build attributes, maintain daily streaks, and watch your virtual RPG avatar evolve.
          </p>

          {/* Core Loop Highlights */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-violet-900/30 max-w-lg">
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
              <CheckCircle2 className="w-5 h-5 text-violet-400 mb-1" />
              <h4 className="text-xs font-bold text-white font-mono">Real Actions</h4>
              <p className="text-[11px] text-slate-400">Complete daily tasks</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
              <Flame className="w-5 h-5 text-orange-400 mb-1" />
              <h4 className="text-xs font-bold text-white font-mono">Earn XP & Gold</h4>
              <p className="text-[11px] text-slate-400">Non-linear leveling</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
              <Award className="w-5 h-5 text-amber-400 mb-1" />
              <h4 className="text-xs font-bold text-white font-mono">Unlock Shop</h4>
              <p className="text-[11px] text-slate-400">Cosmetic gear</p>
            </div>
          </div>
        </div>

        {/* Right Form Box */}
        <div className="lg:col-span-5 bg-[#10121a]/90 backdrop-blur-xl border border-violet-900/40 rounded-3xl p-8 shadow-[0_0_50px_rgba(139,92,246,0.15)]">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white font-['Orbitron']">
              {isLoginMode ? 'WELCOME BACK' : 'START YOUR JOURNEY'}
            </h3>
            <button
              type="button"
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="text-xs text-violet-400 font-semibold hover:underline"
            >
              {isLoginMode ? 'Need an account? Sign up' : 'Already have an account? Login'}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50 mb-4 text-xs font-sans tracking-wide"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>SIGN IN WITH GOOGLE</span>
          </button>

          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="px-3 text-[11px] font-mono text-slate-500 uppercase">or email</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoginMode && (
              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 mb-1">CHARACTER USERNAME</label>
                <input
                  type="text"
                  placeholder="e.g., Aetheris"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-colors"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 mb-1">EMAIL ADDRESS</label>
              <input
                type="email"
                placeholder="hero@questora.app"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 mb-1">PASSWORD</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-500 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-[0_0_25px_rgba(139,92,246,0.4)] transition-all active:scale-95 cursor-pointer disabled:opacity-50 mt-2 font-['Orbitron'] text-xs tracking-wider"
            >
              <span>{isLoginMode ? 'ENTER QUESTORA' : 'CREATE CHARACTER'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Demo Button inside Form */}
            <div className="pt-3 text-center">
              <span className="text-xs text-slate-500">Want to test immediately? </span>
              <button
                type="button"
                onClick={handleDemoLogin}
                className="text-xs font-bold text-amber-400 hover:underline"
              >
                Log in as Demo Hero
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-violet-900/20 text-center text-xs text-slate-500 relative z-10 font-mono">
        QUESTORA — Level Up Your Real Life. Productive RPG Personal Growth Platform.
      </footer>
    </div>
  );
};
