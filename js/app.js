/* ============================================================
   VELOCITY — entry point / loader
   Load order (classic scripts, run at end of body):
     1. ui.js       preloader, scroll progress, navbar state
     2. cursor.js   custom cursor
     3. reveal.js   scroll reveal, counters, parallax
     4. cards.js    3D tilt, tap-reveal, filters
     5. modal.js    reservation modal + form
   ============================================================ */
(function () {
    'use strict';
    if (window.VELOCITY_DEBUG) console.log('[VELOCITY] interactive layer loaded.');
})();