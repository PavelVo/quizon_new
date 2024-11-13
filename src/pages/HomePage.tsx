import React, { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { LogOut, PlusCircle, Trash2, Clipboard, Lock, Unlock } from 'lucide-react';
import CryptoJS from 'crypto-js';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection
import toast from 'react-hot-toast';

const HomePage: React.FC = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate(); // Initialize the navigate function
  const [rooms, setRooms] = useState([]);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false); // Changed to isPrivate
  const userName = user.firstName || user.username || user.fullName || 'Unknown'; // Получаем имя пользователя

  useEffect(() => {
    fetchRooms(); // Fetch rooms on component mount
  }, [user]); // Add user as a dependency

  // Fetch rooms from Supabase
  const fetchRooms = async () => {
    if (!user?.id) return; // Check if user is available
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('usertoken', user.id); // Changed to usertoken

    if (error) {
      // console.error('Error fetching rooms:', error);
    } else {
      setRooms(data);
    }
  };

  // Generate a unique room ID based on the current timestamp
  const generateRoomId = (usertoken: string) => {
    const timestamp = Date.now(); // Получаем текущее время в миллисекундах
    const combined = `${usertoken}${timestamp}`; // Комбинируем usertoken и метку времени
    const hash = CryptoJS.SHA256(combined).toString();
    return hash.substring(0, 10); // Берем первые 10 символов хеша
  };

  // Generate a random four-digit pin
  const generateRandomPin = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  // Create a new room and save it to Supabase
  const handleCreateRoom = async () => {
    const usertoken = user?.id; // Changed to usertoken
    const roomId = generateRoomId(usertoken); // Changed to usertoken
    const pin = isPrivate ? generateRandomPin() : ''; // Generate pin if private

    const newRoom = {
      id: roomId,
      name: newRoomName,
      isprivate: isPrivate, // Changed to isPrivate
      usertoken, // Changed to usertoken
      pin, // Save generated pin
    };

    const { data, error } = await supabase.from('rooms').insert(newRoom);
    if (error) {
      // console.error('Error creating room:', error);
      toast.error('Error creating room:');
    } else {
      fetchRooms(); // Refresh the room list
      setShowCreateRoomModal(false);
      setNewRoomName('');
      // console.log('Room created:', data[0]);
      toast.success('Room created successfully!');
    }
  };

  // Delete a room from Supabase
  const handleDeleteRoom = async (roomId: string) => {
    const { error } = await supabase.from('rooms').delete().eq('id', roomId);
    if (error) {
      // console.error('Error deleting room:', error);
    } else {
      fetchRooms(); // Refresh the room list
      toast.success('Room deleted successfully');
    }
  };

  const handleCopyLink = (roomId: string) => {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link);
    // console.log('Copied link:', link);
    toast.success('Link copied to clipboard!');
  };

  // // Function to enter the room as organizer
  // const handleEnterAsOrganizer = (roomId: string) => {
  //   navigate(`/organizer/${roomId}`); // Redirect to the OrganizerRoom page
  // };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-white p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {userName}! 👋</h1>
          <button
            onClick={() => {
              // console.log('Sign Out button clicked');
              signOut();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </header>

        <main className="bg-white rounded-xl shadow-lg p-6">
          <div className="mb-4">
            <button
              onClick={() => setShowCreateRoomModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Room</span>
            </button>
          </div>

          {showCreateRoomModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="glass-card w-full max-w-md p-6 animate-fade-in">
                <h2 className="text-2xl font-bold mb-4">Create a New Room</h2>
                <input
                  type="text"
                  placeholder="Room Name"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="input glass-input mb-4"
                />
                <label className="flex items-center mb-6 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="mr-3 h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Make Room Private</span>
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={handleCreateRoom}
                    className="btn btn-primary flex-1"
                  >
                    Create Room
                  </button>
                  <button
                    onClick={() => setShowCreateRoomModal(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">My Rooms</h2>
            {rooms.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No rooms created yet. Create your first room!</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rooms.map(room => (
                  <div key={room.id} className="glass-card p-4 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      {room.isprivate ? (
                        <Lock className="w-5 h-5 text-rose-500" />
                      ) : (
                        <Unlock className="w-5 h-5 text-emerald-500" />
                      )}
                      <h3 className="font-semibold text-lg">{room.name}</h3>
                    </div>
                    
                    {room.isprivate && (
                      <div className="mb-3 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg text-sm">
                        PIN: {room.pin}
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mt-auto pt-4">
                      <button
                        onClick={() => handleCopyLink(room.id)}
                        className="btn btn-secondary flex-1 text-sm"
                      >
                        <Clipboard className="w-4 h-4" />
                        <span>Copy Link</span>
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room.id)}
                        className="btn btn-danger flex-1 text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                      <button
                        onClick={() => navigate(`/organizer/${room.id}`)}
                        className="btn btn-primary w-full text-sm"
                      >
                        Enter as Organizer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
};

export default HomePage;
