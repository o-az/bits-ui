export { default as Root } from "./components/popover.svelte";
export { default as Arrow } from "./components/popover-arrow.svelte";
export { default as Content } from "./components/popover-content.svelte";
export { default as Trigger } from "./components/popover-trigger.svelte";
export { default as Close } from "./components/popover-close.svelte";

export type {
	PopoverRootProps as RootProps,
	PopoverArrowProps as ArrowProps,
	PopoverContentProps as ContentProps,
	PopoverTriggerProps as TriggerProps,
	PopoverCloseProps as CloseProps,
	PopoverTriggerEvents as TriggerEvents,
	PopoverCloseEvents as CloseEvents,
} from "./types.js";
