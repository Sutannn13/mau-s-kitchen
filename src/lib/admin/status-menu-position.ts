const MENU_WIDTH_PX = 208;
const MENU_HEIGHT_ESTIMATE_PX = 360;
const VIEWPORT_GUTTER_PX = 12;
const TRIGGER_GAP_PX = 8;

interface TriggerRect {
  top: number;
  right: number;
  bottom: number;
}

interface ViewportSize {
  width: number;
  height: number;
}

export interface StatusMenuPosition {
  left: number;
  top?: number;
  bottom?: number;
  transformOrigin: "top right" | "bottom right";
}

// Satu overlay global cukup untuk daftar pesanan; ukur ulang bila desain menu
// berubah lebih tinggi dari estimasi ini.
export function getStatusMenuPosition(
  trigger: TriggerRect,
  viewport: ViewportSize,
): StatusMenuPosition {
  const maximumLeft = Math.max(
    VIEWPORT_GUTTER_PX,
    viewport.width - MENU_WIDTH_PX - VIEWPORT_GUTTER_PX,
  );
  const left = Math.min(
    Math.max(VIEWPORT_GUTTER_PX, trigger.right - MENU_WIDTH_PX),
    maximumLeft,
  );
  const spaceBelow = viewport.height - trigger.bottom - VIEWPORT_GUTTER_PX;
  const opensUp =
    spaceBelow < MENU_HEIGHT_ESTIMATE_PX && trigger.top > spaceBelow;

  if (opensUp) {
    return {
      left,
      bottom: viewport.height - trigger.top + TRIGGER_GAP_PX,
      transformOrigin: "bottom right",
    };
  }

  return {
    left,
    top: trigger.bottom + TRIGGER_GAP_PX,
    transformOrigin: "top right",
  };
}
