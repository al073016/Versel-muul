"use client";

import { useTranslations } from "next-intl";

const DUMMY_OFFERS = [
  {
    id: 1,
    store: "Tacos El Guero",
    discount: "20% OFF",
    category: "Gastronomía",
    description: "En toda la carta de tacos al pastor y bebidas.",
    distance: "0.5 km",
    image: "https://images.unsplash.com/photo-1512813588641-0737a3459ced?q=80&w=400&h=300&auto=format&fit=crop",
    brandColor: "bg-[#003e6f]"
  },
  {
    id: 2,
    store: "Coppel Reforma",
    discount: "$500 Gift Card",
    category: "Tienda",
    description: "Por compras mayores a $2,500 en calzado deportivo.",
    distance: "1.2 km",
    image: "https://images.unsplash.com/photo-1544013919-450f1fbcfa66?q=80&w=400&h=300&auto=format&fit=crop",
    brandColor: "bg-[#fed000] !text-[#003e6f]"
  },
  {
    id: 3,
    store: "Museo Soumaya",
    discount: "Entrada 2x1",
    category: "Cultural",
    description: "Válido todos los jueves de abril 2026.",
    distance: "2.8 km",
    image: "https://images.unsplash.com/photo-1620392353723-8685e135e61e?q=80&w=400&h=300&auto=format&fit=crop",
    brandColor: "bg-[#005596]"
  },
  {
    id: 4,
    store: "The Coffee Bean",
    discount: "Bebida Gratis",
    category: "Gastronomía",
    description: "En la compra de cualquier pan artesanal.",
    distance: "0.2 km",
    image: "https://images.unsplash.com/photo-1444418196534-7705142fbd60?q=80&w=400&h=300&auto=format&fit=crop",
    brandColor: "bg-[#fed000] !text-[#003e6f]"
  }
];

export default function OfertasPage() {
  const t = useTranslations("nav");

  return (
    <main className="pt-32 pb-20 bg-[#ffffff] min-h-screen">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div>
            <span className="font-label text-[#005596] tracking-widest text-xs uppercase mb-3 block font-black">🔥 Hot Deals</span>
            <h1 className="font-headline text-5xl md:text-6xl text-[#003e6f] font-black">{t("ofertas")} Cercanas</h1>
            <p className="text-neutral-500 mt-4 font-body text-lg max-w-xl">Aprovecha los beneficios exclusivos de la red Muul para disfrutar lo mejor de la ciudad.</p>
          </div>
          <div className="bg-slate-100 p-2 rounded-2xl flex gap-2 border border-slate-200">
            <button className="bg-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-[#003e6f] shadow-sm">Todas</button>
            <button className="px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-[#003e6f]/40 hover:text-[#003e6f] transition-all">Gastronomía</button>
            <button className="px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-[#003e6f]/40 hover:text-[#003e6f] transition-all">Tiendas</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {DUMMY_OFFERS.map((offer) => (
            <div key={offer.id} className="group bg-white rounded-[2.5rem] overflow-hidden border border-neutral-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
              <div className="relative h-48 overflow-hidden">
                <img src={offer.image} alt={offer.store} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-[#003e6f]">
                  {offer.category}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                  <span className="text-white text-xs font-body flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">near_me</span>
                    {offer.distance} de distancia
                  </span>
                </div>
              </div>
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-headline text-2xl text-[#003e6f] font-black leading-tight">{offer.store}</h3>
                  <span className={`px-3 py-1 rounded-lg text-white font-black text-sm ${offer.brandColor}`}>{offer.discount}</span>
                </div>
                <p className="text-neutral-500 font-body text-sm mb-8 line-clamp-2">
                  {offer.description}
                </p>
                <button className="w-full py-4 bg-[#003e6f] text-white !text-white rounded-2xl font-headline font-black text-sm hover:bg-[#fed000] hover:text-[#003e6f] transition-all shadow-lg shadow-[#003e6f]/20 group-hover:shadow-[#fed000]/20">
                  Obtener Cupón
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
