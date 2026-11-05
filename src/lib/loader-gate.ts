/** sessionStorage key for "the opening has been seen this session". */
export const OPENED_KEY = "cygnus-opened";

/**
 * Runs inline in <head>, before the first paint: a visitor who has already
 * seen the opening this session gets html[data-opened], so the veil never
 * paints (no flash before hydration). Kept outside the "use client" Loader so
 * the root layout (a server component) receives the string itself.
 */
export const LOADER_GATE = `try{if(sessionStorage.getItem("${OPENED_KEY}")==="1")document.documentElement.setAttribute("data-opened","")}catch(e){}`;
