// PlayerTracker.js
import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient'; // Путь к вашему Supabase клиенту
import { useUser } from '@clerk/clerk-react';

// Функция для генерации уникального токена
const generateUniqueId = (userToken, roomId) => {
  const rawId = `${userToken}-${roomId}`;
  // Кодируем в base64 и обрезаем до 15 символов
  return btoa(rawId).substring(0, 15);
};

const PlayerTracker = ({ roomId }) => {
  const { user } = useUser();

  useEffect(() => {
    const checkAndInsertPlayer = async () => {
      if (!user || !roomId) return;

      const userToken = user.id;
      const playerId = generateUniqueId(userToken, roomId); // Генерация уникального id
      const userName = user.firstName || user.username || user.fullName || 'Unknown'; // Получаем имя пользователя

      // Проверяем наличие записи в таблице players
      const { data: existingPlayer, error: selectError } = await supabase
        .from('players')
        .select('id')
        .eq('id', playerId)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        // console.error('Ошибка при проверке записи:', selectError.message);
        return;
      }

      if (!existingPlayer) {
        const { error: insertError } = await supabase
          .from('players')
          .insert([
            {
              id: playerId,
              user_token: userToken,
              room_id: roomId,
              likes: 0,
              user_name: userName // Добавляем имя пользователя в запись
            }
          ]);

        if (insertError) {
          // console.error('Ошибка при добавлении записи:', insertError.message);
        } else {
          // console.log('Запись успешно добавлена:', playerId);
        }
      } else {
        // console.log('Запись уже существует:', playerId);
      }
    };

    checkAndInsertPlayer();
  }, [user, roomId]);

  return null; // Этот компонент ничего не рендерит
};

export default PlayerTracker;
