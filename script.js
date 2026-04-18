/* ============================================================
   Web Genius — Interactive Scripts
   Translation strings live in i18n-data.js (loaded before this).
   ============================================================ */

/* ----------------------------------------------------------
   i18n Engine
   ---------------------------------------------------------- */
let currentLang = 'en';

function setLanguage(lang) {
    currentLang = lang;
    const strings = i18n[lang];
    if (!strings) return;

    document.documentElement.lang = lang === 'lt' ? 'lt' : 'en';

    document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.dataset.i18n;
        if (strings[key]) {
            el.innerHTML = strings[key];
        }
    });

    // Update page title
    document.title = lang === 'lt'
        ? 'Web Genius — AI ir programavimo akademija vaikams'
        : 'Web Genius — AI & Coding Academy for Kids';

    // Persist preference
    localStorage.setItem('wg_lang', lang);
}

/* ----------------------------------------------------------
   DOM Ready
   ---------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {

    /* --------------------------------------------------------
       1. Scroll-reveal (Intersection Observer)
       -------------------------------------------------------- */
    const reveals = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15 }
    );
    reveals.forEach((el) => revealObserver.observe(el));

    /* --------------------------------------------------------
       2. Navbar scroll effect
       -------------------------------------------------------- */
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 40);
    });

    /* --------------------------------------------------------
       3. Mobile hamburger menu
       -------------------------------------------------------- */
    // Mobile Menu
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('open');
            hamburger.classList.toggle('active', isOpen);
            hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        // Close mobile menu when a link is clicked
        document.querySelectorAll('.nav-links a').forEach((link) => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
                hamburger.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            });
        });
    }

    /* --------------------------------------------------------
       4. Region / Language switcher (in navbar)
       -------------------------------------------------------- */
    const regionBtns = document.querySelectorAll('.region-switcher button');
    regionBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            regionBtns.forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            setLanguage(btn.dataset.region);
        });
    });

    // Restore saved language preference or auto-detect
    let savedLang = localStorage.getItem('wg_lang');

    // If no preference saved, detect browser language
    if (!savedLang) {
        const userLang = navigator.language || navigator.userLanguage;
        if (userLang && userLang.startsWith('lt')) {
            savedLang = 'lt';
        }
    }

    if (savedLang && savedLang !== 'en') {
        const targetBtn = document.querySelector(`.region-switcher button[data-region="${savedLang}"]`);
        if (targetBtn) {
            regionBtns.forEach((b) => b.classList.remove('active'));
            targetBtn.classList.add('active');
            setLanguage(savedLang);
        }
    }

    /* --------------------------------------------------------
       5. Smooth-scroll for anchor links
       -------------------------------------------------------- */
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    /* --------------------------------------------------------
       6. Stagger animation for cards
       -------------------------------------------------------- */
    const staggerItems = document.querySelectorAll('.path-card, .review-card, .timeline-item');
    staggerItems.forEach((item, i) => {
        item.style.transitionDelay = `${i * 0.1}s`;
    });

    /* --------------------------------------------------------
       7. Registration Modal Logic
       -------------------------------------------------------- */
    const modal = document.getElementById('regModal');
    const openBtns = document.querySelectorAll('a[href="#"], .btn-primary, .nav-cta, .btn-secondary'); // Broad selector, filter inside
    const closeBtn = document.getElementById('closeModal');
    const regForm = document.getElementById('regForm');
    const cohortSelect = document.getElementById('cohort');

    // Filter which buttons open the modal (specifically "Apply" or "Join" related, excluding nav anchors)
    // Actually, let's target specific buttons for clarity if possible, or check text content
    // For now, attaching to all "Join the Live Academy" or "Apply Now" buttons
    // The HTML has `data-i18n` attributes we can use, or just class references if specific.
    // The hero buttons are: .btn-primary, .btn-secondary. The values are "Join the Live Academy" etc.

    // Helper to open modal
    async function openModal(type = 'fixed') {
        if (!modal) return;
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden'; // prevent background scrolling
        const firstInput = modal.querySelector('input:not([type="hidden"])');
        if (firstInput) setTimeout(() => firstInput.focus(), 100);

        const productTypeInput = document.getElementById('productType');
        if (productTypeInput) productTypeInput.value = type;

        const cohortGroup = document.getElementById('cohortGroup');
        if (type === 'explorer') {
            if (cohortGroup) cohortGroup.style.display = 'none';
            if (cohortSelect) cohortSelect.removeAttribute('required');
        } else {
            if (cohortGroup) cohortGroup.style.display = 'block';
            if (cohortSelect) cohortSelect.setAttribute('required', 'required');
        }

        // Update Modal Title based on type
        const titleEl = modal.querySelector('h3[data-i18n="modal.title"]');
        const subEl = modal.querySelector('p[data-i18n="modal.subtitle"]');

        if (type === 'recurring') {
            if (titleEl) titleEl.innerText = currentLang === 'lt' ? 'Registracija į Kūrėjų Klubą' : 'Join the Creators Club';
            if (subEl) subEl.innerText = currentLang === 'lt' ? 'Savaitiniai užsiėmimai absolventams.' : 'Weekly sessions for academy graduates.';
        } else if (type === 'explorer') {
            if (titleEl) titleEl.innerText = currentLang === 'lt' ? 'Registruotis į Savarankiškus Kursus' : 'Register for Self-Paced Courses';
            if (subEl) subEl.innerText = currentLang === 'lt' ? 'Gaukite prieigą prie video bibliotekos.' : 'Get access to our video library.';
        } else {
            if (titleEl) titleEl.innerText = i18n[currentLang]['modal.title'];
            if (subEl) subEl.innerText = i18n[currentLang]['modal.subtitle'];
        }

        // Always reload options to filter correctly
        cohortSelect.innerHTML = '<option disabled selected>Loading...</option>';

        // Fetch upcoming cohorts
        if (true) {
            try {
                // Use the global getCohorts from supabase.js if available, or direct query
                const { data: cohorts, error } = await window.WebGeniusDB.supabase
                    .from('cohorts')
                    .select('*')
                    .or('status.eq.upcoming,status.eq.active')
                    .order('starts_at', { ascending: true });

                if (error) throw error;

                const byType = (c) => type === 'recurring' ? c.is_recurring === true : !c.is_recurring;
                const isActive = (c) => c.status === 'upcoming' || c.status === 'active';
                const all = (cohorts || []).filter((c) => isActive(c) && byType(c));

                // Prefer cohorts in current language; fall back to any language if none match
                let upcoming = all.filter((c) => (c.language || 'en') === currentLang);
                let usedFallback = false;
                if (upcoming.length === 0 && all.length > 0) {
                    upcoming = all;
                    usedFallback = true;
                }

                cohortSelect.innerHTML = '';

                const placeholder = document.createElement('option');
                placeholder.value = '';
                placeholder.text = (i18n[currentLang] && i18n[currentLang]['modal.select_placeholder']) || 'Select Cohort';
                placeholder.disabled = true;
                placeholder.selected = true;
                cohortSelect.appendChild(placeholder);

                if (upcoming.length === 0) {
                    const opt = document.createElement('option');
                    opt.text = currentLang === 'lt' ? 'Šiuo metu nėra atvirų grupių — susisiekite su mumis' : 'No open cohorts right now — contact us';
                    opt.disabled = true;
                    cohortSelect.appendChild(opt);
                } else {
                    if (usedFallback) {
                        const note = document.createElement('option');
                        note.text = currentLang === 'lt' ? '— rodomos visos kalbos —' : '— showing all languages —';
                        note.disabled = true;
                        cohortSelect.appendChild(note);
                    }
                    upcoming.forEach(c => {
                        const opt = document.createElement('option');
                        opt.value = c.id;

                        let label = c.name;
                        if (c.is_recurring && c.schedule_pattern) {
                            const days = c.schedule_pattern.days ? c.schedule_pattern.days.join(', ') : '';
                            const time = c.schedule_pattern.time || '';
                            const dayTrans = currentLang === 'lt' ? translateDays(days) : days;
                            label += ` (${dayTrans} ${time})`;
                        } else {
                            const date = new Date(c.starts_at).toLocaleDateString(currentLang === 'lt' ? 'lt-LT' : 'en-US');
                            label += ` (${date})`;
                        }

                        opt.text = label;
                        cohortSelect.appendChild(opt);
                    });
                }
            } catch (err) {
                console.error('Error loading cohorts:', err);
                cohortSelect.innerHTML = `<option disabled>${currentLang === 'lt' ? 'Klaida kraunant grupes' : 'Error loading cohorts'}</option>`;
            }
        }
    }

    function translateDays(dayStr) {
        const map = {
            'Monday': 'Pirmadienis',
            'Tuesday': 'Antradienis',
            'Wednesday': 'Trečiadienis',
            'Thursday': 'Ketvirtadienis',
            'Friday': 'Penktadienis',
            'Saturday': 'Šeštadienis',
            'Sunday': 'Sekmadienis'
        };
        // Simple replace for single days, might need split/join for multiple
        return map[dayStr] || dayStr;
    }

    // Attach to specific elements
    // Attach to Live Academy Buttons (using event delegation for dynamic links like the promo banner)
    document.addEventListener('click', (e) => {
        const target = e.target.closest('.nav-cta, .hero-buttons .btn-primary, .path-card.recommended .btn-primary, .cta-banner .btn-white');
        if (target) {
            e.preventDefault();
            openModal('fixed');
        }
    });

    // Attach to Creators Club Button (Specific)
    const recurringBtn = document.getElementById('btn-recurring');
    if (recurringBtn) {
        recurringBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('recurring');
        });
    }

    // Attach to Explorer Button
    const explorerBtn = document.getElementById('btn-explorer');
    if (explorerBtn) {
        explorerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Open modal with specific 'explorer' context if needed, or just 'fixed' for now
            // The user prompt implied just wiring it up. 
            // We'll pass 'explorer' to maybe customize title later or just treat as fixed.
            openModal('explorer');
        });
    }

    // Also "Get Started" on Explorer card? The prompt says "Ateities kūrėjas" (Future Creator). 
    // Explorer is self-paced. Logic might differ. 
    // User request: "I want to add email forms for registering to the Ateities kūrėjas courses... when they want to register to the academy."
    // So specifically for Future Creator (Live Academy).
    // The selector above covers `.path-card.recommended .btn-primary` which is Future Creator.
    // `.hero-buttons .btn-primary` is "Join the Live Academy".
    // `.nav-cta` is "Join Live Academy".
    // `.cta-banner .btn-white` is "Apply to the Live Academy".
    // Matches perfectly.

    function closeModal() {
        if (!modal) return;
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    // Close on outside click
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
            closeModal();
        }
    });

    // Per-field validation + error display helpers
    function tr(key, fallback) {
        return (i18n[currentLang] && i18n[currentLang][key]) || fallback;
    }
    function setFieldError(fieldId, msg) {
        const input = document.getElementById(fieldId);
        const err = document.getElementById('err-' + fieldId);
        if (!input) return;
        if (msg) {
            input.setAttribute('aria-invalid', 'true');
            if (err) err.textContent = msg;
        } else {
            input.setAttribute('aria-invalid', 'false');
            if (err) err.textContent = '';
        }
    }
    function validateField(fieldId) {
        const el = document.getElementById(fieldId);
        if (!el) return true;
        const val = (el.type === 'checkbox' ? el.checked : (el.value || '').trim());
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRe = /^[+\d][\d\s\-().]{5,29}$/;
        let msg = '';
        if (fieldId === 'name' && (!val || val.length < 2)) msg = tr('err.name', 'Enter a valid name');
        else if (fieldId === 'email' && !emailRe.test(val)) msg = tr('err.email', 'Enter a valid email');
        else if (fieldId === 'phone' && val && !phoneRe.test(val)) msg = tr('err.phone', 'Enter a valid phone');
        else if (fieldId === 'cohort' && el.hasAttribute('required') && !val) msg = tr('err.cohort', 'Please select a cohort');
        else if (fieldId === 'consent' && !val) msg = tr('err.consent', 'Parental consent required');
        setFieldError(fieldId, msg);
        return !msg;
    }

    // Attach blur listeners for live validation
    ['name', 'email', 'phone', 'cohort'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('blur', () => validateField(id));
    });
    const consentEl = document.getElementById('consent');
    if (consentEl) consentEl.addEventListener('change', () => validateField('consent'));

    // Async "email already registered" check — uses the SECURITY DEFINER RPC
    let emailCheckTimer = null;
    const emailEl = document.getElementById('email');
    if (emailEl) {
        emailEl.addEventListener('blur', async () => {
            const val = emailEl.value.trim();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return;
            clearTimeout(emailCheckTimer);
            emailCheckTimer = setTimeout(async () => {
                try {
                    const cohortVal = document.getElementById('cohort').value || null;
                    const { data, error } = await window.WebGeniusDB.supabase
                        .rpc('check_email_registered', { p_email: val, p_cohort_id: cohortVal });
                    if (error) return; // silently skip on error — server will catch dupes
                    if (data === true) {
                        setFieldError('email', currentLang === 'lt'
                            ? 'Šis el. paštas jau registruotas šiai grupei.'
                            : 'This email is already registered for this cohort.');
                    }
                } catch (_) { /* ignore — don't block submission on network hiccup */ }
            }, 300);
        });
    }

    // Classify supabase errors into user-friendly messages
    function friendlyError(err) {
        if (!err) return tr('err.generic', 'Something went wrong.');
        const msg = (err.message || '').toLowerCase();
        if (msg.includes('failed to fetch') || msg.includes('network')) return tr('err.network', 'Network error.');
        if (msg.includes('duplicate') || err.code === '23505') {
            return currentLang === 'lt' ? 'Ši el. pašto/telefono kombinacija jau registruota.' : 'This email/phone is already registered.';
        }
        return tr('err.generic', 'Something went wrong.');
    }

    // Handle Form Submission
    if (regForm) {
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('regSubmit');
            if (btn.disabled) return;

            // Validate all fields
            const fields = ['name', 'email', 'phone', 'consent'];
            if (document.getElementById('cohort').hasAttribute('required')) fields.push('cohort');
            const allValid = fields.map(validateField).every(Boolean);
            if (!allValid) {
                const firstInvalid = regForm.querySelector('[aria-invalid="true"]');
                if (firstInvalid) firstInvalid.focus();
                return;
            }

            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.setAttribute('aria-busy', 'true');
            btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> …';

            const payload = {
                name: document.getElementById('name').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                email: document.getElementById('email').value.trim(),
                cohort_id: document.getElementById('cohort').value || null,
                product_type: (document.getElementById('productType') || {}).value || 'fixed',
                children_count: (document.getElementById('childrenCount') || {}).value || null,
                consent_given: document.getElementById('consent').checked,
                user_agent: (navigator.userAgent || '').slice(0, 500),
            };

            try {
                const { error } = await window.WebGeniusDB.supabase
                    .from('course_registrations')
                    .insert(payload);
                if (error) throw error;

                if (typeof fbq === 'function') fbq('track', 'CompleteRegistration');

                btn.innerHTML = tr('modal.success', 'Success!');
                btn.classList.add('btn-success');
                setTimeout(() => {
                    closeModal();
                    regForm.reset();
                    ['name', 'email', 'phone', 'cohort', 'consent'].forEach((id) => setFieldError(id, ''));
                    btn.disabled = false;
                    btn.removeAttribute('aria-busy');
                    btn.classList.remove('btn-success');
                    btn.innerHTML = originalText;
                }, 2000);
            } catch (err) {
                console.error('Registration error:', err);
                btn.innerHTML = friendlyError(err);
                setTimeout(() => {
                    btn.disabled = false;
                    btn.removeAttribute('aria-busy');
                    btn.innerHTML = originalText;
                }, 3500);
            }
        });
    }

});


// --- MOBILE STICKY CTA SCRIPT ---
document.addEventListener("DOMContentLoaded", () => {
    const stickyCta = document.getElementById("mobileStickyCta");
    const heroSection = document.getElementById("hero");
    const pathsSection = document.getElementById("paths");

    if (stickyCta && heroSection && pathsSection) {
        const handleScroll = () => {
            // Only run on mobile/tablet
            if (window.innerWidth <= 768) {
                // Show CTA after scrolling past the hero section
                const heroBottom = heroSection.getBoundingClientRect().bottom;

                // Hide CTA when we reach the actual pricing area to avoid double buttons
                const pathsTop = pathsSection.getBoundingClientRect().top;
                const pathsBottom = pathsSection.getBoundingClientRect().bottom;

                // We want it visible between the hero and the pricing cards (or after them)
                if (heroBottom < 0 && (pathsTop > window.innerHeight || pathsBottom < 0)) {
                    stickyCta.classList.add("visible");
                } else {
                    stickyCta.classList.remove("visible");
                }
            } else {
                stickyCta.classList.remove("visible");
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        window.addEventListener("resize", handleScroll);
    }
});
