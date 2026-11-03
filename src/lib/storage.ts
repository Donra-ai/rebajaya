import { UserProfile, MealPlan, WaterLog, WeightLog, FamilyReaction, MealItem } from '@/types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const PROFILES_KEY = 'rebajaya_profiles';
const ACTIVE_PROFILE_KEY = 'rebajaya_active_profile_id';
const MEAL_PLANS_KEY = 'rebajaya_meal_plans';
const MEAL_LOGS_KEY = 'rebajaya_meal_logs';
const WATER_LOGS_KEY = 'rebajaya_water_logs';
const WEIGHT_LOGS_KEY = 'rebajaya_weight_logs';
const REACTIONS_KEY = 'rebajaya_reactions';

const DEFAULT_PAPA_ID = 'profile-papa-1';

const DEFAULT_PAPA_PROFILE: UserProfile = {
  id: DEFAULT_PAPA_ID,
  name: 'Papá',
  avatar: '👨‍🦳',
  pin: '1234',
  age: 62,
  heightCm: 172,
  initialWeightKg: 88.5,
  currentWeightKg: 86.2,
  targetWeightKg: 78.0,
  dailyWaterTargetMl: 2000,
  isMainUser: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const DEFAULT_PAPA_PLAN: MealPlan = {
  id: 'plan-papa-1',
  profileId: DEFAULT_PAPA_ID,
  source: 'pdf',
  title: 'Plan Nutricional Reductivo (Nutricionista)',
  summary: 'Plan bajo en azúcares refinados y alto en fibra para salud cardiovascular y pérdida progresiva de peso.',
  dailyCaloriesEstimate: 1800,
  updatedAt: '2026-01-01T00:00:00.000Z',
  meals: [
    {
      id: 'm1',
      name: 'Desayuno Saludable',
      time: '08:00',
      type: 'desayuno',
      description: '2 huevos revueltos con espinacas + 1 rebanada de pan integral tostado + Café o té verde sin azúcar.',
      tips: 'Tomar 1 vaso de agua antes de desayunar.',
    },
    {
      id: 'm2',
      name: 'Colación de Media Mañana',
      time: '11:00',
      type: 'media_manana',
      description: '1 manzana verde o puñado de almendras (8-10 unidades).',
      tips: 'Excelente para mantener la energía estable.',
    },
    {
      id: 'm3',
      name: 'Almuerzo Equilibrado',
      time: '13:30',
      type: 'almuerzo',
      description: 'Pechuga de pollo a la plancha (150g) + abundante ensalada verde con aceite de oliva y limón + 1/2 taza de arroz integral o quinoa.',
      tips: 'Masticar despacio y descansar entre bocados.',
    },
    {
      id: 'm4',
      name: 'Merienda de la Tarde',
      time: '17:00',
      type: 'merienda',
      description: 'Yogurt griego natural sin azúcar + 1 cucharadita de semillas de chía o rodajas de pepino con limón.',
      tips: 'Acompañar con un vaso grande de agua fresca.',
    },
    {
      id: 'm5',
      name: 'Cena Ligera',
      time: '20:00',
      type: 'cena',
      description: 'Sopa de verduras con trocitos de pescado blanco o ensalada de atún al agua con tomate y aguacate.',
      tips: 'Cenar al menos 2 horas antes de dormir para mejorar la digestión.',
    },
  ],
};

function getLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Error saving to localStorage', err);
  }
}

// ---------------- PROFILES ----------------
export async function getProfiles(): Promise<UserProfile[]> {
  const local = getLocal<UserProfile[]>(PROFILES_KEY, [DEFAULT_PAPA_PROFILE]);
  if (!local.length) {
    local.push(DEFAULT_PAPA_PROFILE);
    setLocal(PROFILES_KEY, local);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (!error && data && data.length > 0) {
        const mapped: UserProfile[] = data.map((d) => ({
          id: d.id,
          name: d.name,
          avatar: d.avatar,
          pin: d.pin,
          age: d.age,
          heightCm: d.height_cm,
          initialWeightKg: Number(d.initial_weight_kg),
          currentWeightKg: Number(d.current_weight_kg),
          targetWeightKg: Number(d.target_weight_kg),
          dailyWaterTargetMl: Number(d.daily_water_target_ml),
          isMainUser: d.is_main_user,
          createdAt: d.created_at,
        }));
        setLocal(PROFILES_KEY, mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase profile fetch error, fallback to local', e);
    }
  }

  return local;
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  const current = await getProfiles();
  const idx = current.findIndex((p) => p.id === profile.id);
  if (idx >= 0) {
    current[idx] = profile;
  } else {
    current.push(profile);
  }
  setLocal(PROFILES_KEY, current);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('profiles').upsert({
        id: profile.id,
        name: profile.name,
        avatar: profile.avatar,
        pin: profile.pin,
        age: profile.age,
        height_cm: profile.heightCm,
        initial_weight_kg: profile.initialWeightKg,
        current_weight_kg: profile.currentWeightKg,
        target_weight_kg: profile.targetWeightKg,
        daily_water_target_ml: profile.dailyWaterTargetMl,
        is_main_user: profile.isMainUser || false,
      });
    } catch (err) {
      console.warn('Supabase upsert error', err);
    }
  }
}

export function getActiveProfileId(): string {
  return getLocal<string>(ACTIVE_PROFILE_KEY, DEFAULT_PAPA_ID);
}

export function setActiveProfileId(id: string): void {
  setLocal(ACTIVE_PROFILE_KEY, id);
}

// ---------------- MEAL PLANS ----------------
export async function getMealPlan(profileId: string): Promise<MealPlan> {
  const plans = getLocal<Record<string, MealPlan>>(MEAL_PLANS_KEY, {
    [DEFAULT_PAPA_ID]: DEFAULT_PAPA_PLAN,
  });

  if (!plans[profileId]) {
    // Si no tiene plan, retornar una plantilla base o el predeterminado
    const newPlan: MealPlan = {
      ...DEFAULT_PAPA_PLAN,
      id: `plan-${profileId}`,
      profileId,
      title: 'Plan Personalizado',
    };
    plans[profileId] = newPlan;
    setLocal(MEAL_PLANS_KEY, plans);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('profile_id', profileId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        const remotePlan: MealPlan = {
          id: data.id,
          profileId: data.profile_id,
          source: data.source,
          title: data.title,
          summary: data.summary,
          dailyCaloriesEstimate: data.daily_calories_estimate,
          meals: data.meals as MealItem[],
          updatedAt: data.updated_at,
        };
        plans[profileId] = remotePlan;
        setLocal(MEAL_PLANS_KEY, plans);
        return remotePlan;
      }
    } catch (e) {
      console.warn('Supabase meal_plan fetch error', e);
    }
  }

  return plans[profileId];
}

export async function saveMealPlan(plan: MealPlan): Promise<void> {
  const plans = getLocal<Record<string, MealPlan>>(MEAL_PLANS_KEY, {});
  plans[plan.profileId] = plan;
  setLocal(MEAL_PLANS_KEY, plans);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('meal_plans').upsert({
        id: plan.id,
        profile_id: plan.profileId,
        source: plan.source,
        title: plan.title,
        summary: plan.summary,
        daily_calories_estimate: plan.dailyCaloriesEstimate,
        meals: plan.meals,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Supabase saveMealPlan error', err);
    }
  }
}

// ---------------- MEAL DAILY LOGS ----------------
export function getCompletedMealsToday(profileId: string, date: string): string[] {
  const all = getLocal<Record<string, string[]>>(MEAL_LOGS_KEY, {});
  const key = `${profileId}_${date}`;
  return all[key] || [];
}

export async function toggleMealCompleted(profileId: string, mealId: string, date: string): Promise<boolean> {
  const all = getLocal<Record<string, string[]>>(MEAL_LOGS_KEY, {});
  const key = `${profileId}_${date}`;
  const list = all[key] || [];
  const idx = list.indexOf(mealId);
  let isNowCompleted = false;

  if (idx >= 0) {
    list.splice(idx, 1);
    isNowCompleted = false;
  } else {
    list.push(mealId);
    isNowCompleted = true;
  }
  all[key] = list;
  setLocal(MEAL_LOGS_KEY, all);

  if (isSupabaseConfigured && supabase) {
    try {
      if (isNowCompleted) {
        await supabase.from('meal_logs').upsert({
          profile_id: profileId,
          meal_id: mealId,
          date,
        });
      } else {
        await supabase.from('meal_logs').delete().match({
          profile_id: profileId,
          meal_id: mealId,
          date,
        });
      }
    } catch (err) {
      console.warn('Supabase toggleMealCompleted error', err);
    }
  }

  return isNowCompleted;
}

// ---------------- WATER LOGS ----------------
export function getWaterToday(profileId: string, date: string): number {
  const logs = getLocal<WaterLog[]>(WATER_LOGS_KEY, []);
  return logs
    .filter((l) => l.profileId === profileId && l.date === date)
    .reduce((sum, item) => sum + item.amountMl, 0);
}

export async function addWater(profileId: string, amountMl: number, date: string): Promise<number> {
  const logs = getLocal<WaterLog[]>(WATER_LOGS_KEY, []);
  const newLog: WaterLog = {
    id: `water-${Date.now()}`,
    profileId,
    date,
    amountMl,
    timestamp: new Date().toISOString(),
  };
  logs.push(newLog);
  setLocal(WATER_LOGS_KEY, logs);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('water_logs').insert({
        profile_id: profileId,
        date,
        amount_ml: amountMl,
      });
    } catch (err) {
      console.warn('Supabase addWater error', err);
    }
  }

  return getWaterToday(profileId, date);
}

export function resetWaterToday(profileId: string, date: string): void {
  const logs = getLocal<WaterLog[]>(WATER_LOGS_KEY, []);
  const filtered = logs.filter((l) => !(l.profileId === profileId && l.date === date));
  setLocal(WATER_LOGS_KEY, filtered);
}

// ---------------- WEIGHT LOGS ----------------
export async function getWeightHistory(profileId: string): Promise<WeightLog[]> {
  const logs = getLocal<WeightLog[]>(WEIGHT_LOGS_KEY, []);
  const userLogs = logs.filter((l) => l.profileId === profileId);

  if (userLogs.length === 0) {
    // Inicializar con dos registros de muestra para que se aprecie la tendencia
    const initialLogs: WeightLog[] = [
      {
        id: 'w-1',
        profileId,
        weightKg: 88.5,
        date: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
        notes: 'Inicio del plan',
        timestamp: new Date(Date.now() - 14 * 86400000).toISOString(),
      },
      {
        id: 'w-2',
        profileId,
        weightKg: 86.2,
        date: new Date().toISOString().split('T')[0],
        notes: '¡Bajando con constancia!',
        timestamp: new Date().toISOString(),
      },
    ];
    setLocal(WEIGHT_LOGS_KEY, [...logs, ...initialLogs]);
    return initialLogs;
  }

  return userLogs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function addWeight(profileId: string, weightKg: number, notes?: string): Promise<void> {
  const logs = getLocal<WeightLog[]>(WEIGHT_LOGS_KEY, []);
  const dateStr = new Date().toISOString().split('T')[0];
  const newLog: WeightLog = {
    id: `weight-${Date.now()}`,
    profileId,
    weightKg,
    date: dateStr,
    notes,
    timestamp: new Date().toISOString(),
  };
  logs.push(newLog);
  setLocal(WEIGHT_LOGS_KEY, logs);

  // Actualizar también el perfil activo
  const profiles = await getProfiles();
  const targetProfile = profiles.find((p) => p.id === profileId);
  if (targetProfile) {
    targetProfile.currentWeightKg = weightKg;
    await saveProfile(targetProfile);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('weight_logs').insert({
        profile_id: profileId,
        weight_kg: weightKg,
        date: dateStr,
        notes,
      });
      await supabase.from('profiles').update({ current_weight_kg: weightKg }).eq('id', profileId);
    } catch (err) {
      console.warn('Supabase addWeight error', err);
    }
  }
}

// ---------------- FAMILY HUB & REACTIONS ----------------
export function getReactions(): FamilyReaction[] {
  const local = getLocal<FamilyReaction[]>(REACTIONS_KEY, [
    {
      id: 'r1',
      senderName: 'Hijo',
      senderAvatar: '💪',
      receiverId: DEFAULT_PAPA_ID,
      type: 'aplauso',
      message: '¡Excelente papá, sigue así con el agua!',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'r2',
      senderName: 'María',
      senderAvatar: '🌸',
      receiverId: DEFAULT_PAPA_ID,
      type: 'corazon',
      message: '¡Qué buen almuerzo preparaste!',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    },
  ]);
  return local;
}

export async function addReaction(reaction: Omit<FamilyReaction, 'id' | 'timestamp'>): Promise<void> {
  const reactions = getReactions();
  const newReaction: FamilyReaction = {
    ...reaction,
    id: `react-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  reactions.unshift(newReaction);
  setLocal(REACTIONS_KEY, reactions.slice(0, 50));

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('family_reactions').insert({
        sender_name: reaction.senderName,
        sender_avatar: reaction.senderAvatar,
        receiver_id: reaction.receiverId,
        type: reaction.type,
        message: reaction.message,
      });
    } catch (err) {
      console.warn('Supabase addReaction error', err);
    }
  }
}
