/**
 * Animation Configuration
 * 
 * Centralized animation constants for consistent, smooth motion throughout the app.
 * Uses spring physics for natural, responsive animations.
 */

import { type Transition, type Variants } from 'framer-motion';

// ============================================================================
// SPRING PHYSICS TRANSITIONS
// ============================================================================

export const transitions = {
    /** Quick, responsive spring for micro-interactions */
    snappy: { type: "spring", stiffness: 500, damping: 35 } as Transition,

    /** Balanced spring for standard UI elements */
    smooth: { type: "spring", stiffness: 300, damping: 25 } as Transition,

    /** Soft spring for larger elements and modals */
    gentle: { type: "spring", stiffness: 200, damping: 20 } as Transition,

    /** Bouncy spring for playful elements */
    bouncy: { type: "spring", stiffness: 400, damping: 15 } as Transition,

    /** Fast linear for instant feedback */
    instant: { duration: 0.1, ease: "easeOut" } as Transition,
};

// ============================================================================
// REUSABLE ANIMATION VARIANTS
// ============================================================================

export const variants = {
    /** Simple fade in/out */
    fade: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
    } as Variants,

    /** Slide up with fade */
    slideUp: {
        initial: { y: 20, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: 20, opacity: 0 },
    } as Variants,

    /** Slide down with fade */
    slideDown: {
        initial: { y: -20, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: -20, opacity: 0 },
    } as Variants,

    /** Scale in/out with fade */
    scaleIn: {
        initial: { scale: 0.9, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.9, opacity: 0 },
    } as Variants,

    /** Pop in (slightly overshoot) */
    pop: {
        initial: { scale: 0.8, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.8, opacity: 0 },
    } as Variants,

    /** Slide from left */
    slideLeft: {
        initial: { x: -20, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: -20, opacity: 0 },
    } as Variants,

    /** Slide from right */
    slideRight: {
        initial: { x: 20, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: 20, opacity: 0 },
    } as Variants,
};

// ============================================================================
// STAGGER CONFIGURATIONS
// ============================================================================

export const stagger = {
    /** Fast stagger for lists */
    fast: {
        animate: {
            transition: { staggerChildren: 0.03 },
        },
    } as Variants,

    /** Standard stagger for cards */
    standard: {
        animate: {
            transition: { staggerChildren: 0.05 },
        },
    } as Variants,

    /** Slow stagger for dramatic reveals */
    slow: {
        animate: {
            transition: { staggerChildren: 0.1 },
        },
    } as Variants,
};

// ============================================================================
// INTERACTIVE FEEDBACK
// ============================================================================

export const interactive = {
    /** Standard button press feedback */
    tap: { scale: 0.95 },

    /** Subtle hover lift */
    hover: { scale: 1.02 },

    /** Stronger hover for emphasis */
    hoverStrong: { scale: 1.05 },

    /** Subtle press for small elements */
    tapLight: { scale: 0.98 },
};

// ============================================================================
// PRESET COMBINATIONS
// ============================================================================

export const presets = {
    /** Overlay/modal backdrop */
    backdrop: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: transitions.smooth,
    },

    /** Modal dialog */
    modal: {
        initial: { scale: 0.95, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.95, opacity: 0 },
        transition: transitions.smooth,
    },

    /** Sidebar panel */
    sidebar: {
        initial: { x: -20, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: -20, opacity: 0 },
        transition: transitions.smooth,
    },

    /** Tooltip/popover */
    tooltip: {
        initial: { opacity: 0, y: 4 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 4 },
        transition: transitions.snappy,
    },
};
