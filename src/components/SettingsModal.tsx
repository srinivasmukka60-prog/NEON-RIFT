/**
 * NEON RIFT - Settings Modal
 */
import React from 'react';
import { soundEngine } from '../services/audio';
import {
  X,
  Volume2,
  VolumeX,
  Sliders,
  Sparkles,
  Keyboard,
  Smartphone
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  highQualityGraphics: boolean;
  onToggleGraphics: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isMuted,
  onToggleMute,
  volume,
  onVolumeChange,
  highQualityGraphics,
  onToggleGraphics
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-black font-['Orbitron']">SETTINGS</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-5 py-4">
          {/* Sound Volume Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-2">
              <span className="flex items-center gap-1.5">
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                SYNTH AUDIO FX
              </span>
              <button
                onClick={onToggleMute}
                className="text-cyan-400 font-bold hover:underline cursor-pointer"
              >
                {isMuted ? 'UNMUTE' : 'MUTE'}
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={e => {
                const val = parseFloat(e.target.value);
                onVolumeChange(val);
                soundEngine.setVolume(val);
              }}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Graphics Quality */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800">
            <div>
              <span className="text-xs font-['Orbitron'] font-bold block">PARTICLE QUALITY</span>
              <span className="text-[11px] text-slate-400 font-['Rajdhani']">
                {highQualityGraphics ? 'Full neon bloom & shockwaves' : 'Optimized for mobile battery'}
              </span>
            </div>
            <button
              onClick={onToggleGraphics}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors ${
                highQualityGraphics ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {highQualityGraphics ? 'HIGH' : 'LOW'}
            </button>
          </div>

          {/* Controls Quick Reference */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
            <span className="text-slate-400 font-mono text-[10px] uppercase block mb-2">
              INPUT REFERENCE
            </span>
            <div className="grid grid-cols-2 gap-2 text-slate-300 font-['Rajdhani']">
              <div>
                <span className="font-bold text-cyan-400">[WASD / Touch Pad]</span> Move
              </div>
              <div>
                <span className="font-bold text-cyan-400">[Space / Dash Btn]</span> Dash
              </div>
              <div>
                <span className="font-bold text-purple-400">[Q / Shield Btn]</span> Shield
              </div>
              <div>
                <span className="font-bold text-amber-400">[E / Pulse Btn]</span> Pulse
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-['Orbitron'] font-black cursor-pointer shadow-md shadow-cyan-500/30"
        >
          CONFIRM SETTINGS
        </button>
      </div>
    </div>
  );
};
