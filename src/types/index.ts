export interface HealthBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  unlockedAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  pin: string; // PIN de 4 dígitos
  age?: number;
  heightCm?: number;
  initialWeightKg: number;
  currentWeightKg: number;
  targetWeightKg: number;
  dailyWaterTargetMl: number;
  currentStreakDays?: number;
  lastActiveDate?: string;
  unlockedBadges?: string[];
  hasBariatricSurgery?: boolean; // Paciente con Cirugía Bariátrica (Manga / Bypass)
  isMainUser?: boolean; // Usuario principal o administrador
  createdAt: string;
}

export interface MealItem {
  id: string;
  name: string; // ej: "Desayuno Nutritivo"
  time: string; // ej: "08:30"
  type: 'desayuno' | 'media_manana' | 'almuerzo' | 'merienda' | 'cena' | 'otro';
  description: string; // alimentos, ingredientes, porciones
  tips?: string; // consejos adicionales
  alternatives?: string[]; // alimentos de reemplazo rápido equivalente
  dayOfWeek?: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
  completedToday?: boolean;
  completedAt?: string;
}

export interface MealPlan {
  id: string;
  profileId: string;
  source: 'pdf' | 'ai_interview' | 'manual';
  title: string;
  summary?: string;
  dailyCaloriesEstimate?: number;
  meals: MealItem[];
  weeklyMeals?: Record<string, MealItem[]>; // Plan organizado por días de la semana
  updatedAt: string;
}

export interface WaterLog {
  id: string;
  profileId: string;
  date: string; // YYYY-MM-DD
  amountMl: number;
  timestamp: string;
}

export interface WeightLog {
  id: string;
  profileId: string;
  weightKg: number;
  date: string; // YYYY-MM-DD
  notes?: string;
  photoUrl?: string; // Foto de progreso físico (base64 o URL)
  timestamp: string;
}

export interface FamilyReaction {
  id: string;
  senderName: string;
  senderAvatar: string;
  receiverId: string;
  type: 'aplauso' | 'corazon' | 'fuerza' | 'felicitacion';
  message?: string;
  timestamp: string;
}
