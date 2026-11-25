/** `?meter` in the address shows the render meter (dev/RenderMeter.tsx) for phone checks. */
export const METER_ON = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('meter');
