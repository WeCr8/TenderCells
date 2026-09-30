// geo.ts - groundwork for GPS and real map overlays (docs/GPS_AND_MAP_OVERLAYS.md).
//
// A property is placed on the Earth by one anchor: the latitude / longitude of its top-left
// corner (property origin) and the compass bearing of its +x edge. With that, a robot's GPS fix
// (e.g. RTK, ~2 cm) becomes property feet, and map tiles or elevation data can be drawn under
// the layout. Over a yard (< 1 km) a local flat-earth projection is accurate to millimetres.
// Nothing here is wired to a provider yet; location stays on the owner's device.

/** Where the property sits on the Earth. */
export interface GeoAnchor {
  /** Latitude / longitude of the property origin (top-left corner), WGS84 degrees. */
  lat: number;
  lon: number;
  /** Compass bearing of the property's +x edge, degrees clockwise from true north (90 = east). */
  bearingDeg: number;
}

const EARTH_R_FT = 6_371_008.8 / 0.3048; // mean Earth radius in feet
const rad = (d: number) => (d * Math.PI) / 180;

/**
 * GPS fix -> property feet (x right, y down, origin top-left).
 *
 * @example
 *   toProperty({ lat: 45, lon: -122, bearingDeg: 90 }, 45, -121.9999) // ~{ x: 25.8, y: 0 }
 */
export function toProperty(a: GeoAnchor, lat: number, lon: number): { x: number; y: number } {
  const east = rad(lon - a.lon) * EARTH_R_FT * Math.cos(rad(a.lat));
  const north = rad(lat - a.lat) * EARTH_R_FT;
  const b = rad(a.bearingDeg);
  // +x runs along the bearing; +y (down the map) is 90 degrees clockwise from it.
  return { x: east * Math.sin(b) + north * Math.cos(b), y: east * Math.cos(b) - north * Math.sin(b) };
}

/** Property feet -> GPS (for map tiles and pins). Inverse of toProperty. */
export function toLatLon(a: GeoAnchor, x: number, y: number): { lat: number; lon: number } {
  const b = rad(a.bearingDeg);
  const east = x * Math.sin(b) + y * Math.cos(b);
  const north = x * Math.cos(b) - y * Math.sin(b);
  return { lat: a.lat + (north / EARTH_R_FT) * (180 / Math.PI), lon: a.lon + (east / (EARTH_R_FT * Math.cos(rad(a.lat)))) * (180 / Math.PI) };
}

/** Web-Mercator tile (x, y) holding a point at zoom z - what imagery providers serve. */
export function tileFor(lat: number, lon: number, z: number): { x: number; y: number; z: number } {
  const n = 2 ** z;
  const x = Math.floor(((lon + 180) / 360) * n);
  const y = Math.floor(((1 - Math.log(Math.tan(rad(lat)) + 1 / Math.cos(rad(lat))) / Math.PI) / 2) * n);
  return { x, y, z };
}

/** A fix is usable for driving only when it is precise enough to keep the boundary margin. */
export const fixGoodEnough = (accuracyFt: number, marginFt: number) => accuracyFt > 0 && accuracyFt <= marginFt / 2;
