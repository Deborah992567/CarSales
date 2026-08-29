/* ============================================================
   Cars NG — scroll reveal choreography, counters, parallax
   ============================================================ */
(function () {
    'use strict';

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Scroll reveal for headings, groups and the card columns */
    const revealEls = document.querySelectorAll('.reveal');
    const cardCols = document.querySelectorAll('.col-card');
    const io = new IntersectionObserver((entries) => {
        entries.forEach(en => {
            if (en.isIntersecting) {
                en.target.classList.add('in');
                io.unobserve(en.target);
            }
        });
    }, { threshold: .18, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
    cardCols.forEach(el => io.observe(el));

    /* anything already in viewport reveals immediately */
    revealEls.forEach(el => {
        if (el.getBoundingClientRect().top < innerHeight) {
            io.unobserve(el);
            el.classList.add('in');
        }
    });

    /* Animated stat counters */
    const counters = document.querySelectorAll('.stat__num');
    const cntIO = new IntersectionObserver((entries) => {
        entries.forEach(en => {
            if (!en.isIntersecting) return;
            const el = en.target;
            const target = +el.dataset.count || 0;
            const suffix = el.dataset.suffix || '';
            if (reduced) { el.textContent = target.toLocaleString() + suffix; return; }
            const dur = 1600, t0 = performance.now();
            (function tick(t) {
                const p = Math.min((t - t0) / dur, 1);
                const eased = 1 - Math.pow(1 - p, 4);
                el.textContent = Math.round(target * eased).toLocaleString() + suffix;
                if (p < 1) requestAnimationFrame(tick);
            })(t0);
            cntIO.unobserve(el);
        });
    }, { threshold: .5 });
    counters.forEach((el, i) => setTimeout(() => cntIO.observe(el), i * 120));

    /* About image parallax */
    if (!reduced) {
        const pImg = document.querySelector('.parallax');
        const pHolder = document.querySelector('.parallax-holder');
        if (pImg && pHolder) {
            window.addEventListener('scroll', () => {
                const r = pHolder.getBoundingClientRect();
                if (r.bottom < 0 || r.top > innerHeight) return;
                const mid = r.top + r.height / 2 - innerHeight / 2;
                pImg.style.transform = `translate3d(0, ${mid * .14}px, 0) scale(1.12)`;
            }, { passive: true });
        }
    }
})();