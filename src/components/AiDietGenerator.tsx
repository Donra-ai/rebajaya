'use client';

import React, { useState } from 'react';
import { MealPlan, UserProfile } from '@/types';
import { Bot, FileUp, Sparkles, X, Check, Loader2, Send, AlertTriangle, MessageSquare } from 'lucide-react';

interface AiDietGeneratorProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onPlanCreated: (plan: MealPlan) => void;
}

export default function AiDietGenerator({
  profile,
  isOpen,
  onClose,
  onPlanCreated,
}: AiDietGeneratorProps) {
  const [activeTab, setActiveTab] = useState<'pdf' | 'chat'>('pdf');

  // Estado Modo PDF
  const [file, setFile] = useState<File | null>(null);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [previewPlan, setPreviewPlan] = useState<Partial<MealPlan> | null>(null);

  // Estado Modo Chat Nutricionista
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: `¡Hola ${profile.name}! 👋 Soy tu Nutricionista Virtual de RebajaYA. Mi objetivo es armar un menú delicioso y adaptado a tus gustos para ayudarte a llegar a tu meta de ${profile.targetWeightKg} kg. Para empezar, ¿a qué hora sueles levantarte y a qué hora te acuestas normalmente?`,
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  if (!isOpen) return null;

  // Manejar subida y lectura de PDF
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPdfError(null);
    setPreviewPlan(null);
  };

  const handleProcessPdf = async () => {
    if (!file) return;

    setIsProcessingPdf(true);
    setPdfError(null);

    try {
      // Convertir archivo a base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64String = (reader.result as string).split(',')[1];
          const mimeType = file.type || 'application/pdf';

          const res = await fetch('/api/gemini/parse-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64Pdf: base64String, mimeType }),
          });

          const data = await res.json();
          if (!res.ok || data.error) {
            throw new Error(data.error || 'No se pudo procesar el archivo');
          }

          setPreviewPlan(data.plan);
        } catch (err: any) {
          setPdfError(err.message || 'Error al conectar con la IA de Gemini');
        } finally {
          setIsProcessingPdf(false);
        }
      };
    } catch (err: any) {
      setPdfError(err.message || 'Error al leer el archivo');
      setIsProcessingPdf(false);
    }
  };

  // Enviar mensaje en la entrevista con la Nutricionista IA
  const handleSendMessage = async () => {
    if (!userInput.trim() || isSendingMessage) return;

    const newMessages = [...chatMessages, { role: 'user' as const, content: userInput.trim() }];
    setChatMessages(newMessages);
    setUserInput('');
    setIsSendingMessage(true);

    const cleanHistory = newMessages.filter(
      (m) => !m.content.includes('Lo siento, hubo un problema')
    );

    try {
      const res = await fetch('/api/gemini/chat-nutritionist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: cleanHistory,
          userProfile: {
            name: profile.name,
            weightKg: profile.currentWeightKg,
            targetKg: profile.targetWeightKg,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error en la respuesta de la IA');
      }

      setChatMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);

      if (data.generatedPlan) {
        setPreviewPlan(data.generatedPlan);
      }
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Lo siento, hubo un problema al procesar tu respuesta. Por favor intenta de nuevo.',
        },
      ]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Confirmar y aplicar plan
  const handleConfirmPlan = () => {
    if (!previewPlan) return;

    const finalPlan: MealPlan = {
      id: `plan-${Date.now()}`,
      profileId: profile.id,
      source: activeTab === 'pdf' ? 'pdf' : 'ai_interview',
      title: previewPlan.title || 'Plan Nutricional Personalizado',
      summary: previewPlan.summary || '',
      dailyCaloriesEstimate: previewPlan.dailyCaloriesEstimate || 1800,
      meals: previewPlan.meals || [],
      updatedAt: new Date().toISOString(),
    };

    onPlanCreated(finalPlan);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl p-6 shadow-2xl relative my-8">
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Configurar Plan de Dieta</h2>
            <p className="text-sm text-slate-400">Impulsado por Google Gemini</p>
          </div>
        </div>

        {/* Selector de Pestañas */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-800 mb-6">
          <button
            onClick={() => setActiveTab('pdf')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'pdf'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileUp className="w-4 h-4" />
            <span>Subir PDF del Médico</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'chat'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Nutricionista IA Virtual</span>
          </button>
        </div>

        {/* CONTENIDO PESTAÑA 1: SUBIR PDF */}
        {activeTab === 'pdf' && (
          <div>
            <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-3xl p-8 text-center bg-slate-950/40 transition-colors cursor-pointer relative">
              <input
                type="file"
                accept=".pdf,application/pdf,image/*"
                onChange={handlePdfUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center pointer-events-none">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                  <FileUp className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-white mb-1">
                  {file ? file.name : 'Toca aquí para seleccionar el PDF o foto del plan'}
                </h4>
                <p className="text-sm text-slate-400">
                  {file ? `${(file.size / 1024).toFixed(0)} KB seleccionado` : 'Formatos: PDF, JPG, PNG'}
                </p>
              </div>
            </div>

            {file && !previewPlan && (
              <button
                onClick={handleProcessPdf}
                disabled={isProcessingPdf}
                className="w-full mt-4 py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-2xl text-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all"
              >
                {isProcessingPdf ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Gemini está leyendo y estructurando tu PDF...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    <span>Extraer Menú y Horarios con IA</span>
                  </>
                )}
              </button>
            )}

            {pdfError && (
              <div className="mt-4 p-4 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
                <span>{pdfError}</span>
              </div>
            )}
          </div>
        )}

        {/* CONTENIDO PESTAÑA 2: CHAT CON NUTRICIONISTA */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-[400px]">
            <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-slate-950/60 rounded-2xl border border-slate-800 mb-3">
              {chatMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {isSendingMessage && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 p-3 rounded-2xl border border-slate-700 text-slate-400 text-xs flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>La nutricionista está escribiendo...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input del Chat */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Escribe tu respuesta aquí..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={isSendingMessage || !userInput.trim()}
                className="p-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 rounded-2xl font-bold transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* VISTA PREVIA DEL PLAN GENERADO (SI SE OBTUVO) */}
        {previewPlan && previewPlan.meals && (
          <div className="mt-6 border-t border-slate-800 pt-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>Plan Listo: {previewPlan.title}</span>
              </h4>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full font-bold">
                {previewPlan.meals.length} comidas detectadas
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4">{previewPlan.summary}</p>

            <div className="max-h-56 overflow-y-auto space-y-2 pr-1 mb-4">
              {previewPlan.meals.map((m, i) => (
                <div key={i} className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
                  <div className="flex justify-between font-bold text-slate-200 mb-1">
                    <span>{m.name}</span>
                    <span className="text-amber-400">{m.time} hrs</span>
                  </div>
                  <p className="text-slate-400">{m.description}</p>
                </div>
              ))}
            </div>

            <button
              onClick={handleConfirmPlan}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black rounded-2xl text-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Check className="w-6 h-6 stroke-[3]" />
              <span>Guardar y Aplicar a Mi Rutina Diaria</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
