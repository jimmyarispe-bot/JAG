/** UX-003 — thin path to ActionChip (avoid feedback barrel to prevent cycles). */
export { ActionChip, CTAButton, ActionChipGroup } from "@/components/experience-system/feedback/ActionChip";
export type {
  ActionChipProps,
  ActionChipButtonProps,
  ActionChipLinkProps,
  ActionChipSize,
  ActionChipVariant,
} from "@/components/experience-system/feedback/ActionChip";
export {
  inferActionChipVariant,
  ACTION_CHIP_BASE,
  ACTION_CHIP_SIZE,
  ACTION_CHIP_VARIANT,
} from "@/components/experience-system/feedback/action-chip-styles";
