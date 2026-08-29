/* ============================================================
   VELOCITY — reservation modal + enquiry form
   ============================================================ */
(function () {
    'use strict';

    /* Reservation modal */
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

    /* Esc closes the modal */
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && backdrop && backdrop.classList.contains('open')) closeModal();
    });

    /* Enquiry form */
    const form = document.getElementById('contactForm');
    if (form) form.addEventListener('submit', (e) => {
        e.preventDefault();
        document.getElementById('formOk').classList.add('show');
        form.reset();
        setTimeout(() => document.getElementById('formOk').classList.remove('show'), 4200);
    });
})();