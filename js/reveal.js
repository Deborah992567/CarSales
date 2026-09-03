/* ============================================================
   Cars NG — reveal helpers (static, no motion)
   ============================================================ */
(function () {
    'use strict';

    /* Revealed immediately — content is always visible */
    document.querySelectorAll('.reveal, .col-card').forEach(el => el.classList.add('in'));

    /* Stat counters — set final values statically */
    document.querySelectorAll('.stat__num').forEach(el => {
        const target = +el.dataset.count || 0;
        const suffix = el.dataset.suffix || '';
        el.textContent = target.toLocaleString() + suffix;
    });
})();
