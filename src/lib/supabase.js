import { createClient } from '@supabase/supabase-js'

// Конфигурация за Supabase клиента
// Извличане на URL и анонимен ключ от променливите на средата
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Проверка за липсващи конфигурационни променливи
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Липсва Supabase URL или ключ! Проверете .env файла.');
}

// Създаване на Supabase клиентска инстанция
const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

export { supabase }
