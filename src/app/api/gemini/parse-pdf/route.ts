import { NextRequest, NextResponse } from 'next/server';
import { parseDietPdf } from '@/lib/gemini';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { base64Pdf, mimeType } = await req.json();

    if (!base64Pdf) {
      return NextResponse.json({ error: 'Falta el archivo PDF en base64' }, { status: 400 });
    }

    const plan = await parseDietPdf(base64Pdf, mimeType || 'application/pdf');

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    console.error('API parse-pdf error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al procesar el PDF con Gemini' },
      { status: 500 }
    );
  }
}
