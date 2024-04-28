import type { Box } from "./box.svelte.js";
import { boxAutoReset } from "./boxAutoReset.svelte.js";
import { createEventHook } from "./createEventHook.svelte.js";
import { isElementOrSVGElement, isHTMLElement } from "./is.js";
import { executeCallbacks } from "./callbacks.js";
import { addEventListener } from "./events.js";
import type { Side } from "$lib/bits/utilities/floating-layer/useFloatingLayer.svelte.js";

export function useGraceArea(
	triggerNode: Box<HTMLElement | null>,
	contentNode: Box<HTMLElement | null>
) {
	const isPointerInTransit = boxAutoReset(false, 300);

	let pointerGraceArea = $state<Polygon | null>();
	const pointerExit = createEventHook<void>();

	function handleRemoveGraceArea() {
		pointerGraceArea = null;
		isPointerInTransit.value = false;
	}

	function handleCreateGraceArea(e: PointerEvent, hoverTarget: HTMLElement) {
		const currentTarget = e.currentTarget;
		if (!isHTMLElement(currentTarget)) return;
		const exitPoint = { x: e.clientX, y: e.clientY };
		const exitSide = getExitSideFromRect(exitPoint, currentTarget.getBoundingClientRect());
		const paddedExitPoints = getPaddedExitPoints(exitPoint, exitSide);
		const hoverTargetPoints = getPointsFromRect(hoverTarget.getBoundingClientRect());
		const graceArea = getHull([...paddedExitPoints, ...hoverTargetPoints]);
		pointerGraceArea = graceArea;
		isPointerInTransit.value = true;
	}

	$effect(() => {
		if (!triggerNode.value || !contentNode.value) return;
		const handleTriggerLeave = (e: PointerEvent) =>
			handleCreateGraceArea(e, contentNode.value!);
		const handleContentLeave = () => handleRemoveGraceArea();

		const unsub = executeCallbacks(
			addEventListener(triggerNode.value, "pointerleave", handleTriggerLeave),
			addEventListener(contentNode.value, "pointerleave", handleContentLeave)
		);

		return unsub;
	});

	$effect(() => {
		if (!pointerGraceArea) return;
		function handleTrackPointerGrace(e: PointerEvent) {
			if (!pointerGraceArea) return;
			const target = e.target;
			if (!isElementOrSVGElement(target)) return;
			const pointerPosition = { x: e.clientX, y: e.clientY };
			const hasEnteredTarget =
				triggerNode.value?.contains(target) || contentNode.value?.contains(target);
			const isPointerOutsideGraceArea = !isPointInPolygon(pointerPosition, pointerGraceArea);

			if (hasEnteredTarget) {
				handleRemoveGraceArea();
			} else if (isPointerOutsideGraceArea) {
				handleRemoveGraceArea();
				pointerExit.trigger();
			}
		}

		const unsub = addEventListener(document, "pointermove", handleTrackPointerGrace);

		return unsub;
	});

	return {
		isPointerInTransit,
		onPointerExit: pointerExit.on,
	};
}

type Point = { x: number; y: number };
type Polygon = Point[];

function getExitSideFromRect(point: Point, rect: DOMRect): Side {
	const top = Math.abs(rect.top - point.y);
	const bottom = Math.abs(rect.bottom - point.y);
	const right = Math.abs(rect.right - point.x);
	const left = Math.abs(rect.left - point.x);

	switch (Math.min(top, bottom, right, left)) {
		case left:
			return "left";
		case right:
			return "right";
		case top:
			return "top";
		case bottom:
			return "bottom";
		default:
			throw new Error("unreachable");
	}
}

function getPaddedExitPoints(exitPoint: Point, exitSide: Side, padding = 5) {
	const paddedExitPoints: Point[] = [];
	switch (exitSide) {
		case "top":
			paddedExitPoints.push(
				{ x: exitPoint.x - padding, y: exitPoint.y + padding },
				{ x: exitPoint.x + padding, y: exitPoint.y + padding }
			);
			break;
		case "bottom":
			paddedExitPoints.push(
				{ x: exitPoint.x - padding, y: exitPoint.y - padding },
				{ x: exitPoint.x + padding, y: exitPoint.y - padding }
			);
			break;
		case "left":
			paddedExitPoints.push(
				{ x: exitPoint.x + padding, y: exitPoint.y - padding },
				{ x: exitPoint.x + padding, y: exitPoint.y + padding }
			);
			break;
		case "right":
			paddedExitPoints.push(
				{ x: exitPoint.x - padding, y: exitPoint.y - padding },
				{ x: exitPoint.x - padding, y: exitPoint.y + padding }
			);
			break;
	}
	return paddedExitPoints;
}

function getPointsFromRect(rect: DOMRect) {
	const { top, right, bottom, left } = rect;
	return [
		{ x: left, y: top },
		{ x: right, y: top },
		{ x: right, y: bottom },
		{ x: left, y: bottom },
	];
}

// Determine if a point is inside of a polygon.
// Based on https://github.com/substack/point-in-polygon
function isPointInPolygon(point: Point, polygon: Polygon) {
	const { x, y } = point;
	let inside = false;
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const xi = polygon[i]!.x;
		const yi = polygon[i]!.y;
		const xj = polygon[j]!.x;
		const yj = polygon[j]!.y;

		// prettier-ignore
		const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
		if (intersect) inside = !inside;
	}

	return inside;
}

// Returns a new array of points representing the convex hull of the given set of points.
// https://www.nayuki.io/page/convex-hull-algorithm
function getHull<P extends Point>(points: Readonly<Array<P>>): Array<P> {
	const newPoints: Array<P> = points.slice();
	newPoints.sort((a: Point, b: Point) => {
		if (a.x < b.x) return -1;
		else if (a.x > b.x) return +1;
		else if (a.y < b.y) return -1;
		else if (a.y > b.y) return +1;
		else return 0;
	});
	return getHullPresorted(newPoints);
}

// Returns the convex hull, assuming that each points[i] <= points[i + 1]. Runs in O(n) time.
function getHullPresorted<P extends Point>(points: Readonly<Array<P>>): Array<P> {
	if (points.length <= 1) return points.slice();

	const upperHull: Array<P> = [];
	for (let i = 0; i < points.length; i++) {
		const p = points[i]!;
		while (upperHull.length >= 2) {
			const q = upperHull[upperHull.length - 1]!;
			const r = upperHull[upperHull.length - 2]!;
			if ((q.x - r.x) * (p.y - r.y) >= (q.y - r.y) * (p.x - r.x)) upperHull.pop();
			else break;
		}
		upperHull.push(p);
	}
	upperHull.pop();

	const lowerHull: Array<P> = [];
	for (let i = points.length - 1; i >= 0; i--) {
		const p = points[i]!;
		while (lowerHull.length >= 2) {
			const q = lowerHull[lowerHull.length - 1]!;
			const r = lowerHull[lowerHull.length - 2]!;
			if ((q.x - r.x) * (p.y - r.y) >= (q.y - r.y) * (p.x - r.x)) lowerHull.pop();
			else break;
		}
		lowerHull.push(p);
	}
	lowerHull.pop();

	if (
		upperHull.length === 1 &&
		lowerHull.length === 1 &&
		upperHull[0]!.x === lowerHull[0]!.x &&
		upperHull[0]!.y === lowerHull[0]!.y
	)
		return upperHull;
	else return upperHull.concat(lowerHull);
}