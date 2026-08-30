// Lapisan primitif UI (docs/08 upgrade §6, Option A — nol dependensi baru).
// Ekspor bail untuk re-export pohon-shakeable: `import { Button, Input } from "@/components/ui"`.
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from "./Button";
export { IconButton, type IconButtonProps } from "./IconButton";
export { Input, type InputProps } from "./Input";
export { Textarea, type TextareaProps } from "./Textarea";
export { Label, type LabelProps } from "./Label";
export { Badge, type BadgeTone, type BadgeProps } from "./Badge";
export { Card, type CardProps } from "./Card";
export { Skeleton } from "./Skeleton";
export { Divider } from "./Divider";
export { Dialog, type DialogProps } from "./Dialog";
export { ConfirmButton, type ConfirmButtonProps } from "./ConfirmButton";
export { MotionBorder } from "./MotionBorder";
export { useDialogA11y } from "./useDialogA11y";
