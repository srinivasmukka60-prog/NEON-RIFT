/**
 * NEON RIFT - Authentication & Guest Sign-In Modal
 */
import React, { useState } from 'react';
import { signInWithGoogle, UserProfileData } from '../services/firebase';
import {
  X,
  LogIn,
  User,
  ShieldCheck,
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (user: any) => void;
  onGuestContinue: (callsign: string) => void;
  currentCallsign: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
  onGuestContinue,
  currentCallsign
}) => {
  const [callsign, setCallsign] = useState(currentCallsign);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const user = await signInWithGoogle();
      if (user) {
        onAuthenticated(user);
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Authentication cancelled or failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (callsign.trim().length >= 2) {
      onGuestContinue(callsign.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <LogIn className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-black font-['Orbitron']">OPERATOR AUTH</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-5 py-5">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Google Sign-in */}
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
              CLOUD SYNC VIA GOOGLE
            </span>
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-black font-['Orbitron'] font-bold text-xs tracking-wider flex items-center justify-center gap-3 cursor-pointer shadow-lg transition-transform active:scale-95"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>{loading ? 'AUTHENTICATING...' : 'SIGN IN WITH GOOGLE'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-[10px] font-mono text-slate-500 uppercase">OR QUICK GUEST</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Guest Callsign Form */}
          <form onSubmit={handleGuestSubmit} className="flex flex-col gap-3">
            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                CUSTOM OPERATOR CALLSIGN
              </label>
              <input
                type="text"
                value={callsign}
                maxLength={16}
                onChange={e => setCallsign(e.target.value)}
                placeholder="CALLSIGN"
                className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-700 focus:border-cyan-400 text-white font-['Orbitron'] font-bold text-sm outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={callsign.trim().length < 2}
              className="w-full py-3 rounded-2xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 font-['Orbitron'] font-bold text-xs tracking-wider cursor-pointer transition-all"
            >
              PLAY AS GUEST
            </button>
          </form>
        </div>

        <div className="text-[11px] text-slate-500 font-['Rajdhani'] text-center border-t border-slate-800/80 pt-3">
          Guest progression is saved locally. Connect with Google to protect your rank on global leaderboards.
        </div>
      </div>
    </div>
  );
};
