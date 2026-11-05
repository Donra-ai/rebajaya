import { NextRequest, NextResponse } from 'next/server';
import { chatNutritionist } from '@/lib/gemini';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { messages, userProfile } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Se requiere una lista de mensajes válida' }, { status: 400 });
    }

    const result = await chatNutritionist(
      messages,
      userProfile || { name: 'Usuario', weightKg: 80, targetKg: 70, heightCm: 170, age: 30 }
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('API chat-nutritionist error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al comunicarse con la nutricionista virtual' },
      { status: 500 }
    );
  }
}
