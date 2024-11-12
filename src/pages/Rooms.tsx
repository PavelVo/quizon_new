import { supabase } from '../lib/supabaseClient';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import { LogOut, Home, ThumbsUp } from 'lucide-react';
import CurrentQuestionDisplay from './CurrentQuestionDisplay';
import PlayerTracker from './PlayerTracker';
import UserListDisplay from './UserListDisplay';

const Rooms: React.FC = () => {
  const { roomId } = useParams();
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const players = UserListDisplay(roomId);

  useEffect(() => {
    const fetchRoomName = async () => {
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('name')
          .eq('id', roomId)
          .single();

        if (error) throw error;
        setRoomName(data?.name || 'Room not found');
      } catch (error) {
        setError('Failed to fetch room name');
        // console.error(error);
      } finally {
        setLoading(false);
      }
    };

    const fetchCurrentQuestion = async () => {
      try {
        const { data, error } = await supabase
          .from('current_question')
          .select('content')
          .eq('room_id', roomId)
          .single();

        if (error) throw error;
        if (data) {
          setQuestions([data.content]);
        }
      } catch (error) {
        setError('Failed to fetch current question');
        // console.error(error);
      }
    };

    fetchRoomName();
    fetchCurrentQuestion();
  }, [roomId]);

  const handleLike = async (playerId) => {
    try {
      if (user?.id !== playerId) {
        const { data: playerData, error: fetchError } = await supabase
          .from('players')
          .select('likes')
          .eq('id', playerId)
          .single();
  
        if (fetchError) throw fetchError;
  
        const newLikes = playerData.likes + 1;
  
        const { error: updateError } = await supabase
          .from('players')
          .update({ likes: newLikes })
          .eq('id', playerId);
  
        if (updateError) throw updateError;
  
        setPlayers((prevPlayers) =>
          prevPlayers.map((player) =>
            player.id === playerId ? { ...player, likes: newLikes } : player
          )
        );
      }
    } catch (error) {
      // console.error('Error updating like in Supabase:', error);
    }
  };

  const currentUser = players.find((player) => player.user_token === user?.id);
  const otherPlayers = players.filter((player) => player.user_token !== user?.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user?.firstName}!
          </h1>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => navigate('/')}
              className="btn btn-secondary flex-1 sm:flex-initial"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>
            <button
              onClick={signOut}
              className="btn btn-secondary flex-1 sm:flex-initial"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="glass-card p-6 md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Room: {roomName}</h2>
            <div className="glass-card p-4 bg-yellow-50/50">
              <p className="text-lg">
                <CurrentQuestionDisplay roomId={roomId} />
              </p>
            </div>
          </div>

          <div className="glass-card p-6 space-y-4">
            <h2 className="text-xl font-semibold">Your Profile</h2>
            {currentUser && (
              <div className="glass-card p-4 bg-indigo-50/50">
                <div className="font-medium text-lg">{currentUser.user_name}</div>
                <div className="text-indigo-600 mt-2">
                  {currentUser.likes} likes received
                </div>
              </div>
            )}
          </div>

          <div className="glass-card p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Other Participants</h2>
              <span className="text-sm text-gray-600">
                {otherPlayers.length} online
              </span>
            </div>

            {otherPlayers.length === 0 ? (
              <p className="text-gray-600 text-center py-4">
                No other participants yet
              </p>
            ) : (
              <div className="space-y-3">
                {otherPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="glass-card p-4 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">{player.user_name}</div>
                      <div className="text-sm text-indigo-600">
                        {player.likes} likes
                      </div>
                    </div>
                    <button
                      onClick={() => handleLike(player.id)}
                      className="btn btn-primary p-2"
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <PlayerTracker roomId={roomId} />
          </div>

        </div>
      </div>
    </div>

  );
};

export default Rooms;
