-- ESQUEMA DE BASE DE DATOS PARA REBAJAYA (SUPABASE)
-- Puedes copiar y pegar este script en el SQL Editor de tu proyecto en Supabase

-- 1. Tabla de Perfiles de Usuario
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '🏃',
  pin TEXT NOT NULL,
  age INTEGER,
  height_cm NUMERIC,
  initial_weight_kg NUMERIC NOT NULL DEFAULT 80.0,
  current_weight_kg NUMERIC NOT NULL DEFAULT 80.0,
  target_weight_kg NUMERIC NOT NULL DEFAULT 70.0,
  daily_water_target_ml INTEGER NOT NULL DEFAULT 2000,
  is_main_user BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Planes de Alimentación
CREATE TABLE IF NOT EXISTS public.meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'manual', -- 'pdf', 'ai_interview', 'manual'
  title TEXT NOT NULL,
  summary TEXT,
  daily_calories_estimate INTEGER,
  meals JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Registro Diario de Comidas
CREATE TABLE IF NOT EXISTS public.meal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  meal_id TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, meal_id, date)
);

-- 4. Tabla de Registro de Hidratación
CREATE TABLE IF NOT EXISTS public.water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_ml INTEGER NOT NULL DEFAULT 250,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla de Registro de Peso
CREATE TABLE IF NOT EXISTS public.weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  weight_kg NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabla de Apoyo y Reacciones Familiares
CREATE TABLE IF NOT EXISTS public.family_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_name TEXT NOT NULL,
  sender_avatar TEXT NOT NULL DEFAULT '❤️',
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'aplauso', 'corazon', 'fuerza', 'felicitacion'
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security) permitiendo acceso público para esta app familiar
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_reactions ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura y escritura libre para anon/service
CREATE POLICY "Permitir todo a usuarios autenticados o anon" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en planes" ON public.meal_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en registros comidas" ON public.meal_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en registros agua" ON public.water_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en registros peso" ON public.weight_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en reacciones familiares" ON public.family_reactions FOR ALL USING (true) WITH CHECK (true);
