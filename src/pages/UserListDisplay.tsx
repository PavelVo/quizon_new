// UserListDisplay.js
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useParams } from 'react-router-dom';

const UserListDisplay = () => {
  const { roomId } = useParams(); // Получение roomId из параметров
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('players')
          .select('id, user_name, likes, user_token') // Настройте необходимые столбцы
          .eq('room_id', roomId);

        if (error) throw error;
        setUsers(data);
      } catch (error) {
        // console.error('Error fetching users:', error);
      }
    };

    fetchUsers();

    // Подписка на изменения (добавление, обновление, удаление) в таблице players для текущей комнаты
    const subscription = supabase
      .channel('user_token_channel') // Название канала
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Обработка добавления нового пользователя
            setUsers((prevUsers) => [...prevUsers, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            // Обработка обновления пользователя
            setUsers((prevUsers) => 
              prevUsers.map((user) => 
                user.id === payload.new.id ? payload.new : user
              )
            );
          } else if (payload.eventType === 'DELETE') {
            // Обработка удаления пользователя
            setUsers((prevUsers) => 
              prevUsers.filter((user) => user.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    // Очистка подписки при размонтировании компонента
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [roomId]);

  // console.log(users);

  return users; 
};

export default UserListDisplay;
