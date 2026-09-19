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
  const approach = Math.max(0, cameraDepth(camera) - cameraDepth(index));
  const leaving = smoothstep((camera - index - 0.08) / 0.72);
  return {
    // The panel advances at the same rate as its station in the WebGL tunnel.
    // Once reached, its two halves slide out instead of crossing the camera.
    z: approach ? -approach * 26 : 0,
    y: 0,
    rotateX: 0,
    exit: leaving,
    entry: index === 0 ? 1 : smoothstep((camera - index + 0.55) / 0.45),
    opacity:
      distance < 0
        ? 1 - smoothstep((-distance - 0.55) / 0.42)
        : index === 1
          ? 0.26 + 0.74 * smoothstep((camera - 0.12) / 0.73)
          : 1 - smoothstep((distance - 0.35) / 0.55),
    interactive: Math.abs(distance) < 0.28 && leaving < 0.05,
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
