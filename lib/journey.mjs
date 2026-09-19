export const clamp = (value, min = 0, max = 1) =>
  Math.max(min, Math.min(max, value));
export const smoothstep = (value) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

// Follow native scrolling continuously; the magnetic controller provides the resting stops.
export function journeyState(scroll, travel, stations) {
  const progress = clamp(travel > 0 ? scroll / travel : 0);
  const position = progress * Math.max(0, stations - 1);
  const camera = position;
  return {
    progress,
    camera,
    active: Math.min(stations - 1, Math.floor(camera + 0.3)),
    darkness: smoothstep(camera / 0.85),
  };
}
export function panelPose(index, camera) {
  const distance = index - camera;
  return {
    z: -distance * 1800,
    y: distance < 0 ? distance * 420 : 0,
    rotateX: distance < 0 ? Math.max(-65, distance * 40) : 0,
    opacity:
      distance < 0
        ? 1 - smoothstep((-distance - 0.05) / 0.65)
        : 1 - smoothstep((distance - 0.25) / 0.5),
    interactive: Math.abs(distance) < 0.28,
  };
}

// Settle in the gesture direction, with a small tolerance around a readable stop.
export function snapStation(offset, travel, stations, direction) {
  if (travel <= 0 || stations < 2 || offset < 0 || offset > travel) return null;
  const position = (offset / travel) * (stations - 1);
  const nearest = Math.round(position);
  const index =
    Math.abs(position - nearest) < 0.08
      ? nearest
      : direction >= 0
        ? Math.ceil(position)
        : Math.floor(position);
  return (clamp(index, 0, stations - 1) / (stations - 1)) * travel;
}

// Exterior approach meets the existing interior trajectory exactly at station one.
export function cameraDepth(position) {
  const t = clamp(position);
  return position < 1 ? 54 - 66 * t : 8 - position * 20;
}

export function snapProgress(elapsed, duration) {
  const t = clamp(elapsed / duration);
  return t * t * t * (t * (t * 6 - 15) + 10);
}
