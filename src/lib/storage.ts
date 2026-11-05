import { UserProfile, MealPlan, WaterLog, WeightLog, FamilyReaction, MealItem, HealthBadge } from '@/types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const PROFILES_KEY = 'rebajaya_profiles';
const ACTIVE_PROFILE_KEY = 'rebajaya_active_profile_id';
const MEAL_PLANS_KEY = 'rebajaya_meal_plans';
const MEAL_LOGS_KEY = 'rebajaya_meal_logs';
const WATER_LOGS_KEY = 'rebajaya_water_logs';
const WEIGHT_LOGS_KEY = 'rebajaya_weight_logs';
const REACTIONS_KEY = 'rebajaya_reactions';

export function getWeeklyDefaultMeals(profileId: string): Record<string, MealItem[]> {
  return {
    lunes: [
      {
        id: `lun-1`,
        name: 'Huevos Revueltos con Espinacas',
        time: '08:00',
        type: 'desayuno',
        description: '2 huevos revueltos con espinacas y tomate + 1 rebanada de pan integral tostado + Café o infusión sin azúcar.',
        tips: '1 vaso de agua al despertar para activar la digestión.',
        alternatives: ['2 huevos = 1 lata de atún al natural', '1 rebanada pan = 40g avena en hojuelas'],
        dayOfWeek: 'lunes',
      },
      {
        id: `lun-2`,
        name: 'Manzana con Almendras',
        time: '11:00',
        type: 'media_manana',
        description: '1 manzana verde fresca + 8-10 almendras o nueces.',
        tips: 'Mantiene estable la glucosa en sangre.',
        alternatives: ['Manzana = 1 pera o kiwi', 'Almendras = 1 cda de mantequilla de maní'],
        dayOfWeek: 'lunes',
      },
      {
        id: `lun-3`,
        name: 'Pechuga a la Plancha con Quinoa',
        time: '13:30',
        type: 'almuerzo',
        description: 'Pechuga de pollo a la plancha (150g) + 1/2 taza de quinoa cocida + ensalada fresca de lechuga, pepino y aceite de oliva.',
        tips: 'Masticar despacio para favorecer la señal de saciedad.',
        alternatives: ['Pechuga = 150g pescado blanco o 1 taza de lentejas', 'Quinoa = 1 papa mediana cocida'],
        dayOfWeek: 'lunes',
      },
      {
        id: `lun-4`,
        name: 'Yogurt Griego con Chía',
        time: '17:00',
        type: 'merienda',
        description: 'Yogurt griego natural sin azúcar (150g) con 1 cucharadita de semillas de chía o rodajas de pepino con limón.',
        tips: 'Acompañar con un vaso grande de agua.',
        alternatives: ['Yogurt = 1 huevo duro o 1 vaso de leche vegetal con canela'],
        dayOfWeek: 'lunes',
      },
      {
        id: `lun-5`,
        name: 'Salteado Ligero de Verduras con Atún',
        time: '20:30',
        type: 'cena',
        description: '1 lata de atún al agua salteada con calabacín, cebolla, champiñones y un toque de orégano.',
        tips: 'Cenar 2 horas antes de dormir para un descanso profundo.',
        alternatives: ['Atún = 100g de pollo desmechado o 2 huevos poché'],
        dayOfWeek: 'lunes',
      },
    ],
    martes: [
      {
        id: `mar-1`,
        name: 'Bowl de Avena con Frutas y Canela',
        time: '08:00',
        type: 'desayuno',
        description: '1/2 taza de avena cocida en agua o leche descremada con canela + 1/2 plátano en rodajas y 1 cucharada de semillas de lino o chía.',
        tips: 'Excelente fuente de fibra soluble para la salud cardiovascular.',
        alternatives: ['Avena = 2 tostadas de maíz horneadas con aguacate'],
        dayOfWeek: 'martes',
      },
      {
        id: `mar-2`,
        name: 'Yogurt con Frutos Rojos',
        time: '11:00',
        type: 'media_manana',
        description: '1 taza de yogurt natural con un puñado de fresas o moras.',
        tips: 'Aporte de antioxidantes y probióticos.',
        alternatives: ['Fresas = 1 naranja o mandarina'],
        dayOfWeek: 'martes',
      },
      {
        id: `mar-3`,
        name: 'Pescado Blanco al Limón con Batata',
        time: '13:30',
        type: 'almuerzo',
        description: 'Filete de pescado blanco al sartén con ajo y perejil + 1 batata pequeña al horno + ensalada de espinaca y tomate.',
        tips: 'Proteína ligera de altísima biodisponibilidad y fácil digestión.',
        alternatives: ['Pescado = 150g de pechuga de pavo o pollo', 'Batata = 1/2 taza de arroz integral'],
        dayOfWeek: 'martes',
      },
      {
        id: `mar-4`,
        name: 'Bastones de Pepino y Zanahoria con Hummus',
        time: '17:00',
        type: 'merienda',
        description: 'Bastoncitos de pepino y zanahoria crujientes + 2 cucharadas de hummus de garbanzo o guacamole casero.',
        tips: 'Sacia el impulso de masticar cosas crujientes sin calorías vacías.',
        alternatives: ['Hummus = 1 porción pequeña de queso bajo en grasa'],
        dayOfWeek: 'martes',
      },
      {
        id: `mar-5`,
        name: 'Tortilla de Champiñones y Ensalada Verde',
        time: '20:30',
        type: 'cena',
        description: 'Tortilla de 2 huevos con champiñones salteados + abundante ensalada de rúcula y tomate cherry.',
        tips: 'Bajo en carbohidratos para facilitar la quema nocturna de grasa.',
        alternatives: ['Champiñones = espárragos o calabacín rallado'],
        dayOfWeek: 'martes',
      },
    ],
    miercoles: [
      {
        id: `mie-1`,
        name: 'Tostadas Integrales con Aguacate y Huevo',
        time: '08:00',
        type: 'desayuno',
        description: '1 rebanada de pan 100% integral con 1/4 de aguacate machacado + 1 huevo cocido o poché encima + Café solo o té verde.',
        tips: 'Grasas saludables y proteína de oro para el cerebro.',
        alternatives: ['Pan integral = arepa de maíz delgada o tortilla de maíz'],
        dayOfWeek: 'miercoles',
      },
      {
        id: `mie-2`,
        name: 'Fruta de Temporada con Semillas',
        time: '11:00',
        type: 'media_manana',
        description: '1 rodaja gruesa de papaya o melón + 1 cucharada de semillas de girasol o calabaza.',
        tips: 'Enzimas digestivas naturales para una panza ligera.',
        alternatives: ['Papaya = 1 manzana o pera'],
        dayOfWeek: 'miercoles',
      },
      {
        id: `mie-3`,
        name: 'Guiso Casero de Lentejas con Verduras',
        time: '13:30',
        type: 'almuerzo',
        description: '1 plato de lentejas guisadas con zanahoria, pimiento, tomate y calabaza + ensalada fresca con vinagre de manzana.',
        tips: 'Rico en hierro y fibra que nutre a tu microbiota intestinal.',
        alternatives: ['Lentejas = garbanzos o frijoles negros'],
        dayOfWeek: 'miercoles',
      },
      {
        id: `mie-4`,
        name: 'Huevo Cocido con Especias',
        time: '17:00',
        type: 'merienda',
        description: '1 huevo duro sazonado con pizca de pimentón dulce y sal marina + 1 vaso grande de agua con rodaja de limón.',
        tips: 'Súper saciante para llegar a la cena sin desesperación.',
        alternatives: ['1 huevo = 1 puñado pequeño de frutos secos'],
        dayOfWeek: 'miercoles',
      },
      {
        id: `mie-5`,
        name: 'Crema Casera de Calabaza con Pollo',
        time: '20:30',
        type: 'cena',
        description: 'Tazón de crema de calabaza natural con trocitos de pechuga cocida desmenuzada (100g).',
        tips: 'Comida reconfortante y tibia que promueve la melatonina.',
        alternatives: ['Pollo = huevo pochado dentro de la crema'],
        dayOfWeek: 'miercoles',
      },
    ],
    jueves: [
      {
        id: `jue-1`,
        name: 'Omelette Francés de Hierbas y Tomate',
        time: '08:00',
        type: 'desayuno',
        description: '2 huevos batidos con orégano, albahaca y cubitos de tomate fresco + 1 fruta entera.',
        tips: 'Sin harinas refinadas para máxima claridad mental matutina.',
        alternatives: ['Huevos = 150g de queso fresco o tofu revuelto con cúrcuma'],
        dayOfWeek: 'jueves',
      },
      {
        id: `jue-2`,
        name: 'Frutos Secos y Té Verde',
        time: '11:00',
        type: 'media_manana',
        description: 'Puñado pequeño de nueces o almendras (25g) + 1 taza de té verde o infusión caliente.',
        tips: 'El té verde acelera la termogénesis de forma natural.',
        alternatives: ['Nueces = pistachos o cacahuates naturales sin sal'],
        dayOfWeek: 'jueves',
      },
      {
        id: `jue-3`,
        name: 'Fajitas de Pollo y Pimientos Asados',
        time: '13:30',
        type: 'almuerzo',
        description: 'Tiras de pollo salteadas con pimientos rojos y verdes y cebolla + 1 tortilla integral o 1/2 taza de arroz + 2 cucharadas de guacamole.',
        tips: 'Color y vitaminas antioxidantes en cada bocado.',
        alternatives: ['Pollo = carne magra picada o tiras de tofu'],
        dayOfWeek: 'jueves',
      },
      {
        id: `jue-4`,
        name: 'Yogurt Natural con Semillas de Girasol',
        time: '17:00',
        type: 'merienda',
        description: '1 vaso de yogurt natural entero o descremado + 1 cucharadita de semillas de girasol.',
        tips: 'Minerales clave para evitar calambres y fatiga.',
        alternatives: ['Yogurt = 1 rebanada de queso con rodaja de tomate'],
        dayOfWeek: 'jueves',
      },
      {
        id: `jue-5`,
        name: 'Ensalada Marina de Atún y Aguacate',
        time: '20:30',
        type: 'cena',
        description: '1 lata de atún al agua sobre cama de lechuga variada, pepino, tomate y 1/4 de aguacate con vinagreta de limón.',
        tips: 'Cena rápida sin prender la estufa, rica en omega 3 antiinflamatorio.',
        alternatives: ['Atún = sardinas en aceite de oliva o 2 huevos duros'],
        dayOfWeek: 'jueves',
      },
    ],
    viernes: [
      {
        id: `vie-1`,
        name: 'Panqueques Proteicos de Avena y Plátano',
        time: '08:00',
        type: 'desayuno',
        description: 'Mezcla de 1 huevo + 1/2 plátano maduro machacado + 3 cucharadas de avena molida a la sartén con canela.',
        tips: 'Dulzor natural sin añadir ni un gramo de azúcar.',
        alternatives: ['Panqueques = tazón de avena tradicional cocida'],
        dayOfWeek: 'viernes',
      },
      {
        id: `vie-2`,
        name: 'Rodajas de Manzana con Canela',
        time: '11:00',
        type: 'media_manana',
        description: '1 manzana cortada en rodajas finas espolvoreada con canela en polvo.',
        tips: 'La canela mejora la sensibilidad celular a la insulina.',
        alternatives: ['Manzana = 1 pera o naranja'],
        dayOfWeek: 'viernes',
      },
      {
        id: `vie-3`,
        name: 'Carne Magra Salteada con Brócoli y Arroz',
        time: '13:30',
        type: 'almuerzo',
        description: 'Tiras de carne de res magra (140g) salteadas con abundante brócoli y ajo + 1/2 taza de arroz integral o papa cocida.',
        tips: 'Aporte de zinc y hierro hemo para mantener tus defensas altas.',
        alternatives: ['Carne magra = pechuga de pollo o lomo de cerdo sin grasa'],
        dayOfWeek: 'viernes',
      },
      {
        id: `vie-4`,
        name: 'Zanahorias Baby con Limón y Sal Marina',
        time: '17:00',
        type: 'merienda',
        description: 'Zanahorias crujientes con zumo de limón fresco y una pizca de sal marina.',
        tips: 'Bajo en calorías y alto en betacarotenos.',
        alternatives: ['Zanahoria = bastones de apio o pepino'],
        dayOfWeek: 'viernes',
      },
      {
        id: `vie-5`,
        name: 'Pescado Blanco en Papillote con Verduras',
        time: '20:30',
        type: 'cena',
        description: 'Filete de pescado cocinado al vapor o sartén tapada con calabacín en rodajas, tomate y finas hierbas.',
        tips: 'Máxima ligereza para amanecer el sábado sin retención de líquidos.',
        alternatives: ['Pescado = pechuga a la plancha con orégano'],
        dayOfWeek: 'viernes',
      },
    ],
    sabado: [
      {
        id: `sab-1`,
        name: 'Desayuno Campestre Saludable',
        time: '08:30',
        type: 'desayuno',
        description: '2 huevos al gusto + 1 arepa de maíz o tortilla pequeña + 1 porción de queso fresco bajo en sal + Café con leche descremada o vegetal.',
        tips: 'Fin de semana con energía sin salirte de tus metas.',
        alternatives: ['Arepa = 1 rebanada de pan integral de masa madre'],
        dayOfWeek: 'sabado',
      },
      {
        id: `sab-2`,
        name: 'Fruta Fresca Hidratante',
        time: '11:30',
        type: 'media_manana',
        description: '1 taza de sandía, melón o piña en cubos frescos.',
        tips: 'Hidratación extra y electrolitos naturales.',
        alternatives: ['Sandía = 1 manzana o ciruelas'],
        dayOfWeek: 'sabado',
      },
      {
        id: `sab-3`,
        name: 'Hamburguesa Casera Saludable',
        time: '14:00',
        type: 'almuerzo',
        description: 'Medallón de carne 100% magra casera a la plancha + pan integral + lechuga, tomate y ensalada verde de guarnición.',
        tips: 'Versión fit deliciosa que calma cualquier antojo de fin de semana.',
        alternatives: ['Pan de hamburguesa = al plato con doble ensalada'],
        dayOfWeek: 'sabado',
      },
      {
        id: `sab-4`,
        name: 'Infusión Helada con Frutos Secos',
        time: '17:30',
        type: 'merienda',
        description: 'Vaso grande de té helado sin azúcar con limón y menta + 8 nueces.',
        tips: 'Refrescante y anti-ansiedad para la tarde de fin de semana.',
        alternatives: ['Nueces = 10 almendras'],
        dayOfWeek: 'sabado',
      },
      {
        id: `sab-5`,
        name: 'Salteado de Verduras con Queso',
        time: '21:00',
        type: 'cena',
        description: 'Salteado de verduras multicolor servido con queso fresco bajo en grasa o tiras de pollo.',
        tips: 'Cena digestiva para compensar un almuerzo más sustancioso.',
        alternatives: ['Queso = atún enlatado al natural'],
        dayOfWeek: 'sabado',
      },
    ],
    domingo: [
      {
        id: `dom-1`,
        name: 'Tostadas Francesas Fit con Canela',
        time: '09:00',
        type: 'desayuno',
        description: '1 rebanada de pan integral remojada en 1 huevo batido con canela y vainilla, dorada a la sartén + fruta fresca.',
        tips: 'Desayuno festivo en familia, delicioso y lleno de nutrientes.',
        alternatives: ['Pan = 2 huevos revueltos con tostadas clásicas'],
        dayOfWeek: 'domingo',
      },
      {
        id: `dom-2`,
        name: 'Colación Ligera',
        time: '11:45',
        type: 'media_manana',
        description: '1 puñado pequeño de almendras o 1 vaso de agua fresca con infusión.',
        tips: 'Para no llegar con hambre voraz al almuerzo dominguero.',
        alternatives: ['Almendras = 1 fruta fresca'],
        dayOfWeek: 'domingo',
      },
      {
        id: `dom-3`,
        name: 'Pollo Asado con Papas al Horno y Ensalada',
        time: '14:00',
        type: 'almuerzo',
        description: 'Cuarto de pollo asado (sin piel) + 1 papa asada al horno con romero y aceite de oliva + abundante ensalada mixta.',
        tips: 'Plato clásico de domingo adaptado para perder grasa sin sentirte a dieta.',
        alternatives: ['Pollo asado = pescado a la plancha o ternera'],
        dayOfWeek: 'domingo',
      },
      {
        id: `dom-4`,
        name: 'Yogurt Griego con Rodajas de Fresa',
        time: '17:30',
        type: 'merienda',
        description: 'Yogurt griego con fresas picadas y semillas de chía.',
        tips: 'Prepara tu cuerpo para una semana exitosa.',
        alternatives: ['Fresas = kiwi o arándanos'],
        dayOfWeek: 'domingo',
      },
      {
        id: `dom-5`,
        name: 'Sopa Ligera Reparadora de Domingo',
        time: '20:30',
        type: 'cena',
        description: 'Caldo de verduras casero con pechuga desmenuzada y espinacas tiernas.',
        tips: 'Desintoxica y desinflama tu cuerpo para arrancar el lunes al 100%.',
        alternatives: ['Caldo = ensalada ligera con huevo cocido'],
        dayOfWeek: 'domingo',
      },
    ],
  };
}

export function createDefaultMealPlan(profileId: string, title = 'Plan Nutricional Clínico Semanal'): MealPlan {
  const weekly = getWeeklyDefaultMeals(profileId);
  return {
    id: `plan-${profileId}-${Date.now()}`,
    profileId,
    source: 'manual',
    title,
    summary: 'Plan clínico semanal con variedad diaria (Lunes a Domingo), alimentos reales y opciones de sustitución.',
    dailyCaloriesEstimate: 1800,
    updatedAt: new Date().toISOString(),
    weeklyMeals: weekly,
    meals: weekly.lunes,
  };
}

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

// ---------------- RESET TOTAL & COMIENZO LIMPIO ----------------
export const APP_DATA_RESET_KEY = 'rebajaya_fresh_start_2026_clean';

export async function clearAllAppData(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(PROFILES_KEY);
    localStorage.removeItem(ACTIVE_PROFILE_KEY);
    localStorage.removeItem(MEAL_PLANS_KEY);
    localStorage.removeItem(MEAL_LOGS_KEY);
    localStorage.removeItem(WATER_LOGS_KEY);
    localStorage.removeItem(WEIGHT_LOGS_KEY);
    localStorage.removeItem(REACTIONS_KEY);
    localStorage.removeItem('papa_profile');
    localStorage.removeItem('papa_meal_plan');
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('meal_logs').delete().neq('id', '0');
      await supabase.from('water_logs').delete().neq('id', '0');
      await supabase.from('weight_logs').delete().neq('id', '0');
      await supabase.from('meal_plans').delete().neq('id', '0');
      await supabase.from('profiles').delete().neq('id', '0');
      await supabase.from('family_reactions').delete().neq('id', '0');
    } catch (e) {
      console.warn('Supabase reset error', e);
    }
  }
}

export async function checkAndRunFreshStart(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const hasReset = localStorage.getItem(APP_DATA_RESET_KEY);
  if (!hasReset) {
    await clearAllAppData();
    localStorage.setItem(APP_DATA_RESET_KEY, 'done_v1');
    return true;
  }
  return false;
}

// ---------------- PROFILES ----------------
export async function getProfiles(): Promise<UserProfile[]> {
  const local = getLocal<UserProfile[]>(PROFILES_KEY, []);

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

export function getActiveProfileId(): string | null {
  return getLocal<string | null>(ACTIVE_PROFILE_KEY, null);
}

export function setActiveProfileId(id: string | null): void {
  if (id === null) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
    }
  } else {
    setLocal(ACTIVE_PROFILE_KEY, id);
  }
}

// ---------------- MEAL PLANS ----------------
export async function getMealPlan(profileId: string): Promise<MealPlan> {
  const plans = getLocal<Record<string, MealPlan>>(MEAL_PLANS_KEY, {});

  if (!plans[profileId]) {
    const newPlan = createDefaultMealPlan(profileId);
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
  return userLogs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function addWeight(
  profileId: string,
  weightKg: number,
  notes?: string,
  photoUrl?: string
): Promise<void> {
  const logs = getLocal<WeightLog[]>(WEIGHT_LOGS_KEY, []);
  const dateStr = new Date().toISOString().split('T')[0];
  const newLog: WeightLog = {
    id: `weight-${Date.now()}`,
    profileId,
    weightKg,
    date: dateStr,
    notes,
    photoUrl,
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
        photo_url: photoUrl,
      });
      await supabase.from('profiles').update({ current_weight_kg: weightKg }).eq('id', profileId);
    } catch (err) {
      console.warn('Supabase addWeight error', err);
    }
  }
}

// ---------------- COMMUNITY HUB & REACTIONS ----------------
export function getReactions(): FamilyReaction[] {
  return getLocal<FamilyReaction[]>(REACTIONS_KEY, []);
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

// ---------------- STREAKS & BADGES ----------------
export function getUserStreak(profileId: string): number {
  const waterLogs = getLocal<WaterLog[]>(WATER_LOGS_KEY, []).filter((l) => l.profileId === profileId);
  const weightLogs = getLocal<WeightLog[]>(WEIGHT_LOGS_KEY, []).filter((l) => l.profileId === profileId);
  const completedKeys = getLocal<Record<string, string[]>>(MEAL_LOGS_KEY, {});

  const activeDates = new Set<string>();
  waterLogs.forEach((w) => activeDates.add(w.date));
  weightLogs.forEach((w) => activeDates.add(w.date));

  // Fechas con comidas completadas
  Object.keys(completedKeys).forEach((key) => {
    if (key.startsWith(`${profileId}-`) && (completedKeys[key]?.length || 0) > 0) {
      const datePart = key.replace(`${profileId}-`, '');
      activeDates.add(datePart);
    }
  });

  const todayStr = new Date().toISOString().split('T')[0];
  let streak = 0;
  const checkDate = new Date();

  const todayActive = activeDates.has(todayStr);
  if (!todayActive) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dStr = checkDate.toISOString().split('T')[0];
    if (activeDates.has(dStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return Math.max(todayActive ? 1 : 0, streak);
}

export function getUserBadges(
  profile: UserProfile,
  waterToday: number,
  completedMealsCount: number,
  totalMealsToday: number,
  weightHistory: WeightLog[]
): HealthBadge[] {
  const hasWaterGoal = waterToday >= profile.dailyWaterTargetMl;
  const hasAllMeals = totalMealsToday > 0 && completedMealsCount >= totalMealsToday;
  const hasPhoto = weightHistory.some((w) => !!w.photoUrl);
  const hasLostWeight = profile.initialWeightKg - profile.currentWeightKg >= 1.0;
  const streak = getUserStreak(profile.id);

  return [
    {
      id: 'badge-first-step',
      title: 'Primer Paso Saludable',
      description: 'Registraste tu primer hábito en RebajaYA.',
      icon: '🌱',
      isUnlocked: waterToday > 0 || completedMealsCount > 0 || weightHistory.length > 0,
    },
    {
      id: 'badge-hydrated',
      title: 'Hidratación Cumplida',
      description: `Completaste tu meta clínica diaria de ${profile.dailyWaterTargetMl} ml.`,
      icon: '💧',
      isUnlocked: hasWaterGoal,
    },
    {
      id: 'badge-meals-done',
      title: 'Día Perfecto de Nutrición',
      description: 'Completaste el 100% de las comidas de tu día.',
      icon: '🥗',
      isUnlocked: hasAllMeals,
    },
    {
      id: 'badge-photo-valiant',
      title: 'Valiente en Fotos',
      description: 'Guardaste una foto de progreso físico para comparar tu antes y después.',
      icon: '📸',
      isUnlocked: hasPhoto,
    },
    {
      id: 'badge-streak-fire',
      title: 'Constancia Imparable',
      description: 'Alcanzaste 3 o más días consecutivos de constancia en tus hábitos.',
      icon: '🔥',
      isUnlocked: streak >= 3,
    },
    {
      id: 'badge-kilo-down',
      title: 'Primer Kilo Superado',
      description: 'Has bajado 1 kg o más de peso saludable desde tu inicio.',
      icon: '🏆',
      isUnlocked: hasLostWeight,
    },
  ];
}
