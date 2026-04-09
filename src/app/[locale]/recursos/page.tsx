"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import Image from "next/image";

export default function RecursosPage() {
  const t = useTranslations("recursos");
  const [imagenUrl, setImagenUrl] = useState<string>("https://qewqnirwuptcudoflgkd.supabase.co/storage/v1/object/public/muul_media/Coppel%20Emprende%20_RGB_Secundario_White.png");

  return (
    <main className="min-h-screen pt-24 pb-16 px-6 bg-surface">
      <div className="max-w-[1440px] mx-auto">
        {/* Header */}
        <section className="mb-16 space-y-4 p-12 rounded-3xl bg-gradient-to-r from-[#003e6f] to-[#005596]">
          <h1 className="text-5xl md:text-6xl xl:text-7xl font-headline italic text-white leading-[0.92]">
            Coppel Emprende
          </h1>
          <p className="text-white/90 text-xl max-w-2xl leading-relaxed">
            Accede a herramientas, capacitación y oportunidades que te ayudarán a crecer. 
            Coppel Emprende te proporciona todo lo que necesitas para tener éxito.
          </p>
        </section>

        {/* Recurso Card */}
        <section className="max-w-2xl mx-auto">
          <a
            href="https://www.fundacioncoppel.org/coppel-emprende/"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl border border-outline-variant/20 overflow-hidden bg-white shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col"
          >
            {/* Imagen */}
            <div className="w-full h-64 bg-gradient-to-br from-[#003e6f]/10 to-[#fed000]/10 flex items-center justify-center overflow-hidden relative">
              {imagenUrl ? (
                <img 
                  src={imagenUrl}
                  alt="Coppel Emprende" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 rounded-full bg-[#003e6f]/20 mx-auto flex items-center justify-center group-hover:bg-[#003e6f]/30 transition-colors">
                      <span className="text-3xl">📦</span>
                    </div>
                    <p className="text-xs text-[#003e6f]/40 font-bold">Agregar imagen</p>
                  </div>
                </div>
              )}
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#003e6f]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                <span className="material-symbols-outlined text-white text-3xl">
                  open_in_new
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 flex flex-col flex-1 text-center">
              <h3 className="font-headline italic text-3xl text-[#003e6f] mb-3 group-hover:text-[#005596] transition-colors">
                Fundación Coppel Emprende
              </h3>
              <p className="text-[#003e6f]/70 text-base leading-relaxed flex-1 mb-6">
                Accede a recursos, capacitación y oportunidades de financiamiento. Completa el curso y obtén el <span className="font-bold text-[#fed000]">Sello de Garantía MUUL</span> que valida tu negocio ante nuestros usuarios.
              </p>
              <div className="mt-4 pt-4 border-t border-outline-variant/10 flex items-center justify-center gap-2 text-[#003e6f] font-bold text-sm uppercase tracking-wider group-hover:text-[#fed000] transition-colors">
                Visitar sitio
                <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </div>
            </div>
          </a>

        </section>

        {/* CTA Section */}
        <section className="mt-20 rounded-3xl bg-gradient-to-r from-[#003e6f] to-[#005596] p-12 text-white text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-headline italic">
            ¿Necesitas más ayuda?
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Nuestro equipo de soporte está disponible para ayudarte en tu jornada empresarial.
          </p>
          <a
            href="mailto:soporte@muul.com"
            className="inline-block px-10 py-4 bg-[#fed000] text-[#003e6f] rounded-full font-headline italic text-lg font-bold hover:bg-white transition-all shadow-lg hover:shadow-xl"
          >
            Contactar Soporte
          </a>
        </section>
      </div>
    </main>
  );
}
