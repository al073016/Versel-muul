import createMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createMiddleware({
  locales: ["es", "en", "zh", "pt"],
  defaultLocale: "es",
  localeDetection: true,
});

export async function middleware(request: NextRequest) {
  const supabaseResponse = await updateSession(request);
  const intlResponse = intlMiddleware(request);

  supabaseResponse.cookies.getAll().forEach((cookie: { name: string; value: string }) => {
    intlResponse.cookies.set(cookie.name, cookie.value);
  });

  return intlResponse;
}

export const config = {
  // Matcher que incluye tanto la raíz como las rutas con idioma, 
  // y también captura rutas sin prefijo para aplicar el locale por defecto.
  matcher: [
    "/", 
    "/(es|en|zh|pt)/:path*",
    "/((?!api|_next|_vercel|.*\\..*).*)"
  ],
};