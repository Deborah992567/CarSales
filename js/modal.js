/* ============================================================
   Cars NG — reservation modal + simulated checkout + forms
   ============================================================ */
(function () {
    'use strict';

    /* ---------- Reservation modal ---------- */
    const backdrop = document.getElementById('modalBackdrop');
    const closeBtn = document.getElementById('modalClose');
    const modalImg = document.getElementById('modalImg');
    const modalImgInt = document.getElementById('modalImgInt');
    const modalTitle = document.getElementById('modalTitle');
    const modalPrice = document.getElementById('modalPrice');
    const modalConfirm = document.getElementById('modalConfirm');

    const modalPay = document.getElementById('modalPay');
    const paySteps = {
        details: document.getElementById('payStepDetails'),
        card: document.getElementById('payStepCard'),
        spin: document.getElementById('payStepSpin'),
        done: document.getElementById('payStepDone'),
        receipt: document.getElementById('payStepReceipt'),
    };
    const payCar = document.getElementById('payCar');
    const payName = document.getElementById('payName');
    const payEmail = document.getElementById('payEmail');
    const payCard = document.getElementById('payCard');
    const payExp = document.getElementById('payExp');
    const payCvc = document.getElementById('payCvc');
    const payOrderNo = document.getElementById('payOrderNo');
    const payAmount = document.getElementById('payAmount');
    const payNext = document.getElementById('payNext');
    const paySubmit = document.getElementById('paySubmit');
    const payBack = document.getElementById('payBack');
    const payFinish = document.getElementById('payFinish');
    const payStatus = document.getElementById('payStatus');
    const payPayPal = document.getElementById('payPayPal');
    const payApple = document.getElementById('payApple');
    const receiptOrderNo = document.getElementById('receiptOrderNo');
    const rRef = document.getElementById('rRef');
    const rDate = document.getElementById('rDate');
    const rMethod = document.getElementById('rMethod');
    const rName = document.getElementById('rName');
    const rEmail = document.getElementById('rEmail');
    const rCar = document.getElementById('rCar');
    const rTotal = document.getElementById('rTotal');
    const receiptWm = document.getElementById('receiptWm');

    let lastTrigger = null;
    let payTimer = 0;

    const showStep = (name) => {
        Object.entries(paySteps).forEach(([k, el]) => { el.hidden = k !== name; });
        const focusEl = { details: payName, card: payCard, spin: null, done: payFinish }[name];
        if (focusEl) setTimeout(() => focusEl.focus(), 120);
        if (payStatus) {
            if (name === 'spin') payStatus.textContent = 'Authorising reservation…';
            else if (name === 'done') payStatus.textContent = 'Reservation confirmed.';
            else payStatus.textContent = '';
        }
    };

    const openModal = (btn) => {
        if (!backdrop) return;
        clearTimeout(payTimer);
        lastTrigger = btn;
        modalTitle.textContent = btn.dataset.buy;
        if (modalImg) modalImg.alt = btn.dataset.buy + ' exterior';
        if (modalImgInt) modalImgInt.alt = btn.dataset.buy + ' interior';
        modalPrice.textContent = btn.dataset.price.replace('$', '').replace(',', '');
        modalImg.src = btn.dataset.img;
        const int = btn.dataset.int;
        if (modalImgInt) {
            modalImgInt.src = int || '';
            modalImgInt.classList.toggle('is-hidden', !int);
            document.querySelectorAll('.modal-view-btn').forEach(b => {
                b.classList.toggle('is-active', b.dataset.view === 'ext');
            });
        }
        backdrop.classList.add('open');
        document.body.style.overflow = 'hidden';
        if (modalPay) modalPay.hidden = true;
        modalConfirm.style.display = '';
        if (closeBtn) closeBtn.focus();
    };

    /* trap Tab focus inside the open dialog so it cannot escape into the page */
    const focusables = () => Array.from(
        backdrop.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter(el => !el.disabled && el.offsetParent !== null);
    backdrop.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        const els = focusables();
        if (!els.length) return;
        const first = els[0], last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    document.addEventListener('click', (e) => {
        const buy = e.target.closest('[data-buy]');
        if (buy) openModal(buy);
    });
    document.querySelectorAll('[data-buy]').forEach(b => b.setAttribute('aria-haspopup', 'dialog'));
    /* icon-only buy buttons need a real accessible name + decorative SVG hidden */
    document.querySelectorAll('.btn-icon[data-buy]').forEach(b => {
        b.setAttribute('aria-label', 'Reserve ' + (b.dataset.buy || 'vehicle'));
        const svg = b.querySelector('svg');
        if (svg) svg.setAttribute('aria-hidden', 'true');
    });

    /* exterior / interior view switch inside the modal */
    const viewBtns = document.querySelectorAll('.modal-view-btn');
    viewBtns.forEach(btn => btn.addEventListener('click', () => {
        const showInt = btn.dataset.view === 'int';
        if (!showInt && !modalImgInt) return;
        viewBtns.forEach(b => b.classList.toggle('is-active', b === btn));
        if (modalImg) modalImg.classList.toggle('is-hidden', showInt);
        if (modalImgInt) modalImgInt.classList.toggle('is-hidden', !showInt);
    }));

    const closeModal = () => {
        if (!backdrop) return;
        clearTimeout(payTimer);
        backdrop.classList.remove('open');
        document.body.style.overflow = '';
        if (lastTrigger) lastTrigger.focus();
    };
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && backdrop && backdrop.classList.contains('open')) closeModal();
    });

    /* ---------- Simulated checkout ---------- */
    const formatCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
    const formatExp = (v) => {
        const d = v.replace(/\D/g, '').slice(0, 4);
        if (d.length < 3) return d;
        if (d.slice(2) === '00') return d.slice(0, 2) + '/01';
        if (d.length === 4 && +d.slice(0, 2) === 0) return '01/' + d.slice(2);
        return d.slice(0, 2) + '/' + d.slice(2);
    };
    if (payCard) payCard.addEventListener('input', () => { payCard.value = formatCard(payCard.value); });
    if (payExp) payExp.addEventListener('input', () => { payExp.value = formatExp(payExp.value); });

    const beginCheckout = () => {
        if (!modalPay || !payCar) return;
        payCar.textContent = modalTitle.textContent;
        const price = parseInt(modalPrice.textContent.replace(/,/g, ''), 10) || 0;
        if (payAmount) payAmount.textContent = '$' + Math.round(price * 0.1).toLocaleString();
        modalConfirm.style.display = 'none';
        modalPay.hidden = false;
        showStep('details');
    };
    if (modalConfirm) modalConfirm.addEventListener('click', beginCheckout);
    const mediaEl = document.querySelector('.modal-panel__media');
    if (mediaEl) mediaEl.addEventListener('click', (e) => {
        if (e.target.closest('.modal-view-btn')) return;   /* let the view toggle handle its own click */
        if (!modalPay.hidden && modalConfirm.style.display === 'none') return;
        beginCheckout();
    });

    if (payNext) payNext.addEventListener('click', () => {
        if (!payName.value.trim() || !payEmail.checkValidity()) {
            payName.reportValidity();
            payEmail.reportValidity();
            return;
        }
        showStep('card');
    });

    if (payBack) payBack.addEventListener('click', () => showStep('details'));

    if (paySubmit) paySubmit.addEventListener('click', () => {
        const card = payCard.value.replace(/\D/g, '');
        const exp = payExp.value.replace(/\D/g, '');
        const valid = card.length === 16 && exp.length === 4 && payCvc.value.replace(/\D/g, '').length >= 3;
        if (!valid) {
            payCard.reportValidity();
            payExp.reportValidity();
            payCvc.reportValidity();
            return;
        }
        showStep('spin');
        payTimer = setTimeout(() => showReceipt('Card'), 1900);
    });

    const showReceipt = (method) => {
        const ref = 'NG-' + Math.floor(100000 + Math.random() * 899999);
        const total = payAmount.textContent;
        payOrderNo.textContent = ref;
        if (receiptOrderNo) receiptOrderNo.textContent = ref;
        if (rRef) rRef.textContent = ref;
        if (rDate) rDate.textContent = new Date().toLocaleString();
        if (rMethod) rMethod.textContent = method;
        if (rName) rName.textContent = payName.value.trim() || '—';
        if (rEmail) rEmail.textContent = payEmail.value.trim() || '—';
        if (rCar) rCar.textContent = payCar.textContent || '—';
        if (rTotal) rTotal.textContent = total;
        if (receiptWm) receiptWm.textContent = 'CARS NG · ' + ref;
        showStep('receipt');
    };

    if (payFinish) payFinish.addEventListener('click', closeModal);

    /* wallet payments (PayPal / Apple Pay) reuse the authorisation flow */
    if (payPayPal) payPayPal.addEventListener('click', () => {
        if (!payName.value.trim() || !payEmail.checkValidity()) {
            payName.reportValidity();
            payEmail.reportValidity();
            return;
        }
        showStep('spin');
        payTimer = setTimeout(() => showReceipt('PayPal'), 1900);
    });
    if (payApple) payApple.addEventListener('click', () => {
        if (!payName.value.trim() || !payEmail.checkValidity()) {
            payName.reportValidity();
            payEmail.reportValidity();
            return;
        }
        showStep('spin');
        payTimer = setTimeout(() => showReceipt('Apple Pay'), 1900);
    });

    /* receipt actions */
    const receiptPrint = document.getElementById('receiptPrint');
    if (receiptPrint) receiptPrint.addEventListener('click', () => window.print());
    const receiptBack = document.getElementById('receiptBack');
    if (receiptBack) receiptBack.addEventListener('click', () => showStep('card'));

    /* ---------- Enquiry form ---------- */
    const form = document.getElementById('contactForm');
    if (form) form.addEventListener('submit', (e) => {
        e.preventDefault();
        document.getElementById('formOk').classList.add('show');
        form.reset();
        setTimeout(() => document.getElementById('formOk').classList.remove('show'), 4200);
    });

    /* ---------- Newsletter ---------- */
    const news = document.getElementById('newsForm');
    if (news) news.addEventListener('submit', (e) => {
        e.preventDefault();
        news.reset();
        const ok = document.getElementById('newsOk');
        if (ok) ok.classList.add('show');
        setTimeout(() => ok && ok.classList.remove('show'), 4200);
    });
})();