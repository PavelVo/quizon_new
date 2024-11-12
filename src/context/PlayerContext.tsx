// src/context/PlayerProvider.tsx
import React, { createContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// Определение интерфейса для игрока
interface Player {
  id: string;
  user_name: string;
  likes: number;
  user_token: string;
  room_id: string;
}

// Создание контекста для игроков
export const PlayerContext = createContext<{
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
}>({ players: [], setPlayers: () => {} });

// Компонент PlayerProvider
export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const roomId = 'your-room-id'; // Замените на динамическое получение roomId

    const fetchPlayers = async () => {
      try {
        const { data, error } = await supabase
          .from('players')
          .select('id, user_name, likes, user_token, room_id')
          .eq('room_id', roomId);

        if (error) throw error;
        setPlayers(data);
      } catch (error) {
        console.error('Error fetching players:', error);
      }
    };

    fetchPlayers();

    const handleRealtimeChanges = (payload) => {
      const { eventType, new: newPlayer, old: deletedPlayer } = payload;

      setPlayers((prevPlayers) => {
        switch (eventType) {
          case 'INSERT':
            return [...prevPlayers, newPlayer];
          case 'UPDATE':
            return prevPlayers.map((player) =>
              player.id === newPlayer.id ? newPlayer : player
            );
          case 'DELETE':
            return prevPlayers.filter((player) => player.id !== deletedPlayer.id);
          default:
            return prevPlayers;
        }
      });
    };

    const subscription = supabase
      .channel('user_token_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `room_id=eq.${roomId}`,
        },
        handleRealtimeChanges
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <PlayerContext.Provider value={{ players, setPlayers }}>
      {children}
    </PlayerContext.Provider>
  );
};
