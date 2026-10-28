/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, fetchUserProfile, upsertUserProfile, getLocalGuestProfile, saveLocalGuestProfile, recordMatchCompletion, UserProfileData, signOutUser } from './services/firebase';
import { network } from './services/network';
import { soundEngine } from './services/audio';
import { RoomState, CombatEvent, MatchResults, CharacterId, ServerMessage } from './shared/types';
import { CHARACTERS } from './shared/constants';

// Screens & Modals
import { WelcomeScreen } from './components/WelcomeScreen';
import { MainLobby } from './components/MainLobby';
import { CharacterSelectScreen } from './components/CharacterSelectScreen';
import { MatchmakingScreen } from './components/MatchmakingScreen';
import { RoomLobbyScreen } from './components/RoomLobbyScreen';
import { PhaserContainer } from './game/PhaserContainer';
import { HUD } from './components/HUD';
import { MatchResultsScreen } from './components/MatchResultsScreen';
import { LeaderboardScreen } from './components/LeaderboardScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { SettingsModal } from './components/SettingsModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { AuthModal } from './components/AuthModal';

export type ScreenState =
  | 'welcome'
  | 'lobby'
  | 'character_select'
  | 'matchmaking'
  | 'room_lobby'
  | 'game'
  | 'match_results'
  | 'leaderboard'
  | 'profile';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('welcome');
  const [profile, setProfile] = useState<UserProfileData>(getLocalGuestProfile());
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Network & Game Room State
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [latestCombatEvent, setLatestCombatEvent] = useState<CombatEvent | null>(null);
  const [matchResults, setMatchResults] = useState<MatchResults | null>(null);
  const [pingMs, setPingMs] = useState<number>(0);
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Audio & Settings State
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [highQualityGraphics, setHighQualityGraphics] = useState(true);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const existing = await fetchUserProfile(user.uid);
        if (existing) {
          setProfile(existing);
        } else {
          const newProfile: UserProfileData = {
            id: user.uid,
            displayName: user.displayName || 'AGENT_' + user.uid.substring(0, 5).toUpperCase(),
            avatar: 'avatar_1',
            level: 1,
            xp: 0,
            totalMatches: 0,
            wins: 0,
            selectedCharacter: profile.selectedCharacter || 'vortex',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await upsertUserProfile(newProfile);
          setProfile(newProfile);
        }
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Connect to Network WebSocket on boot
  useEffect(() => {
    network.connect();

    const unsubNetwork = network.addListener((msg: ServerMessage) => {
      switch (msg.type) {
        case 'joined_room': {
          setRoomState(msg.payload.state);
          if (msg.payload.state.phase === 'active') {
            setCurrentScreen('game');
          } else {
            setCurrentScreen('room_lobby');
          }
          break;
        }

        case 'room_state_update': {
          setRoomState(msg.payload);
          setPingMs(network.pingMs);
          if (msg.payload.phase === 'active' && currentScreen !== 'game') {
            setCurrentScreen('game');
          }
          break;
        }

        case 'combat_event': {
          setLatestCombatEvent(msg.payload);
          break;
        }

        case 'match_countdown': {
          soundEngine.playCountdown(msg.payload.count === 0);
          break;
        }

        case 'match_start': {
          soundEngine.playCountdown(true);
          setCurrentScreen('game');
          break;
        }

        case 'match_ended': {
          const results: MatchResults = msg.payload;
          setMatchResults(results);
          setCurrentScreen('match_results');

          // Persist match results & XP
          recordMatchCompletion(results, profile.id, profile).then(updated => {
            setProfile(updated);
          });
          break;
        }

        case 'error': {
          setNetworkError(msg.payload.message);
          setTimeout(() => setNetworkError(null), 4000);
          break;
        }
      }
    });

    return () => {
      unsubNetwork();
    };
  }, [profile, currentScreen]);

  // Handlers
  const handleQuickPlay = () => {
    network.connect().then(() => {
      network.joinMatchmaking({
        id: profile.id,
        name: profile.displayName,
        avatar: profile.avatar,
        character: profile.selectedCharacter as CharacterId
      });
      setCurrentScreen('matchmaking');
    });
  };

  const handlePractice = () => {
    network.startPracticeMode({
      id: profile.id,
      name: profile.displayName,
      avatar: profile.avatar,
      character: profile.selectedCharacter as CharacterId
    });
    setCurrentScreen('game');
  };

  const handleCreateRoom = () => {
    network.connect().then(() => {
      network.createRoom(
        {
          id: profile.id,
          name: profile.displayName,
          avatar: profile.avatar,
          character: profile.selectedCharacter as CharacterId
        },
        {
          matchDurationSec: 180,
          maxPlayers: 4,
          fillWithBots: true
        }
      );
      setCurrentScreen('room_lobby');
    });
  };

  const handleJoinRoomByCode = (code: string) => {
    network.connect().then(() => {
      network.joinRoom(code, {
        id: profile.id,
        name: profile.displayName,
        avatar: profile.avatar,
        character: profile.selectedCharacter as CharacterId
      });
    });
  };

  const handleLeaveMatchOrRoom = () => {
    network.leaveRoom();
    setRoomState(null);
    setCurrentScreen('lobby');
  };

  const handleSelectCharacter = (charId: CharacterId) => {
    const updated = { ...profile, selectedCharacter: charId };
    setProfile(updated);
    if (currentUser) {
      upsertUserProfile(updated);
    } else {
      saveLocalGuestProfile(updated);
    }
    network.updateCharacter(charId);
    setCurrentScreen('lobby');
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundEngine.setMuted(nextMuted);
  };

  const handleSignOut = async () => {
    await signOutUser();
    const guest = getLocalGuestProfile();
    setProfile(guest);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#060913] font-sans select-none touch-none">
      {/* Network Alert Notification */}
      {networkError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-950/90 border border-red-500 text-red-200 px-5 py-2.5 rounded-2xl shadow-2xl text-xs font-['Orbitron'] font-bold flex items-center gap-2 animate-bounce">
          <span>{networkError}</span>
        </div>
      )}

      {/* 1. Welcome Screen */}
      {currentScreen === 'welcome' && (
        <WelcomeScreen
          onQuickPlay={handleQuickPlay}
          onPractice={handlePractice}
          onOpenLobby={() => setCurrentScreen('lobby')}
          onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
          playerName={profile.displayName}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* 2. Main Lobby Screen */}
      {currentScreen === 'lobby' && (
        <MainLobby
          profile={profile}
          onQuickPlay={handleQuickPlay}
          onCreateRoom={handleCreateRoom}
          onJoinRoomByCode={handleJoinRoomByCode}
          onPractice={handlePractice}
          onOpenCharacters={() => setCurrentScreen('character_select')}
          onOpenLeaderboard={() => setCurrentScreen('leaderboard')}
          onOpenProfile={() => setCurrentScreen('profile')}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          isAuthenticated={!!currentUser}
          onSignOut={handleSignOut}
        />
      )}

      {/* 3. Character Selection Screen */}
      {currentScreen === 'character_select' && (
        <CharacterSelectScreen
          selectedCharacter={profile.selectedCharacter as CharacterId}
          onSelectCharacter={handleSelectCharacter}
          onBack={() => setCurrentScreen('lobby')}
        />
      )}

      {/* 4. Matchmaking Queue */}
      {currentScreen === 'matchmaking' && (
        <MatchmakingScreen
          onCancel={handleLeaveMatchOrRoom}
          characterName={CHARACTERS[profile.selectedCharacter as CharacterId]?.name || 'VORTEX'}
        />
      )}

      {/* 5. Room Lobby */}
      {currentScreen === 'room_lobby' && roomState && (
        <RoomLobbyScreen
          roomState={roomState}
          myPlayerId={profile.id}
          onToggleReady={() => network.toggleReady()}
          onStartMatch={() => network.startMatch()}
          onLeaveRoom={handleLeaveMatchOrRoom}
          onOpenCharacterSelect={() => setCurrentScreen('character_select')}
        />
      )}

      {/* 6. Active Interactive Gameplay Canvas + HUD */}
      {currentScreen === 'game' && (
        <div className="relative w-full h-full">
          <PhaserContainer
            myPlayerId={profile.id}
            roomState={roomState}
            latestCombatEvent={latestCombatEvent}
          />
          {roomState && (
            <HUD
              roomState={roomState}
              myPlayerId={profile.id}
              onSendInput={input => network.sendInput(input)}
              onLeaveMatch={handleLeaveMatchOrRoom}
              pingMs={pingMs}
            />
          )}
        </div>
      )}

      {/* 7. Match Results & Podium Screen */}
      {currentScreen === 'match_results' && matchResults && (
        <MatchResultsScreen
          results={matchResults}
          myPlayerId={profile.id}
          profile={profile}
          onPlayAgain={handleQuickPlay}
          onReturnToLobby={() => setCurrentScreen('lobby')}
        />
      )}

      {/* 8. Leaderboard Screen */}
      {currentScreen === 'leaderboard' && (
        <LeaderboardScreen
          onBack={() => setCurrentScreen('lobby')}
          myUserId={profile.id}
        />
      )}

      {/* 9. Profile Dossier Screen */}
      {currentScreen === 'profile' && (
        <ProfileScreen
          profile={profile}
          onUpdateProfile={up => {
            const updated = { ...profile, ...up };
            setProfile(updated);
            if (currentUser) {
              upsertUserProfile(updated);
            } else {
              saveLocalGuestProfile(updated);
            }
          }}
          onBack={() => setCurrentScreen('lobby')}
        />
      )}

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        volume={volume}
        onVolumeChange={v => setVolume(v)}
        highQualityGraphics={highQualityGraphics}
        onToggleGraphics={() => setHighQualityGraphics(!highQualityGraphics)}
      />

      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthenticated={user => {
          setCurrentUser(user);
        }}
        onGuestContinue={callsign => {
          const updated = { ...profile, displayName: callsign };
          setProfile(updated);
          saveLocalGuestProfile(updated);
        }}
        currentCallsign={profile.displayName}
      />
    </div>
  );
}
