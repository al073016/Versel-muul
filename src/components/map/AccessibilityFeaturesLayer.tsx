"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { AccessibilityFeature } from "@/hooks/useAccessibleRoute";

interface Props {
  map: mapboxgl.Map | null;
  features: AccessibilityFeature[];
  visible: boolean;
}

export default function AccessibilityFeaturesLayer({ map, features, visible }: Props) {
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!map) return;

    // 1. Limpiar marcadores anteriores
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // 2. Si no es visible o no hay características, no hacemos nada
    if (!visible || features.length === 0) return;

    // 3. Crear los nuevos marcadores en el mapa
    features.forEach((feature) => {
      const el = document.createElement("div");
      
      // Asignar colores y emojis según el tipo
      let bgColor = "#ffffff";
      let emoji = "📍";
      
      switch (feature.type) {
        case "ramp":
          bgColor = "#fed000"; // Amarillo MUUL
          emoji = "♿";
          break;
        case "elevator":
          bgColor = "#003e6f"; // Azul MUUL
          emoji = "🛗";
          break;
        case "accessible_crossing":
          bgColor = "#98d5a2"; // Verde
          emoji = "🚶";
          break;
        case "tactile_paving":
          bgColor = "#facc15"; 
          emoji = "🟡";
          break;
      }

      el.style.cssText = `
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: ${bgColor};
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: pointer;
      `;
      el.innerHTML = emoji;

      // Crear Popup con el nombre o tipo
      const popup = new mapboxgl.Popup({ offset: 15 }).setHTML(
        `<div style="padding: 4px; font-family: sans-serif; text-align: center;">
          <strong style="font-size: 12px; color: #003e6f; text-transform: uppercase;">
            ${feature.type === 'ramp' ? 'Rampa' : feature.type === 'elevator' ? 'Elevador' : feature.type === 'tactile_paving' ? 'Piso Táctil' : 'Cruce Accesible'}
          </strong>
          ${feature.name ? `<br/><span style="font-size: 10px; color: #666;">${feature.name}</span>` : ''}
        </div>`
      );

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([feature.lng, feature.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Limpieza al desmontar o cambiar features
    return () => {
      markersRef.current.forEach((m) => m.remove());
    };
  }, [map, features, visible]);

  return null; // Este componente no renderiza HTML directo, solo manipula Mapbox
}