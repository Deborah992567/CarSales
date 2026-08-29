/* ============================================================
   Cars NG — custom cursor (dot + trailing ring)
   ============================================================ */
(function () {
    'use strict';

    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    if (!dot || !ring || !window.matchMedia('(hover:hover)').matches) return;

    const interactive = 'a, button, select, input, textarea, .car-card';
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;

    window.addEventListener('mousemove', (e) => {
        mx = e.clientX; my = e.clientY;
        dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    }, { passive: true });

    (function loopRing() {
        rx += (mx - rx) * .16;
        ry += (my - ry) * .16;
        ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
        requestAnimationFrame(loopRing);
    })();

    document.addEventListener('mouseover', (e) => {
        if (e.target.closest(interactive)) ring.classList.add('is-active');
    });
    document.addEventListener('mouseout', (e) => {
        if (e.target.closest(interactive)) ring.classList.remove('is-active');
    });
})();