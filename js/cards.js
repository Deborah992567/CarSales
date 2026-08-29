/* ============================================================
   VELOCITY — showroom cards: 3D tilt, glare, tap-reveal, filters
   ============================================================ */
(function () {
    'use strict';

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* 3D tilt + glare on car cards */
    if (!reduced) {
        document.querySelectorAll('.car-card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const r = card.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width;
                const py = (e.clientY - r.top) / r.height;
                const rx = (py - .5) * -12;
                const ry = (px - .5) * 14;
                card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
                card.style.setProperty('--gx', (px * 100) + '%');
                card.style.setProperty('--gy', (py * 100) + '%');
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }

    /* mobile: tap a card to preview the interior */
    if (window.matchMedia('(hover:none)').matches) {
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.car-card');
            if (!card) return;
            const open = card.classList.contains('hover');
            document.querySelectorAll('.car-card.hover').forEach(c => c.classList.remove('hover'));
            if (!open) card.classList.add('hover');
        });
    }

    /* colour + brand filtering */
    const colorFilter = document.getElementById('color-filter');
    const brandFilter = document.getElementById('brand-filter');
    const emptyState = document.getElementById('emptyState');
    const resetBtn = document.getElementById('resetFilters');
    const cols = document.querySelectorAll('.col-card');

    function filterCars() {
        const cf = colorFilter.value, bf = brandFilter.value;
        let visible = 0;
        cols.forEach(el => {
            const c = el.dataset.color, b = el.dataset.brand;
            const show = (cf === 'all' || cf === c) && (bf === 'all' || bf === b);
            el.style.display = show ? '' : 'none';
            if (show) {
                visible++;
                el.classList.remove('in');
                void el.offsetWidth;
                el.classList.add('in');
            }
        });
        if (emptyState) emptyState.classList.toggle('empty-state--show', visible === 0);
    }
    if (colorFilter) colorFilter.addEventListener('change', filterCars);
    if (brandFilter) brandFilter.addEventListener('change', filterCars);
    if (resetBtn) resetBtn.addEventListener('click', () => {
        colorFilter.value = 'all'; brandFilter.value = 'all'; filterCars();
    });
})();