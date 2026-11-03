import { GoogleGenAI } from '@google/genai';
import { MealItem, MealPlan } from '@/types';

const apiKey = process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

// Modelos en orden de preferencia con fallback automático ante picos de demanda
const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-2.5-pro',
];

async function callWithFallback(contents: any, systemInstruction?: string): Promise<string> {
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: systemInstruction
          ? {
              systemInstruction,
              temperature: 0.2,
            }
          : { temperature: 0.2 },
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
  userProfile: { name: string; age?: number; weightKg: number; targetKg: number }
): Promise<{ reply: string; generatedPlan?: Partial<MealPlan> }> {
  const systemInstruction = `
Eres la Nutricionista Virtual de RebajaYA.
Estás hablando con ${userProfile.name} (peso actual: ${userProfile.weightKg} kg, meta: ${userProfile.targetKg} kg).
Tu objetivo es realizar una breve evaluación cálida y empática para armar un plan de alimentación adecuado.

Pregunta de forma secuencial y amable sobre:
1. Horarios habituales en los que suele levantarse y acostarse.
2. Alimentos favoritos y alimentos que no le gustan o que le caen mal/alergias.
3. Nivel de actividad física diaria (ej: caminata suave, reposo, etc.).
4. Si tiene condiciones médicas (como diabetes, hipertensión o colesterol).

Haz 1 o 2 preguntas a la vez para no abrumar al usuario. Usa tono muy cercano, respetuoso y comprensible para una persona mayor.

IMPORTANTE: Cuando tengas suficiente información y estés lista para presentar el plan final, incluye en tu respuesta un bloque JSON delimitado exactamente por:
<<<PLAN_JSON
{
  "title": "Plan Personalizado para ...",
  "summary": "...",
  "dailyCaloriesEstimate": 1750,
  "meals": [
    {
      "id": "m1",
      "name": "Desayuno",
      "time": "08:30",
      "type": "desayuno",
      "description": "...",
      "tips": "..."
    }
  ]
}
PLAN_JSON>>>
seguido de un mensaje motivador.
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
