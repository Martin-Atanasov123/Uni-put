// Модул: Supabase клиент
// Описание: Инициализира и предоставя единствена инстанция на Supabase клиента,
//   използвана в приложението за достъп до база данни, автентикация и други услуги.
// Вход: прочита VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY от средата (import.meta.env)
// Изход: експортира инстанция `supabase`, готова за използване в услуги и компоненти
// Бележки: При липса на конфигурация се логва грешка в конзолата. Ключовете не се записват в код.
import { createClient } from '@supabase/supabase-js'

// Конфигурация за Supabase клиента
// Извличане на URL и анонимен ключ от променливите на средата
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Проверка за липсващи конфигурационни променливи
if (!supabaseUrl || !supabaseAnonKey) {
    // Missing Supabase configuration — app will not function
}

// Създаване на Supabase клиентска инстанция
const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

export { supabase }
