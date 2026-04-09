import { NextResponse } from "next/server";

interface POIContext {
  nombre?: string;
  categoria?: string;
  descripcion?: string | null;
  horario_apertura?: string | null;
  horario_cierre?: string | null;
  precio_rango?: string | null;
  emoji?: string | null;
  verificado?: boolean;
  direccion?: string | null;
  especialidades?: string[];
}

interface ContextoChat {
  tipo_contexto?: "general" | "poi" | "negocio" | "ruta";
  poi?: POIContext | null;
  ruta?: POIContext[];
  lugares_cercanos?: POIContext[];
  total_visibles?: number;
}

interface MensajeChat {
  role: "user" | "assistant";
  content: string;
}

interface MensajeLegacy {
  tipo: "pregunta" | "respuesta";
  contenido: string;
}

const MODELOS_GRATUITOS = [
  "meta-llama/llama-3.2-3b-instruct:free",
  "google/gemma-3-4b-it:free",
  "google/gemma-3n-e4b-it:free",
  "openai/gpt-oss-20b:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
];

const SYSTEM_PROMPT = `Eres Muul AI, un guía turístico experto, amigable y conciso especializado en México y el Mundial FIFA 2026.

REGLAS ESTRICTAS:
- Responde únicamente con base en el contexto disponible.
- Si no hay datos suficientes, dilo con honestidad y sugiere el siguiente paso útil.
- Responde siempre en el idioma solicitado.
- Máximo 3 o 4 oraciones por respuesta.
- No inventes direcciones, precios, horarios ni teléfonos.
- Mantén un tono claro, cálido y práctico.`;

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

function parseIdioma(idioma?: string): string {
  if (!idioma) return "español";
  if (idioma.startsWith("en")) return "English";
  if (idioma.startsWith("zh")) return "中文";
  if (idioma.startsWith("pt")) return "português";
  return "español";
}

function getTargetLanguageInstruction(locale?: string): string {
  const idioma = parseIdioma(inferLocale(locale));
  return `Traduce todo al idioma ${idioma}.`;
}

function buildContextoTexto(context: ContextoChat, fallbackPoi?: POIContext): string {
  const tipo = context.tipo_contexto || (fallbackPoi?.nombre ? "poi" : "general");
  const poiActivo = context.poi || fallbackPoi;
  const ruta = Array.isArray(context.ruta) ? context.ruta : [];
  const lugaresCercanos = Array.isArray(context.lugares_cercanos) ? context.lugares_cercanos : [];
  const total = typeof context.total_visibles === "number" ? context.total_visibles : undefined;

  if (tipo === "ruta") {
    if (ruta.length === 0) return "Contexto de ruta: no hay paradas seleccionadas.";
    const listado = ruta
      .slice(0, 8)
      .map((p, i) => `${i + 1}. ${p.emoji || "📍"} ${p.nombre || "POI"} (${p.categoria || "sin categoría"})`)
      .join("\n");
    return [
      "Contexto activo: Ruta de lugares.",
      `Paradas en ruta: ${ruta.length}.`,
      total ? `Lugares visibles en mapa: ${total}.` : "",
      "Listado de paradas:",
      listado,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (poiActivo?.nombre) {
    const horario = poiActivo.horario_apertura && poiActivo.horario_cierre
      ? `${poiActivo.horario_apertura} - ${poiActivo.horario_cierre}`
      : "No especificado";
    return [
      `Contexto activo: ${tipo === "negocio" ? "Negocio" : "Lugar"}.`,
      `Nombre: ${poiActivo.nombre}`,
      `Categoría: ${poiActivo.categoria || "No especificada"}`,
      `Descripción: ${poiActivo.descripcion || "No disponible"}`,
      `Horario: ${horario}`,
      poiActivo.precio_rango ? `Rango de precios: ${poiActivo.precio_rango}` : "",
      poiActivo.direccion ? `Dirección: ${poiActivo.direccion}` : "",
      poiActivo.especialidades?.length ? `Especialidades: ${poiActivo.especialidades.join(", ")}` : "",
      poiActivo.verificado ? "Lugar verificado por Muul: sí" : "",
      poiActivo.emoji ? `Emoji representativo: ${poiActivo.emoji}` : "",
      lugaresCercanos.length ? `Lugares Muul cercanos: ${lugaresCercanos.slice(0, 5).map((p) => p.nombre || "POI").join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    "Contexto activo: Mapa general.",
    total ? `Lugares visibles en mapa: ${total}.` : "",
    lugaresCercanos.length
      ? [
          "Lugares Muul cercanos disponibles:",
          ...lugaresCercanos.slice(0, 8).map((p, i) => `${i + 1}. ${p.emoji || "📍"} ${p.nombre || "POI"} (${p.categoria || "sin categoría"})${p.descripcion ? ` — ${p.descripcion}` : ""}`),
        ].join("\n")
      : "",
    "No hay un lugar específico seleccionado.",
  ]
    .filter(Boolean)
    .join("\n");
}

async function llamarOpenRouter(
  modelo: string,
  baseUrl: string,
  apiKey: string,
  messages: { role: string; content: string }[]
): Promise<Response> {
  return fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      "X-Title": "MUUL Coppel Web",
    },
    body: JSON.stringify({
      model: modelo,
      temperature: 0.35,
      max_tokens: 320,
      messages,
    }),
  });
}

export async function GET() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ available: false, code: "OPENROUTER_KEY_OFF" });
  }
  return NextResponse.json({ available: true, code: "READY" });
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as {
      prompt?: string;
      pregunta?: string;
      locale?: string;
      idioma?: string;
      context?: ContextoChat;
      poi?: POIContext;
      history?: MensajeChat[] | MensajeLegacy[];
      historial?: MensajeLegacy[];
      translationBatch?: {
        texts: string[];
        targetLocale?: string;
      };
    };

    if (payload.translationBatch) {
      const apiKey = process.env.OPENROUTER_API_KEY;
      const baseUrl = (process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1").replace(/\/$/, "");
      if (!apiKey) {
        return NextResponse.json(
          { error: "OPENROUTER_API_KEY no esta configurada.", code: "OPENROUTER_KEY_OFF" },
          { status: 503 }
        );
      }

      const texts = Array.isArray(payload.translationBatch.texts)
        ? payload.translationBatch.texts.filter((v) => typeof v === "string" && v.trim().length > 0)
        : [];
      if (texts.length === 0) {
        return NextResponse.json({ translations: [] });
      }

      const modeloEnv = process.env.OPENROUTER_MODEL?.trim();
      const modelos = modeloEnv && modeloEnv.includes(":free")
        ? [modeloEnv, ...MODELOS_GRATUITOS]
        : MODELOS_GRATUITOS;
      const modelosUnicos = Array.from(new Set(modelos));

      const instruction = getTargetLanguageInstruction(payload.translationBatch.targetLocale);
      const translated: Array<string | null> = [];
      let successCount = 0;

      for (const text of texts) {
        let translatedText: string | null = null;

        for (const modelo of modelosUnicos) {
          try {
            const prompt = [
              "Eres un traductor profesional.",
              instruction,
              "Responde solo con la traducción, sin explicación, sin comillas y sin markdown.",
              "",
              `Texto: ${text}`,
            ].join("\n");

            const response = await llamarOpenRouter(modelo, baseUrl, apiKey, [
              { role: "user", content: prompt },
            ]);

            if (!response.ok) {
              if (response.status === 401) {
                return NextResponse.json(
                  { error: "API key de OpenRouter invalida.", code: "OPENROUTER_KEY_INVALID" },
                  { status: 401 }
                );
              }
              continue;
            }

            const data = await response.json();
            const content = data?.choices?.[0]?.message?.content;
            if (typeof content !== "string" || !content.trim()) continue;

            translatedText = content.trim();
            break;
          } catch {
            continue;
          }
        }

        if (translatedText) {
          translated.push(translatedText);
          successCount += 1;
        } else {
          translated.push(null);
        }
      }

      if (successCount === 0) {
        return NextResponse.json({ error: "No se pudo traducir el historial.", code: "TRANSLATION_FAILED" }, { status: 502 });
      }

      return NextResponse.json({ translations: translated, partial: successCount !== texts.length });
    }

    const userPrompt = (payload.prompt || payload.pregunta || "").trim();
    if (!userPrompt) {
      return NextResponse.json({ error: "Falta el mensaje del usuario." }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    const baseUrl = (process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1").replace(/\/$/, "");
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY no esta configurada.", code: "OPENROUTER_KEY_OFF" },
        { status: 503 }
      );
    }

    const localeKey = inferLocale(payload.locale || payload.idioma);
    const idioma = parseIdioma(localeKey);

    const mergedHistory = normalizeHistory(payload.history || payload.historial);
    const contextoTexto = buildContextoTexto(payload.context || {}, payload.poi);

    const userPayload = [
      "Instrucciones de comportamiento:",
      SYSTEM_PROMPT,
      "",
      `Idioma de respuesta obligatorio: ${idioma}.`,
      "Si el contexto incluye lugares cercanos, usa exclusivamente esos lugares Muul como base para recomendaciones cercanas y no inventes sitios externos.",
      "",
      "Contexto disponible:",
      contextoTexto,
      "",
      `Pregunta del usuario: ${userPrompt}`,
    ].join("\n");

    const messages = [
      ...mergedHistory,
      { role: "user", content: userPayload },
    ];

    const modeloEnv = process.env.OPENROUTER_MODEL?.trim();
    const modelos = modeloEnv && modeloEnv.includes(":free")
      ? [modeloEnv, ...MODELOS_GRATUITOS]
      : MODELOS_GRATUITOS;
    const modelosUnicos = Array.from(new Set(modelos));

    let respuesta: string | null = null;
    let ultimoError = "No fue posible generar la respuesta del asistente.";

    for (const modelo of modelosUnicos) {
      try {
        const response = await llamarOpenRouter(modelo, baseUrl, apiKey, messages);

        if (response.ok) {
          const data = await response.json();
          const content = data?.choices?.[0]?.message?.content;
          if (typeof content === "string" && content.trim()) {
            respuesta = content.trim();
            break;
          }
          ultimoError = `El modelo ${modelo} devolvio una respuesta vacia.`;
          continue;
        }

        const errBody = await response.text();
        if (response.status === 401) {
          return NextResponse.json(
            { error: "API key de OpenRouter invalida.", code: "OPENROUTER_KEY_INVALID" },
            { status: 401 }
          );
        }
        if (response.status === 429) {
          ultimoError = `El modelo ${modelo} esta saturado.`;
          continue;
        }
        console.error("OpenRouter error:", response.status, modelo, errBody);
        ultimoError = `Error ${response.status} con el modelo ${modelo}.`;
      } catch (error) {
        console.error("OpenRouter connection error:", modelo, error);
        ultimoError = `Error de conexion con el modelo ${modelo}.`;
      }
    }

    if (!respuesta) {
      const code = ultimoError.includes("saturado") ? "RATE_LIMITED" : "MODEL_ERROR";
      return NextResponse.json({ error: ultimoError, code }, { status: 502 });
    }

    const text = respuesta;
    return NextResponse.json({ response: text, respuesta: text });
  } catch (error) {
    console.error("Error en /api/chatbot:", error);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
