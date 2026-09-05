export interface ScreenRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

// Pure geometry keeps DOM lookup in the UI while making target choice testable.
export function findNearestVisibleRect<T extends ScreenRect>(
  source: ScreenRect,
  targets: readonly T[],
): T | null {
  let nearest: T | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const target of targets) {
    if (target.width <= 0 || target.height <= 0) {
      continue;
    }

    const deltaX =
      target.left + target.width / 2 - (source.left + source.width / 2);
    const deltaY =
      target.top + target.height / 2 - (source.top + source.height / 2);
    const distance = deltaX * deltaX + deltaY * deltaY;
    if (distance < nearestDistance) {
      nearest = target;
      nearestDistance = distance;
    }
  }

  return nearest;
}
