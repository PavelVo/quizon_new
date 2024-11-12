// CurrentQuestionDisplay.js
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const CurrentQuestionDisplay = ({ roomId }) => {
  const [currentQuestion, setCurrentQuestion] = useState('');

  useEffect(() => {
    const fetchCurrentQuestion = async () => {
      try {
        const { data, error } = await supabase
          .from('current_question') // Убедитесь, что это правильное имя таблицы
          .select('content')
          .eq('room_id', roomId) // Убедитесь, что roomId передан правильно
          .single();

        if (error) throw error;
        setCurrentQuestion(data.content); // Предполагаем, что столбец называется 'content'
      } catch (error) {
        // console.error('Error fetching current question:', error);
      }
    };

    fetchCurrentQuestion();

    // Подписка на изменения в таблице current_questions
    const subscription = supabase
      .channel('current_questions_channel') // Название канала, может быть любым
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'current_question',
          filter: `room_id=eq.${roomId}`, // Фильтр для конкретной комнаты
        },
        (payload) => {
          setCurrentQuestion(payload.new.content); // Предполагаем, что новое содержимое находится в 'content'
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe(); // Используйте unsubscribe для отписки
    };
  }, [roomId]);

  return (
    <div className="bg-yellow-100 p-4 rounded-lg mt-2">
      {currentQuestion  || 'Нет текущего вопроса'}
    </div>
  );
};

export default CurrentQuestionDisplay;
