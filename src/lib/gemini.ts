import { GoogleGenAI } from '@google/genai';
import { MealItem, MealPlan } from '@/types';

const apiKey = process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

// Modelos en orden de preferencia con fallback automático y alta velocidad (<1s)
const CANDIDATE_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
];

async function callWithFallback(
  contents: any,
  systemInstruction?: string,
  maxOutputTokens: number = 1000
): Promise<string> {
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          ...(systemInstruction ? { systemInstruction } : {}),
          temperature: 0.3,
          maxOutputTokens,
        },
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`Model ${model} failed, trying next...`, err?.message || err);
      lastError = err;
    }
  }

  throw new Error(`Todos los modelos de Gemini fallaron: ${lastError?.message || 'Error desconocido'}`);
}

export async function parseDietPdf(base64Pdf: string, mimeType: string = 'application/pdf'): Promise<Partial<MealPlan>> {
  const prompt = `
Analiza este documento del nutricionista y extrae el plan de alimentación diario con sus horarios y comidas.
Debes responder ÚNICAMENTE con un objeto JSON válido (sin formato markdown adicional, sin comillas triples \`\`\`json).

Estructura JSON requerida:
{
  "title": "Nombre o resumen del plan (ej. Plan Nutricional de Pérdida de Peso)",
  "summary": "Breve explicación de las pautas del plan y recomendaciones clave (máx 2 párrafos)",
  "dailyCaloriesEstimate": 1800,
  "meals": [
    {
      "id": "m1",
      "name": "Nombre de la comida (ej. Desayuno, Almuerzo, Cena, Colación)",
      "time": "Horario sugerido en formato 24h (ej. 08:30, 13:30, 20:00)",
      "type": "desayuno | media_manana | almuerzo | merienda | cena | otro",
      "description": "Lista de alimentos, porciones e instrucciones claras",
      "tips": "Recomendación o advertencia (ej. Tomar agua, evitar salsas)"
    }
  ]
}
`;

  const contents = [
    {
      role: 'user',
      parts: [
        {
          inlineData: {
            mimeType,
            data: base64Pdf,
          },
        },
        { text: prompt },
      ],
    },
  ];

  const rawText = await callWithFallback(contents, 'Eres un médico nutricionista experto. Analizas planes de dieta y extraes información exacta y estructurada para personas que buscan mejorar su salud.');

  // Limpiar posibles etiquetas markdown
  const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error('Error parsing JSON from Gemini PDF parser:', rawText);
    throw new Error('La IA no pudo estructurar el PDF correctamente. Intenta con una imagen más clara o usa el modo entrevista.');
  }
}

export async function chatNutritionist(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  userProfile: {
    name: string;
    age?: number;
    heightCm?: number;
    weightKg: number;
    targetKg: number;
  }
): Promise<{
  reply: string;
  generatedPlan?: Partial<MealPlan & { suggestedTargetWeightKg?: number; dailyWaterTargetMl?: number }>;
}> {
  const heightM = (userProfile.heightCm || 170) / 100;
  const minHealthyWeight = Math.round(20 * heightM * heightM);
  const maxHealthyWeight = Math.round(24.9 * heightM * heightM);
  const idealReferenceWeight = Math.round(22 * heightM * heightM);
  const recommendedWaterMl = Math.max(1500, Math.round(((userProfile.weightKg || 75) * 30) / 250) * 250);

  const systemInstruction = `
Eres la Dra. Lucía, Médica y Nutricionista Clínica de RebajaYA, especialista en pérdida de grasa sostenible, recomposición corporal y salud metabólica.
Estás en consulta con tu paciente:
- Nombre: ${userProfile.name}
- Peso actual: ${userProfile.weightKg} kg
- Meta planteada por el paciente: ${userProfile.targetKg} kg
- Estatura: ${userProfile.heightCm || 170} cm
- Edad: ${userProfile.age || 30} años
- Rango de peso clínico saludable referencial (IMC 20 a 24.9): ${minHealthyWeight} kg a ${maxHealthyWeight} kg (Punto de referencia ideal: ${idealReferenceWeight} kg).
- Meta de agua calculada: ${recommendedWaterMl} ml/día (30 ml por cada kg de peso).

PRINCIPIOS Y FILOSOFÍA CLÍNICA:
1. Empatía humana y rigor médico: Eres cercana, motivadora y comprensiva. Jamás juzgas, no regañas ni generas culpa.
2. Cero dietas de hambre: Explicas que los déficits extremos (-800 kcal o comer solo ensalada) destruyen el músculo y frenan la tiroides. Propones un déficit moderado y seguro (-300 a -400 kcal) que permita comer rico, abundante en fibra y proteína, sin pasar hambre.
3. El peso meta es una sugerencia médica respetuosa, NUNCA una imposición:
   - Al abordar los objetivos del paciente, coméntale con amabilidad el rango saludable de referencia (${minHealthyWeight} a ${maxHealthyWeight} kg) para su estatura de ${userProfile.heightCm || 170} cm.
   - Recuérdale de inmediato que la meta la decide 100% él/ella según cómo se sienta con su cuerpo y energía. Si su meta actual (${userProfile.targetKg} kg) le hace feliz, apóyala con entusiasmo y valida que es un gran paso.
4. Consulta clínica secuencial en 4 Fases (haz 1 o máximo 2 preguntas por turno):
   - Fase 1: Salud y antecedentes médicos (¿Resistencia a la insulina, tiroides, hipertensión, colesterol, hígado graso, gastritis, reflujo, medicamentos habituales?).
   - Fase 2: Cronobiología, horarios de sueño y hambre emocional (Horarios en que despierta y duerme, calidad del descanso, ansiedad por dulces en la tarde o picoteo nocturno).
   - Fase 3: Gasto calórico real y actividad física (¿Trabajo sedentario de escritorio o en movimiento? ¿Hace pesas/fuerza, caminatas o cardio?).
   - Fase 4: Preferencias y logística (Alimentos favoritos innegociables que no quiere dejar, alimentos que no le gustan o le caen pesado, presupuesto y si cocina diario o prefiere cocinar para varios días).
5. Educación al paciente: Explica brevemente el "porqué" de cada recomendación (ej: por qué la proteína al desayuno previene la ansiedad de las 4:00 pm).

CUANDO HAYAS CUBIERTO LAS 4 FASES Y EL PACIENTE ESTÉ LISTO PARA EL PLAN FINAL:
Presenta un mensaje motivador con tu diagnóstico y agrega al final de tu respuesta el bloque JSON delimitado exactamente por:
<<<PLAN_JSON
{
  "title": "Plan Nutricional Clínico y Sostenible para ${userProfile.name}",
  "summary": "Resumen médico claro: déficit calórico moderado aplicado, distribución de macronutrientes, por qué se eligieron estos alimentos y pautas para sostenerlo sin efecto rebote.",
  "dailyCaloriesEstimate": 1750,
  "suggestedTargetWeightKg": ${userProfile.targetKg},
  "dailyWaterTargetMl": ${recommendedWaterMl},
  "meals": [
    {
      "id": "m1",
      "name": "Desayuno Nutritivo",
      "time": "08:00",
      "type": "desayuno",
      "description": "Comida real y porciones accesibles (ej: 2 huevos revueltos con tomate y espinacas + 1 rebanada de pan integral tostado + infusión o café sin azúcar).",
      "tips": "Consejo clínico (la proteína y grasa saludable te darán saciedad) y alternativa de reemplazo (puedes sustituir los huevos por queso bajo en sal o tofu)."
    },
    {
      "id": "m2",
      "name": "Colación Media Mañana",
      "time": "11:00",
      "type": "media_manana",
      "description": "1 manzana verde o porción de frutos secos (8-10 almendras o nueces).",
      "tips": "Mantiene estables los niveles de glucosa e insulina."
    },
    {
      "id": "m3",
      "name": "Almuerzo Balanceado",
      "time": "13:30",
      "type": "almuerzo",
      "description": "Proteína magra a la plancha (150g) + 1/2 plato de ensalada verde variada con aceite de oliva + porción moderada de carbohidrato complejo (arroz integral, papa o legumbres).",
      "tips": "Masticar pausadamente para facilitar la digestión."
    },
    {
      "id": "m4",
      "name": "Merienda de la Tarde",
      "time": "17:00",
      "type": "merienda",
      "description": "Yogurt natural sin azúcar con semillas de chía o fruta fresca.",
      "tips": "Acompañar con un vaso grande de agua fresca para cortar los antojos de media tarde."
    },
    {
      "id": "m5",
      "name": "Cena Ligera y Reparadora",
      "time": "20:30",
      "type": "cena",
      "description": "Proteína suave (pescado, pollo o ensalada con huevo) o crema de verduras casera sin cremas añadidas.",
      "tips": "Cenar al menos 2 horas antes de dormir para permitir un sueño profundo y pico de hormona de crecimiento."
    }
  ]
}
PLAN_JSON>>>
`;

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const rawResponse = await callWithFallback(contents, systemInstruction);

  // Verificar si generó un plan JSON
  const match = rawResponse.match(/<<<PLAN_JSON\s*([\s\S]*?)\s*PLAN_JSON>>>/);
  if (match) {
    const jsonStr = match[1].trim();
    const cleanText = rawResponse.replace(/<<<PLAN_JSON[\s\S]*?PLAN_JSON>>>/, '').trim();
    try {
      const generatedPlan = JSON.parse(jsonStr);
      return { reply: cleanText, generatedPlan };
    } catch {
      return { reply: rawResponse };
    }
  }

  return { reply: rawResponse };
}

export async function replaceMealWithIngredients(
  currentMeal: MealItem,
  availableIngredients: string,
  userProfile?: { name: string; weightKg: number; targetKg: number }
): Promise<{ newMeal: MealItem; explanation: string }> {
  const prompt = `
Eres la Dra. Lucía, Nutricionista Clínica de RebajaYA.
El paciente ${userProfile?.name || ''} no tiene los alimentos indicados para esta comida de su plan:
- Comida actual: "${currentMeal.name}" (${currentMeal.type}) a las ${currentMeal.time} hrs.
- Menú original: "${currentMeal.description}"
- Ingredientes que el usuario SÍ tiene disponibles: "${availableIngredients}"

Tu objetivo médico: Readaptar esta comida específica utilizando los ingredientes que tiene a mano (o básicos de cocina), asegurando que mantenga un equilibrio de proteínas, fibra y saciedad adecuado a su meta.

Responde ÚNICAMENTE con un objeto JSON válido (sin formato markdown adicional, sin comillas triples \`\`\`json):
{
  "name": "Nombre apetitoso de la comida adaptada",
  "description": "Detalle de alimentos, porciones claras y preparación rápida con sus ingredientes.",
  "tips": "Consejo nutricional de por qué este plato sustituto cumple perfectamente con su meta.",
  "explanation": "Mensaje médico cálido y motivador (1 o 2 oraciones) explicándole por qué este cambio funciona excelente."
}
`;

  const contents = [{ role: 'user', parts: [{ text: prompt }] }];
  const rawText = await callWithFallback(
    contents,
    'Eres una médica nutricionista experta en resolver imprevistos culinarios de forma práctica, saludable y rápida.',
    600
  );

  const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

  try {
    const parsed = JSON.parse(cleanJson);
    return {
      newMeal: {
        ...currentMeal,
        name: parsed.name || currentMeal.name,
        description: parsed.description || currentMeal.description,
        tips: parsed.tips || currentMeal.tips,
      },
      explanation:
        parsed.explanation || '¡Comida adaptada con éxito con los ingredientes que tienes a mano!',
    };
  } catch (e) {
    throw new Error('No se pudo generar la sustitución. Intenta detallar qué alimentos tienes.');
  }
}
