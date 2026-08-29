/* ============================================================
   VELOCITY — interactions, motion & 3D tilt
   ============================================================ */
(function () {
    'use strict';

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- Preloader ---------- */
    window.addEventListener('load', () => {
        const pre = document.getElementById('preloader');
        if (pre) setTimeout(() => pre.classList.add('done'), 700);
    });
    setTimeout(() => {
        const pre = document.getElementById('preloader');
        if (pre && !pre.classList.contains('done')) pre.classList.add('done');
    }, 3200);

    /* ---------- Scroll progress + navbar ---------- */
    const progress = document.getElementById('scrollProgress');
    const navbar = document.getElementById('navbar');
    const onScroll = () => {
        const h = document.documentElement;
        const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight);
        if (progress) progress.style.width = (scrolled * 100) + '%';
        if (navbar) navbar.classList.toggle('scrolled', h.scrollTop > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---------- Custom cursor ---------- */
    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    if (dot && ring && window.matchMedia('(hover:hover)').matches) {
        let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
        const interactive = 'a, button, select, input, textarea, .car-card';
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
    }

    /* ---------- Scroll reveal ---------- */
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

    /* run immediately for anything already in viewport */
    revealEls.forEach(el => { if (el.getBoundingClientRect().top < innerHeight) io.unobserve(el), el.classList.add('in'); });

    /* ---------- 3D tilt + glare on car cards ---------- */
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

    /* ---------- Filters ---------- */
    const colorFilter = document.getElementById('color-filter');
    const brandFilter = document.getElementById('brand-filter');
    const emptyState = document.getElementById('emptyState');
    const resetBtn = document.getElementById('resetFilters');
    const grid = document.getElementById('carsGrid');

    function filterCars() {
        const cf = colorFilter.value, bf = brandFilter.value;
        let visible = 0;
        cardCols.forEach(el => {
            const c = el.dataset.color, b = el.dataset.brand;
            const show = (cf === 'all' || cf === c) && (bf === 'all' || bf === b);
            el.style.display = show ? '' : 'none';
            if (show) {
                visible++;
                const idx = el.style.getPropertyValue('--i').trim() || '0';
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
    if (grid) grid.addEventListener('change', () => {});

    /* ---------- Animated counters ---------- */
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

    /* ---------- Parallax ---------- */
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

    /* ---------- Buy modal ---------- */
    const backdrop = document.getElementById('modalBackdrop');
    const closeBtn = document.getElementById('modalClose');
    const modalImg = document.getElementById('modalImg');
    const modalTitle = document.getElementById('modalTitle');
    const modalPrice = document.getElementById('modalPrice');
    const modalConfirm = document.getElementById('modalConfirm');

    const openModal = (btn) => {
        if (!backdrop) return;
        modalTitle.textContent = btn.dataset.buy;
        modalPrice.textContent = btn.dataset.price.replace('$', '').replace(',', '');
        modalImg.src = btn.dataset.img;
        backdrop.classList.add('open');
        document.body.style.overflow = 'hidden';
    };
    document.addEventListener('click', (e) => {
        const buy = e.target.closest('[data-buy]');
        if (buy) openModal(buy);
    });
    const closeModal = () => {
        if (!backdrop) return;
        backdrop.classList.remove('open');
        document.body.style.overflow = '';
    };
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });
    if (modalConfirm) modalConfirm.addEventListener('click', () => {
        modalConfirm.innerHTML = '<span>✓ Reserved — see you soon</span>';
        setTimeout(closeModal, 1200);
        setTimeout(() => modalConfirm.innerHTML = '<span>Confirm reservation</span>', 1600);
    });

    /* ---------- Contact form ---------- */
    const form = document.getElementById('contactForm');
    if (form) form.addEventListener('submit', (e) => {
        e.preventDefault();
        document.getElementById('formOk').classList.add('show');
        form.reset();
        setTimeout(() => document.getElementById('formOk').classList.remove('show'), 4200);
    });
})();