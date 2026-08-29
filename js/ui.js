/* ============================================================
   VELOCITY — UI bootstrap: preloader, progress bar, navbar state
   ============================================================ */
(function () {
    'use strict';

    /* Preloader */
    window.addEventListener('load', () => {
        const pre = document.getElementById('preloader');
        if (pre) setTimeout(() => pre.classList.add('done'), 700);
    });
    setTimeout(() => {
        const pre = document.getElementById('preloader');
        if (pre && !pre.classList.contains('done')) pre.classList.add('done');
    }, 3200);

    /* Scroll progress + navbar */
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
})();