import type { APISchema } from "@/types";
import { asChild } from "./helpers";

export const root: APISchema = {
	title: "Root",
	description: "The root component used to set and manage the state of the alert dialog.",
	props: [
		{
			name: "preventScroll",
			default: "true",
			type: "boolean",
			description: "Whether or not to prevent scroll on the body when the alert dialog is open."
		},
		{
			name: "closeOnEscape",
			default: "true",
			type: "boolean",
			description: "Whether to close the alert dialog when the escape key is pressed."
		},
		{
			name: "closeOnOutsideClick",
			type: "boolean",
			default: "true",
			description: "Whether to close the alert dialog when a click occurs outside of it."
		},
		{
			name: "open",
			type: "boolean",
			default: "false",
			description: "Whether or not the alert dialog is open."
		},
		{
			name: "onOpenChange",
			type: "(open: boolean) => void",
			description: "A callback function called when the open state changes."
		}
	]
};

export const action: APISchema = {
	title: "Action",
	description: "A button used to close the alert dialog by taking an action.",
	props: [asChild]
};

export const cancel: APISchema = {
	title: "Cancel",
	description: "A button used to close the alert dialog without taking an action.",
	props: [asChild]
};

export const content: APISchema = {
	title: "Content",
	description: "The content displayed within the alert dialog modal.",
	props: [asChild],
	dataAttributes: [
		{
			name: "state",
			value: "'open' | 'closed'",
			description: "The state of the alert dialog."
		}
	]
};

export const title: APISchema = {
	title: "Title",
	description: "An accessibile title for the alert dialog.",
	props: [asChild]
};

export const description: APISchema = {
	title: "Description",
	description: "An accessibile description for the alert dialog.",
	props: [asChild]
};

export const trigger: APISchema = {
	title: "Trigger",
	description: "The element which opens the alert dialog on press.",
	props: [asChild]
};

export const overlay: APISchema = {
	title: "Overlay",
	description: "An overlay which covers the body when the alert dialog is open.",
	props: [asChild],
	dataAttributes: [
		{
			name: "state",
			value: "'open' | 'closed'",
			description: "The state of the alert dialog."
		}
	]
};

export const portal: APISchema = {
	title: "Portal",
	description: "A portal which renders the alert dialog into the body when it is open."
};

export const alertDialog = [
	root,
	trigger,
	content,
	overlay,
	portal,
	action,
	cancel,
	title,
	description
];