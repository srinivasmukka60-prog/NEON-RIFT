/**
 * NEON RIFT - Character Selection & Hero Arsenal
 */
import React, { useState } from 'react';
import { CharacterId, CharacterDef } from '../shared/types';
import { CHARACTERS, PLAYER_COLORS } from '../shared/constants';
import {
  Zap,
  Shield,
  Radio,
  ArrowLeft,
  CheckCircle,
  Sparkles,
  Gauge,
  Heart,
  Flame
} from 'lucide-react';

interface CharacterSelectScreenProps {
  selectedCharacter: CharacterId;
  onSelectCharacter: (charId: CharacterId) => void;
  onBack: () => void;
}

export const CharacterSelectScreen: React.FC<CharacterSelectScreenProps> = ({
  selectedCharacter,
  onSelectCharacter,
  onBack
}) => {
  const [activePreview, setActivePreview] = useState<CharacterId>(selectedCharacter);

  const heroList = Object.values(CHARACTERS);
  const currentHero = CHARACTERS[activePreview];

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 md:p-6 bg-[#070b16] text-white overflow-y-auto">
      {/* Header */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-slate-300 text-xs font-['Orbitron'] font-bold cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>BACK TO LOBBY</span>
        </button>

        <div className="text-right">
          <h2 className="text-xl md:text-2xl font-black font-['Orbitron'] text-white">
            HERO ARSENAL
          </h2>
          <p className="text-[11px] font-mono text-cyan-400 tracking-wider">
            SELECT COMBAT CHASSIS
          </p>
        </div>
      </div>

      {/* Main Grid: 4 Hero Cards (Top) and Detailed Inspector (Bottom) */}
      <div className="w-full max-w-6xl mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-center py-4">
        {/* Left: 4 Hero Selection Grid */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3">
          {heroList.map(hero => {
            const isSelected = selectedCharacter === hero.id;
            const isPreviewing = activePreview === hero.id;

            return (
              <div
                key={hero.id}
                onClick={() => setActivePreview(hero.id)}
                className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center ${
                  isPreviewing
                    ? 'bg-slate-900 border-cyan-400 shadow-lg shadow-cyan-500/30 -translate-y-1'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 text-[9px] text-cyan-400 font-mono font-bold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>LOCKED</span>
                  </div>
                )}

                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl text-black my-2 shadow-md"
                  style={{ backgroundColor: hero.primaryColor }}
                >
                  {hero.name.substring(0, 3)}
                </div>

                <h3 className="font-['Orbitron'] font-black text-sm text-white">
                  {hero.name}
                </h3>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {hero.tagline.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right: Detailed Selected Hero Inspector */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: currentHero.primaryColor }}
              />
              <span className="text-xs font-mono tracking-widest text-cyan-400 font-bold uppercase">
                {currentHero.tagline}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black font-['Orbitron'] text-white mt-1">
              {currentHero.name}
            </h1>
            <p className="text-sm text-slate-300 font-['Rajdhani'] font-medium mt-2 leading-relaxed">
              {currentHero.description}
            </p>

            {/* Stat Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              {/* Speed Bar */}
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400 font-mono flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-cyan-400" /> SPEED
                  </span>
                  <span className="font-bold text-white font-mono">{currentHero.baseSpeed}</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full"
                    style={{ width: `${(currentHero.baseSpeed / 360) * 100}%` }}
                  />
                </div>
              </div>

              {/* Health Bar */}
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400 font-mono flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-green-400" /> HEALTH
                  </span>
                  <span className="font-bold text-white font-mono">{currentHero.maxHealth}</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-400 rounded-full"
                    style={{ width: `${(currentHero.maxHealth / 150) * 100}%` }}
                  />
                </div>
              </div>

              {/* Pulse Blast Power */}
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400 font-mono flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-400" /> PULSE
                  </span>
                  <span className="font-bold text-white font-mono">{currentHero.pulseDamage} DMG</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${(currentHero.pulseDamage / 50) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Passive Trait Banner */}
            <div className="mt-5 p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-slate-300 font-['Rajdhani'] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="font-bold text-cyan-400 font-['Orbitron']">PASSIVE BONUS: </span>
                {currentHero.passiveBonus}
              </div>
            </div>
          </div>

          {/* Lock In / Select Button */}
          <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">
              STATUS: {selectedCharacter === activePreview ? 'READY FOR DEPLOYMENT' : 'CHASSIS AVAILABLE'}
            </span>

            <button
              onClick={() => onSelectCharacter(activePreview)}
              className={`px-8 py-3 rounded-2xl font-['Orbitron'] font-black text-sm tracking-wider cursor-pointer transition-all shadow-lg ${
                selectedCharacter === activePreview
                  ? 'bg-slate-800 text-slate-400 border border-slate-700'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/40'
              }`}
            >
              {selectedCharacter === activePreview ? 'EQUIPPED' : 'EQUIP CHASSIS'}
            </button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto text-center text-xs text-slate-500 font-mono">
        ALL HERO ABILITIES ARE VALIDATED AUTHORITATIVELY BY THE SERVER
      </div>
    </div>
  );
};
