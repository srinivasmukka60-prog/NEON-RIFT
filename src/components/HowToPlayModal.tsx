/**
 * NEON RIFT - How to Play & Field Manual Modal
 */
import React from 'react';
import {
  X,
  HelpCircle,
  Gem,
  Flag,
  Zap,
  Shield,
  Radio,
  Crosshair,
  Smartphone
} from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 w-full max-w-xl shadow-2xl text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-black font-['Orbitron']">OPERATIONAL MANUAL</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Manual Content */}
        <div className="flex flex-col gap-4 py-4 text-xs">
          {/* Mission Directive */}
          <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30">
            <h4 className="font-['Orbitron'] font-bold text-cyan-400 text-sm mb-1">
              MISSION DIRECTIVE
            </h4>
            <p className="text-slate-300 font-['Rajdhani'] text-xs leading-relaxed">
              NEON RIFT is a competitive top-down sci-fi arena for 2–8 operators. Accumulate the highest score before the 180-second clock expires by harvesting crystals, capturing territory, and eliminating hostiles.
            </p>
          </div>

          {/* Scoring Objectives */}
          <div>
            <h4 className="font-['Orbitron'] font-bold text-white text-xs uppercase tracking-wider mb-2">
              1. SCORING OBJECTIVES
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <Gem className="w-5 h-5 text-cyan-400 mb-1" />
                <span className="font-bold text-white block">CRYSTALS</span>
                <span className="text-slate-400 font-['Rajdhani'] block text-[11px] mt-0.5">
                  Standard (+15 pts) & Mega Gold (+45 pts) crystals spawn across the arena floor.
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <Flag className="w-5 h-5 text-amber-400 mb-1" />
                <span className="font-bold text-white block">CONTROL ZONES</span>
                <span className="text-slate-400 font-['Rajdhani'] block text-[11px] mt-0.5">
                  Hold Alpha, Core, or Omega uncontested to generate +10 points every second.
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <Crosshair className="w-5 h-5 text-red-400 mb-1" />
                <span className="font-bold text-white block">TAKEDOWNS</span>
                <span className="text-slate-400 font-['Rajdhani'] block text-[11px] mt-0.5">
                  Eliminating an opponent awards +50 pts and triggers a 3-second respawn timer.
                </span>
              </div>
            </div>
          </div>

          {/* Core Abilities */}
          <div>
            <h4 className="font-['Orbitron'] font-bold text-white text-xs uppercase tracking-wider mb-2">
              2. COMBAT ABILITIES
            </h4>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-cyan-950 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-['Orbitron'] text-white">DASH</span>
                    <span className="text-[10px] text-cyan-400 font-mono">[SPACE / DASH BTN]</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-['Rajdhani'] mt-0.5">
                    High-velocity surge in your current movement direction. Ideal for escaping pulses or snatching mega crystals.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-purple-950 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-['Orbitron'] text-white">HARDLIGHT SHIELD</span>
                    <span className="text-[10px] text-purple-400 font-mono">[Q / SHIELD BTN]</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-['Rajdhani'] mt-0.5">
                    Projects a temporary barrier completely neutralizing incoming pulse damage and knockback force.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-amber-950 flex items-center justify-center shrink-0">
                  <Radio className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-['Orbitron'] text-white">ENERGY PULSE</span>
                    <span className="text-[10px] text-amber-400 font-mono">[E / PULSE BTN]</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-['Rajdhani'] mt-0.5">
                    Unleashes an expanding shockwave that deals damage and violently knocks away unshielded rivals.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-['Orbitron'] font-black cursor-pointer shadow-md shadow-cyan-500/30"
        >
          RETURN TO ARENA
        </button>
      </div>
    </div>
  );
};
