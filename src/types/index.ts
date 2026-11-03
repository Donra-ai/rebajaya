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
  isMainUser?: boolean; // ej: Papá como usuario destacado
  createdAt: string;
}

export interface MealItem {
  id: string;
  name: string; // ej: "Desayuno Nutritivo"
  time: string; // ej: "08:30"
  type: 'desayuno' | 'media_manana' | 'almuerzo' | 'merienda' | 'cena' | 'otro';
  description: string; // alimentos, ingredientes, porciones
  tips?: string; // consejos adicionales
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
