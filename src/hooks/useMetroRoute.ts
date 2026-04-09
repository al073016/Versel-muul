"use client";

import { useCallback, useState } from "react";
import type { POI } from "@/types/database";

interface MetroStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  lines: string[];
}

interface MetroLine {
  id: string;
  name: string;
  color: string;
  stations: string[];
}

interface MetroInstruction {
  type: "walk_to_board" | "board" | "transfer" | "exit_walk";
  station?: string;
  line?: string;
  direction?: string;
  minutes?: number;
}

export interface MetroRouteResult {
  geometry: GeoJSON.LineString;
  distancia_metros: number;
  duracion_segundos: number;
  distancia_texto: string;
  duracion_texto: string;
  orderedPois: POI[];
  legs: { distance: number; duration: number }[];
  instructions: MetroInstruction[];
  city: string;
}

interface MetroCity {
  code: "cdmx";
  name: string;
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
}

const METRO_CITIES: MetroCity[] = [
  {
    code: "cdmx",
    name: "CDMX",
    bounds: {
      minLat: 19.15,
      maxLat: 19.58,
      minLng: -99.37,
      maxLng: -98.94,
    },
  },
];

const STATIONS: Record<string, MetroStation> = {
  observatorio: { id: "observatorio", name: "Observatorio", lat: 19.3996, lng: -99.2014, lines: ["L1"] },
  tacubaya: { id: "tacubaya", name: "Tacubaya", lat: 19.4043, lng: -99.1898, lines: ["L1", "L7", "L9"] },
  chapultepec: { id: "chapultepec", name: "Chapultepec", lat: 19.4204, lng: -99.1766, lines: ["L1"] },
  insurgentes: { id: "insurgentes", name: "Insurgentes", lat: 19.4235, lng: -99.1634, lines: ["L1"] },
  balderas: { id: "balderas", name: "Balderas", lat: 19.4276, lng: -99.1494, lines: ["L1", "L3"] },
  salto_del_agua: { id: "salto_del_agua", name: "Salto del Agua", lat: 19.4268, lng: -99.1417, lines: ["L1"] },
  pino_suarez: { id: "pino_suarez", name: "Pino Suarez", lat: 19.4258, lng: -99.1327, lines: ["L1", "L2"] },
  merced: { id: "merced", name: "Merced", lat: 19.4231, lng: -99.1242, lines: ["L1"] },
  candelaria: { id: "candelaria", name: "Candelaria", lat: 19.4282, lng: -99.1182, lines: ["L1"] },
  san_lazaro: { id: "san_lazaro", name: "San Lazaro", lat: 19.4315, lng: -99.1153, lines: ["L1"] },
  pantitlan: { id: "pantitlan", name: "Pantitlan", lat: 19.4154, lng: -99.0731, lines: ["L1", "L9"] },

  hidalgo: { id: "hidalgo", name: "Hidalgo", lat: 19.4374, lng: -99.1472, lines: ["L2", "L3"] },
  bellas_artes: { id: "bellas_artes", name: "Bellas Artes", lat: 19.4357, lng: -99.1413, lines: ["L2"] },
  allende: { id: "allende", name: "Allende", lat: 19.4351, lng: -99.1362, lines: ["L2"] },
  zocalo: { id: "zocalo", name: "Zocalo", lat: 19.4326, lng: -99.1332, lines: ["L2"] },
  chabacano: { id: "chabacano", name: "Chabacano", lat: 19.409, lng: -99.1356, lines: ["L2", "L9"] },

  juanacatlan: { id: "juanacatlan", name: "Juanacatlan", lat: 19.4127, lng: -99.1801, lines: ["L9"] },
  patriotismo: { id: "patriotismo", name: "Patriotismo", lat: 19.4068, lng: -99.1788, lines: ["L9"] },
  centro_medico: { id: "centro_medico", name: "Centro Medico", lat: 19.406, lng: -99.1557, lines: ["L9", "L3"] },

  mixcoac: { id: "mixcoac", name: "Mixcoac", lat: 19.3762, lng: -99.1876, lines: ["L7", "L12"] },
  barranca_muerto: { id: "barranca_muerto", name: "Barranca del Muerto", lat: 19.3674, lng: -99.1893, lines: ["L7"] },
  auditorio: { id: "auditorio", name: "Auditorio", lat: 19.4251, lng: -99.192, lines: ["L7"] },

  zapata: { id: "zapata", name: "Zapata", lat: 19.3722, lng: -99.1645, lines: ["L3", "L12"] },
  etiopia: { id: "etiopia", name: "Etiopia", lat: 19.3957, lng: -99.1549, lines: ["L3"] },
};

const LINES: Record<string, MetroLine> = {
  L1: {
    id: "L1",
    name: "L1",
    color: "#e11d8a",
    stations: [
      "observatorio",
      "tacubaya",
      "chapultepec",
      "insurgentes",
      "balderas",
      "salto_del_agua",
      "pino_suarez",
      "merced",
      "candelaria",
      "san_lazaro",
      "pantitlan",
    ],
  },
  L2: {
    id: "L2",
    name: "L2",
    color: "#2563eb",
    stations: ["hidalgo", "bellas_artes", "allende", "zocalo", "pino_suarez", "chabacano"],
  },
  L3: {
    id: "L3",
    name: "L3",
    color: "#16a34a",
    stations: ["hidalgo", "balderas", "etiopia", "centro_medico", "zapata"],
  },
  L7: {
    id: "L7",
    name: "L7",
    color: "#f59e0b",
    stations: ["barranca_muerto", "mixcoac", "tacubaya", "auditorio"],
  },
  L9: {
    id: "L9",
    name: "L9",
    color: "#f97316",
    stations: ["tacubaya", "juanacatlan", "patriotismo", "centro_medico", "chabacano", "pantitlan"],
  },
  L12: {
    id: "L12",
    name: "L12",
    color: "#a855f7",
    stations: ["mixcoac", "zapata"],
  },
};

type Coord = [number, number]; // [lat, lng]

interface Edge {
  to: string;
  line: string;
  distance: number;
}

interface StateNode {
  station: string;
  line: string;
  cost: number;
  prev?: string;
}

const WALK_SPEED_MPS = 1.2;
const METRO_SPEED_MPS = 9;
const STOP_PENALTY_SECONDS = 40;
const TRANSFER_PENALTY_SECONDS = 210;
const INITIAL_WAIT_SECONDS = 150;

function haversineMeters(a: Coord, b: Coord): number {
  const R = 6371000;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

function buildGraph(): Record<string, Edge[]> {
  const graph: Record<string, Edge[]> = {};
  Object.keys(STATIONS).forEach((id) => {
    graph[id] = [];
  });

  Object.values(LINES).forEach((line) => {
    for (let i = 0; i < line.stations.length - 1; i += 1) {
      const a = line.stations[i];
      const b = line.stations[i + 1];
      const dist = haversineMeters([STATIONS[a].lat, STATIONS[a].lng], [STATIONS[b].lat, STATIONS[b].lng]);
      graph[a].push({ to: b, line: line.id, distance: dist });
      graph[b].push({ to: a, line: line.id, distance: dist });
    }
  });

  return graph;
}

const GRAPH = buildGraph();

export function getMetroCityByLocation(location: Coord | null): MetroCity | null {
  if (!location) return null;
  const [lat, lng] = location;
  return (
    METRO_CITIES.find(
      (city) =>
        lat >= city.bounds.minLat &&
        lat <= city.bounds.maxLat &&
        lng >= city.bounds.minLng &&
        lng <= city.bounds.maxLng
    ) || null
  );
}

function nearestStation(coord: Coord): { stationId: string; distance: number } | null {
  let best: { stationId: string; distance: number } | null = null;

  Object.values(STATIONS).forEach((station) => {
    const d = haversineMeters(coord, [station.lat, station.lng]);
    if (!best || d < best.distance) {
      best = { stationId: station.id, distance: d };
    }
  });

  return best;
}

function lineDirection(lineId: string, fromStationId: string, toStationId: string): string {
  const line = LINES[lineId];
  const fromIndex = line.stations.indexOf(fromStationId);
  const toIndex = line.stations.indexOf(toStationId);
  if (fromIndex === -1 || toIndex === -1) return line.stations[line.stations.length - 1];
  return fromIndex < toIndex ? STATIONS[line.stations[line.stations.length - 1]].name : STATIONS[line.stations[0]].name;
}

function shortestMetroPath(startStationId: string, endStationId: string): { stations: string[]; lines: string[]; distance: number; duration: number } | null {
  const queue: StateNode[] = [];
  const distMap = new Map<string, number>();
  const prevMap = new Map<string, { prevKey: string | null; station: string; line: string }>();

  const startStation = STATIONS[startStationId];
  const initialLines = startStation.lines;

  initialLines.forEach((line) => {
    const key = `${startStationId}|${line}`;
    distMap.set(key, INITIAL_WAIT_SECONDS);
    prevMap.set(key, { prevKey: null, station: startStationId, line });
    queue.push({ station: startStationId, line, cost: INITIAL_WAIT_SECONDS });
  });

  while (queue.length) {
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift()!;
    const currentKey = `${current.station}|${current.line}`;

    if (current.station === endStationId) {
      const stations: string[] = [];
      const lines: string[] = [];
      let walkKey: string | null = currentKey;

      while (walkKey) {
        const node = prevMap.get(walkKey);
        if (!node) break;
        stations.push(node.station);
        lines.push(node.line);
        walkKey = node.prevKey;
      }

      stations.reverse();
      lines.reverse();

      let railDistance = 0;
      for (let i = 0; i < stations.length - 1; i += 1) {
        const from = stations[i];
        const to = stations[i + 1];
        const edge = GRAPH[from].find((e) => e.to === to);
        if (edge) railDistance += edge.distance;
      }

      return {
        stations,
        lines,
        distance: railDistance,
        duration: current.cost,
      };
    }

    const neighbors = GRAPH[current.station] || [];
    neighbors.forEach((edge) => {
      const nextLine = edge.line;
      const transferPenalty = nextLine === current.line ? 0 : TRANSFER_PENALTY_SECONDS;
      const travelSeconds = edge.distance / METRO_SPEED_MPS + STOP_PENALTY_SECONDS;
      const nextCost = current.cost + transferPenalty + travelSeconds;
      const nextKey = `${edge.to}|${nextLine}`;

      if (!distMap.has(nextKey) || nextCost < (distMap.get(nextKey) || Infinity)) {
        distMap.set(nextKey, nextCost);
        prevMap.set(nextKey, { prevKey: currentKey, station: edge.to, line: nextLine });
        queue.push({ station: edge.to, line: nextLine, cost: nextCost });
      }
    });
  }

  return null;
}

function toCoord(stationId: string): Coord {
  return [STATIONS[stationId].lat, STATIONS[stationId].lng];
}

function appendCoord(geometry: Coord[], point: Coord) {
  if (!geometry.length) {
    geometry.push(point);
    return;
  }

  const last = geometry[geometry.length - 1];
  if (last[0] !== point[0] || last[1] !== point[1]) {
    geometry.push(point);
  }
}

function minutes(seconds: number): number {
  return Math.max(1, Math.round(seconds / 60));
}

export function useMetroRoute() {
  const [route, setRoute] = useState<MetroRouteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const clearRoute = useCallback(() => {
    setRoute(null);
    setError("");
  }, []);

  const calculateMetroRoute = useCallback(
    async (pois: POI[], userLocation: Coord | null): Promise<MetroRouteResult | null> => {
      if (!userLocation) {
        setError("metro_no_location");
        return null;
      }

      if (pois.length < 1) return null;

      const city = getMetroCityByLocation(userLocation);
      if (!city) {
        setError("metro_unavailable_city");
        return null;
      }

      setLoading(true);
      setError("");

      try {
        const orderedPois = [...pois];
        let current: Coord = userLocation;

        const geometry: Coord[] = [];
        const instructions: MetroInstruction[] = [];
        const legs: { distance: number; duration: number }[] = [];

        let totalMeters = 0;
        let totalSeconds = 0;

        appendCoord(geometry, current);

        for (let i = 0; i < orderedPois.length; i += 1) {
          const poi = orderedPois[i];
          const target: Coord = [poi.latitud, poi.longitud];

          const startNearest = nearestStation(current);
          const endNearest = nearestStation(target);

          if (!startNearest || !endNearest) {
            setError("metro_no_nearby_station");
            return null;
          }

          const metroPath = shortestMetroPath(startNearest.stationId, endNearest.stationId);
          if (!metroPath || metroPath.stations.length < 1) {
            setError("metro_no_path");
            return null;
          }

          const walkToBoardDistance = startNearest.distance;
          const walkToBoardSeconds = walkToBoardDistance / WALK_SPEED_MPS;
          totalMeters += walkToBoardDistance;
          totalSeconds += walkToBoardSeconds;

          instructions.push({
            type: "walk_to_board",
            station: STATIONS[startNearest.stationId].name,
            minutes: minutes(walkToBoardSeconds),
          });

          appendCoord(geometry, toCoord(startNearest.stationId));

          let segmentStartStation = metroPath.stations[0];
          let segmentLine = metroPath.lines[0];

          for (let j = 1; j < metroPath.stations.length; j += 1) {
            const prevStation = metroPath.stations[j - 1];
            const nextStation = metroPath.stations[j];
            const nextLine = metroPath.lines[j] || segmentLine;

            if (nextLine !== segmentLine) {
              const direction = lineDirection(segmentLine, segmentStartStation, prevStation);
              instructions.push({
                type: "board",
                line: segmentLine,
                station: STATIONS[segmentStartStation].name,
                direction,
              });
              instructions.push({
                type: "transfer",
                station: STATIONS[prevStation].name,
                line: nextLine,
              });
              segmentStartStation = prevStation;
              segmentLine = nextLine;
            }

            appendCoord(geometry, toCoord(nextStation));
          }

          const lastStation = metroPath.stations[metroPath.stations.length - 1];
          const finalDirection = lineDirection(segmentLine, segmentStartStation, lastStation);
          instructions.push({
            type: "board",
            line: segmentLine,
            station: STATIONS[segmentStartStation].name,
            direction: finalDirection,
          });

          totalMeters += metroPath.distance;
          totalSeconds += metroPath.duration;

          const walkToPoiDistance = endNearest.distance;
          const walkToPoiSeconds = walkToPoiDistance / WALK_SPEED_MPS;
          totalMeters += walkToPoiDistance;
          totalSeconds += walkToPoiSeconds;

          instructions.push({
            type: "exit_walk",
            station: STATIONS[endNearest.stationId].name,
            minutes: minutes(walkToPoiSeconds),
          });

          appendCoord(geometry, target);

          const legDistance = walkToBoardDistance + metroPath.distance + walkToPoiDistance;
          const legDuration = walkToBoardSeconds + metroPath.duration + walkToPoiSeconds;
          legs.push({ distance: legDistance, duration: legDuration });

          current = target;
        }

        const result: MetroRouteResult = {
          geometry: {
            type: "LineString",
            coordinates: geometry.map((p) => [p[1], p[0]]),
          },
          distancia_metros: totalMeters,
          duracion_segundos: totalSeconds,
          distancia_texto: formatDistance(totalMeters),
          duracion_texto: formatDuration(totalSeconds),
          orderedPois,
          legs,
          instructions,
          city: city.name,
        };

        setRoute(result);
        return result;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    route,
    loading,
    error,
    clearRoute,
    calculateMetroRoute,
  };
}
