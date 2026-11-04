// @ts-check

/** @type {HTMLElement | null} */
const background = document.querySelector(".glass-background");

/** @type {MediaQueryList} */
const cursorMotion = window.matchMedia(
  "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)"
);

/** @returns {void} */
function resetBackground() {
  background?.style.removeProperty("--cursor-x");
  background?.style.removeProperty("--cursor-y");
}

window.addEventListener(
  "pointermove",
  /** @param {PointerEvent} event @returns {void} */
  (event) => {
    if (!background || !cursorMotion.matches || event.pointerType !== "mouse") return;

    /** @type {number} */
    const x = (event.clientX / window.innerWidth - 0.5) * 48;
    /** @type {number} */
    const y = (event.clientY / window.innerHeight - 0.5) * 36;

    background.style.setProperty("--cursor-x", `${x}px`);
    background.style.setProperty("--cursor-y", `${y}px`);
  },
  { passive: true }
);

document.documentElement.addEventListener("pointerleave", resetBackground);
window.addEventListener("blur", resetBackground);
cursorMotion.addEventListener("change", resetBackground);
