import { NextResponse } from "next/server";

interface MensajeChat {
  role: "user" | "assistant";
  content: string;
}

interface MensajeLegacy {
  tipo: "pregunta" | "respuesta";
  contenido: string;
}

const SYSTEM_PROMPT = `Eres MUUL AI, asistente turistico de Coppel.

Reglas obligatorias:
- Responde en el idioma solicitado por el usuario.
- Se breve, util y amable.
- Usa exclusivamente el contexto proporcionado de POIs/negocios/ruta.
- Si falta informacion en contexto, dilo explicitamente y sugiere que dato falta.
- No inventes direcciones, precios, horarios ni telefonos.
- Da respuestas orientadas a visitar, comer, moverse y aprovechar recompensas.`;

function inferLocale(locale?: string): string {
  if (!locale) return "es";
  if (locale.startsWith("en")) return "en";
  if (locale.startsWith("zh")) return "zh";
  if (locale.startsWith("pt")) return "pt";
  return "es";
}

function normalizeHistory(
  history: MensajeChat[] | MensajeLegacy[] | undefined
): MensajeChat[] {
  if (!Array.isArray(history)) return [];

  return history
    .map((m) => {
      const modern = m as MensajeChat;
      if ((modern.role === "user" || modern.role === "assistant") && typeof modern.content === "string") {
        return modern;
      }

      const legacy = m as MensajeLegacy;
      if ((legacy.tipo === "pregunta" || legacy.tipo === "respuesta") && typeof legacy.contenido === "string") {
        return {
          role: legacy.tipo === "pregunta" ? "user" : "assistant",
          content: legacy.contenido,
        };
      }

      return null;
    })
    .filter((v): v is MensajeChat => Boolean(v))
    .slice(-10);
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as {
      prompt?: string;
      pregunta?: string;
      locale?: string;
      idioma?: string;
      context?: unknown;
      poi?: unknown;
      history?: MensajeChat[] | MensajeLegacy[];
      historial?: MensajeLegacy[];
    };

    const userPrompt = (payload.prompt || payload.pregunta || "").trim();
    if (!userPrompt) {
      return NextResponse.json({ error: "Falta el mensaje del usuario." }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENROUTER_API_KEY no esta configurada." }, { status: 500 });
    }

    const localeKey = inferLocale(payload.locale || payload.idioma);
    const languageInstruction: Record<string, string> = {
      es: "Responde en espanol de Mexico.",
      en: "Respond in English.",
      zh: "请用中文回答。",
      pt: "Responda em portugues do Brasil.",
    };

    const mergedHistory = normalizeHistory(payload.history || payload.historial);

    const userPayload = [
      languageInstruction[localeKey],
      "",
      "Contexto disponible (JSON):",
      JSON.stringify(payload.context ?? payload.poi ?? {}, null, 2),
      "",
      `Pregunta del usuario: ${userPrompt}`,
    ].join("\n");

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...mergedHistory,
      { role: "user", content: userPayload },
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "MUUL Coppel Web",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat-v3-0324:free",
        temperature: 0.4,
        max_tokens: 450,
        messages,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("OpenRouter error:", response.status, errBody);
      return NextResponse.json({ error: "No fue posible generar la respuesta del asistente." }, { status: 502 });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Respuesta invalida del modelo." }, { status: 502 });
    }

    const text = content.trim();
    return NextResponse.json({ response: text, respuesta: text });
  } catch (error) {
    console.error("Error en /api/chatbot:", error);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
