import { supabase } from '../lib/supabaseClient';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import { LogOut, Home, Trash2, Send, Shuffle, ChevronRight, Upload, Eye, EyeOff, Check } from 'lucide-react';
import UserListDisplay from './UserListDisplay';

const OrganizerRoom: React.FC = () => {
  const { roomId } = useParams();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [question, setQuestion] = useState<string>('');
  const [questions, setQuestions] = useState<{ id: number; content: string; show: boolean }[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const players = UserListDisplay(roomId);

  useEffect(() => {
    const fetchRoomName = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('name')
          .eq('id', roomId)
          .single();

        if (error) throw error;
        setRoomName(data.name);
      } catch (error) {
        // console.error('Error fetching room name:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchQuestions = async () => {
      if (roomId) {
        try {
          const { data, error } = await supabase
            .from('questions')
            .select('*')
            .eq('room_id', roomId);

          if (error) throw error;
          const initializedQuestions = data.map((q) => ({ ...q, show: true }));
          setQuestions(initializedQuestions);
        } catch (error) {
          // console.error('Error fetching questions:', error);
        }
      }
    };

    const fetchCurrentQuestion = async () => {
      if (roomId) {
        try {
          const { data, error } = await supabase
            .from('current_question')
            .select('content')
            .eq('room_id', roomId)
            .single();

          if (data) {
            setCurrentQuestion(data.content);
          }
        } catch (error) {
          // console.error('Error fetching current question:', error);
        }
      }
    };

    if (roomId) {
      fetchRoomName();
      fetchQuestions();
      fetchCurrentQuestion();
    }
  }, [roomId]);

  const handleAddQuestion = async () => {
    if (!question) return;

    try {
      const { error } = await supabase
        .from('questions')
        .insert([{ room_id: roomId, content: question }]);

      if (error) throw error;

      setQuestions((prevQuestions) => [...prevQuestions, { id: Date.now(), content: question, show: true }]);
      setQuestion('');
      setMessage('Question added successfully!');
      await handleUpdateCurrentQuestion(question);
    } catch (error) {
      // console.error('Error adding question:', error);
      setMessage('Error adding question.');
    }
  };

  const handleUpdateCurrentQuestion = async (content: string) => {
    try {
      const { error } = await supabase
        .from('current_question')
        .upsert([{ room_id: roomId, content }], { onConflict: ['room_id'] });

      if (error) throw error;
      setCurrentQuestion(content);
    } catch (error) {
      // console.error('Error updating current question:', error);
      setMessage('Error updating current question.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      setMessage('User removed from room successfully!');
    } catch (error) {
      // console.error('Error deleting user:', error);
      setMessage('Error deleting user.');
    }
  };

  const handleShowQuestion = (index: number) => {
    setCurrentQuestion(questions[index].content);
    handleUpdateCurrentQuestion(questions[index].content);
  };

  const handleNextQuestion = () => {
    let nextIndex = (questions.findIndex(q => q.content === currentQuestion) + 1) % questions.length;
    while (nextIndex < questions.length && !questions[nextIndex].show) {
      nextIndex++;
    }
    if (nextIndex >= questions.length) {
      nextIndex = 0;
    }
    setCurrentQuestion(questions[nextIndex].content);
    handleUpdateCurrentQuestion(questions[nextIndex].content);
  };

  const toggleQuestionVisibility = (id: number) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) =>
        q.id === id ? { ...q, show: !q.show } : q
      )
    );
  };

  const toggleQuestionSelection = (id: number) => {
    setSelectedQuestions((prev) =>
      prev.includes(id) ? prev.filter((qId) => qId !== id) : [...prev, id]
    );
  };

  const handleDeleteQuestion = async (id: number) => {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setQuestions((prevQuestions) => prevQuestions.filter(q => q.id !== id));
      setMessage('Question deleted successfully!');
    } catch (error) {
      // console.error('Error deleting question:', error);
      setMessage('Error deleting question.');
    }
  };

  const shuffleQuestions = () => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setMessage('Questions shuffled successfully!');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const contents = e.target?.result as string;
      const newQuestions = contents.split(';').map(q => q.trim()).filter(q => q);

      try {
        const { error } = await supabase
          .from('questions')
          .insert(newQuestions.map(content => ({ room_id: roomId, content })));

        if (error) throw error;

        setQuestions(prev => [
          ...prev,
          ...newQuestions.map((content, index) => ({
            id: Date.now() + index,
            content,
            show: true,
          }))
        ]);
        setMessage('Questions imported successfully');
        setTimeout(() => setMessage(null), 3000);
      } catch (error) {
        // console.error('Error:', error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-900">
            {loading ? 'Loading...' : roomName || 'Room not found'}
          </h1>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => navigate('/')}
              className="btn btn-secondary flex-1 sm:flex-initial flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>
            <button
              onClick={() => signOut()}
              className="btn btn-secondary flex-1 sm:flex-initial flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {message && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg animate-fade-in">
            {message}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <div className="glass-card p-6 md:col-span-2">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="input flex-1"
                placeholder="Type your question here"
              />
              <button 
                onClick={handleAddQuestion}
                className="btn btn-primary w-full sm:w-auto flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Add Question</span>
              </button>
              <input
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <button
                onClick={() => document.getElementById('file-upload')?.click()}
                className="btn btn-secondary w-full sm:w-auto flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Import Questions</span>
              </button>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Current Question:</h2>
              <p className="text-lg">{currentQuestion || 'No question displayed'}</p>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Participants</h2>
              <span className="text-sm text-gray-600">{players.length} online</span>
            </div>

            <div className="space-y-3">
              {players.map((player) => (
                <div key={player.id} className="glass-card p-3 flex items-center justify-between">
                  <div>
                    <span className="font-medium">{player.user_name}</span>
                    <div className="text-sm text-indigo-600">Likes: {player.likes}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteUser(player.id)}
                    className="btn btn-danger p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Questions</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleNextQuestion}
                  className="btn btn-secondary px-4 py-2 flex items-center gap-2"
                  disabled={questions.length === 0}
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>Next</span>
                </button>
                <button 
                  onClick={shuffleQuestions}
                  className="btn btn-secondary px-4 py-2 flex items-center gap-2"
                >
                  <Shuffle className="w-4 h-4" />
                  <span>Shuffle</span>
                </button>
              </div>
            </div>

            {questions.length === 0 ? (
              <p className="text-gray-600 text-center py-4">No questions found for this room.</p>
            ) : (
              <div className="space-y-3">
                {questions.map((q) => (
                  <div
                    key={q.id}
                    onClick={() => handleShowQuestion(questions.indexOf(q))}
                    className={`glass-card p-3 cursor-pointer hover:ring-2 hover:ring-indigo-300 transition-all ${
                      q.content === currentQuestion ? 'ring-2 ring-indigo-500' : ''
                    } ${!q.show ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleQuestionSelection(q.id);
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          selectedQuestions.includes(q.id)
                            ? 'bg-indigo-100 text-indigo-600'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <p className="flex-1">{q.content}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleQuestionVisibility(q.id);
                          }}
                          className={`btn ${q.show ? 'btn-secondary' : 'btn-primary'} px-4 py-2 flex items-center gap-2`}
                        >
                          {q.show ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          <span>{q.show ? 'Hide' : 'Show'}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteQuestion(q.id);
                          }}
                          className="btn btn-danger px-4 py-2 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerRoom;