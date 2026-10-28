/**
 * NEON RIFT - Phaser Game Container Component
 * Embeds Phaser 3 game engine within React lifecycle with auto-resize and event dispatch.
 */
import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { ArenaScene } from './scenes/ArenaScene';
import { RoomState, CombatEvent } from '../shared/types';

interface PhaserContainerProps {
  myPlayerId: string;
  roomState: RoomState | null;
  latestCombatEvent?: CombatEvent | null;
}

export const PhaserContainer: React.FC<PhaserContainerProps> = ({
  myPlayerId,
  roomState,
  latestCombatEvent
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<ArenaScene | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;

    const scene = new ArenaScene();
    sceneRef.current = scene;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width,
      height,
      backgroundColor: '#060913',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      },
      scene: [scene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    scene.events.once('create', () => {
      scene.setMyPlayerId(myPlayerId);
      if (roomState) {
        scene.setRoomState(roomState);
      }
    });

    const handleResize = () => {
      if (gameRef.current && containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        gameRef.current.scale.resize(w, h);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      game.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
  }, []);

  // Update Scene when roomState changes
  useEffect(() => {
    if (sceneRef.current && roomState) {
      sceneRef.current.setRoomState(roomState);
      sceneRef.current.setMyPlayerId(myPlayerId);
    }
  }, [roomState, myPlayerId]);

  // Dispatch combat events to scene for particle/sound triggers
  useEffect(() => {
    if (sceneRef.current && latestCombatEvent) {
      sceneRef.current.handleCombatEvent(latestCombatEvent);
    }
  }, [latestCombatEvent]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden select-none touch-none bg-[#060913]"
    />
  );
};
