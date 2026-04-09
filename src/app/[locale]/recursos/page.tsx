"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";

interface RecursoCard {
  id: string;
  titulo: string;
  descripcion: string;
  link: string;
  imagen?: string;
}

const RECURSOS_MOCKUP: RecursoCard[] = [
  {
    id: "recurso-1",
    titulo: "Guía de Emprendimiento",
    descripcion: "Aprende los fundamentos para iniciar tu negocio",
    link: "https://www.coppel.com/emprendimiento",
    imagen: undefined,
  },
  {
    id: "recurso-2",
    titulo: "Capacitación Digital",
    descripcion: "Cursos en línea para desarrollar tus habilidades",
    link: "https://www.coppel.com/capacitacion",
    imagen: undefined,
  },
  {
    id: "recurso-3",
    titulo: "Financiamiento Empresarial",
    descripcion: "Opciones de crédito para tu negocio",
    link: "https://www.coppel.com/financiamiento",
    imagen: undefined,
  },
  {
    id: "recurso-4",
    titulo: "Herramientas de Gestión",
    descripcion: "Software y plataformas para administrar tu empresa",
    link: "https://www.coppel.com/herramientas",
    imagen: undefined,
  },
  {
    id: "recurso-5",
    titulo: "Red de Mentores",
    descripcion: "Conecta con expertos para asesoría personalizada",
    link: "https://www.coppel.com/mentores",
    imagen: undefined,
  },
  {
    id: "recurso-6",
    titulo: "Comunidad de Emprendedores",
    descripcion: "Únete a nuestra comunidad de navegación y aprendizaje",
    link: "https://www.coppel.com/comunidad",
    imagen: undefined,
  },
];

export default function RecursosPage() {
  const t = useTranslations("recursos");

  return (
    <main className="min-h-screen pt-24 pb-16 px-6 bg-surface">
      <div className="max-w-[1440px] mx-auto">
        {/* Header */}
        <section className="mb-16 space-y-4">
          <h1 className="text-5xl md:text-6xl xl:text-7xl font-headline italic text-primary leading-[0.92]">
            Recursos para tu Negocio
          </h1>
          <p className="text-on-surface-variant text-xl max-w-2xl leading-relaxed">
            Accede a herramientas, capacitación y oportunidades que te ayudarán a crecer. 
            Coppel Emprende te proporciona todo lo que necesitas para tener éxito.
          </p>
        </section>

        {/* Recursos Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {RECURSOS_MOCKUP.map((recurso) => (
            <a
              key={recurso.id}
              href={recurso.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl border border-outline-variant/20 overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col"
            >
              {/* Imagen Placeholder */}
              <div className="w-full h-48 bg-gradient-to-br from-[#003e6f]/10 to-[#fed000]/10 flex items-center justify-center overflow-hidden relative">
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 rounded-full bg-[#003e6f]/20 mx-auto flex items-center justify-center group-hover:bg-[#003e6f]/30 transition-colors">
                      <span className="text-3xl">📦</span>
                    </div>
                    <p className="text-xs text-[#003e6f]/40 font-bold">Imagen</p>
                  </div>
                </div>
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#003e6f]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                  <span className="material-symbols-outlined text-white text-3xl">
                    open_in_new
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col flex-1">
                <h3 className="font-headline italic text-2xl text-[#003e6f] mb-2 group-hover:text-[#005596] transition-colors">
                  {recurso.titulo}
                </h3>
                <p className="text-[#003e6f]/70 text-sm leading-relaxed flex-1">
                  {recurso.descripcion}
                </p>
                <div className="mt-4 pt-4 border-t border-outline-variant/10 flex items-center gap-2 text-[#003e6f] font-bold text-xs uppercase tracking-wider group-hover:text-[#fed000] transition-colors">
                  Ver Recurso
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </div>
              </div>
            </a>
          ))}
        </section>

        {/* CTA Section */}
        <section className="mt-20 rounded-3xl bg-gradient-to-r from-[#003e6f] to-[#005596] p-12 text-white text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-headline italic">
            ¿Necesitas más ayuda?
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Nuestro equipo de soporte está disponible para ayudarte en tu jornada empresarial.
          </p>
          <Link
            href="/soporte"
            className="inline-block px-10 py-4 bg-[#fed000] text-[#003e6f] rounded-full font-headline italic text-lg font-bold hover:bg-white transition-all shadow-lg hover:shadow-xl"
          >
            Contactar Soporte
          </Link>
        </section>
      </div>
    </main>
  );
}
