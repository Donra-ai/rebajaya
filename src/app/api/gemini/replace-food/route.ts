import { NextRequest, NextResponse } from 'next/server';
import { replaceMealWithIngredients } from '@/lib/gemini';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { currentMeal, availableIngredients, userProfile } = await req.json();

    if (!currentMeal || !availableIngredients) {
      return NextResponse.json(
        { error: 'Se requiere la comida actual y los ingredientes disponibles' },
        { status: 400 }
      );
    }

    const result = await replaceMealWithIngredients(
      currentMeal,
      availableIngredients,
      userProfile
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('API replace-food error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al adaptar la comida con la IA' },
      { status: 500 }
    );
  }
}
