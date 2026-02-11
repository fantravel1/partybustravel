/**
 * PartyBusTravel.com — Main JavaScript
 * Handles: navigation, scroll effects, animations, FAQ, counters
 */

(function () {
    'use strict';

    // ===== DOM REFERENCES =====
    const header = document.getElementById('site-header');
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const mainNav = document.getElementById('main-nav');
    let mobileOverlay = null;

    // ===== HEADER SCROLL EFFECT =====
    function handleHeaderScroll() {
        if (!header) return;
        if (window.scrollY > 40) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', handleHeaderScroll, { passive: true });
    handleHeaderScroll();

    // ===== MOBILE MENU =====
    function createMobileOverlay() {
        if (mobileOverlay) return mobileOverlay;

        mobileOverlay = document.createElement('div');
        mobileOverlay.className = 'mobile-nav-overlay';
        mobileOverlay.id = 'mobile-overlay';

        // Clone navigation
        const navClone = mainNav.cloneNode(true);
        navClone.removeAttribute('id');

        // Add book now button
        const bookBtn = document.createElement('a');
        bookBtn.href = 'coming-soon.html';
        bookBtn.className = 'btn btn-primary';
        bookBtn.textContent = 'Book Now';

        mobileOverlay.appendChild(navClone);
        mobileOverlay.appendChild(bookBtn);

        // Close menu on link click
        mobileOverlay.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', closeMobileMenu);
        });

        document.body.appendChild(mobileOverlay);
        return mobileOverlay;
    }

    function openMobileMenu() {
        var overlay = createMobileOverlay();
        menuToggle.setAttribute('aria-expanded', 'true');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeMobileMenu() {
        if (!mobileOverlay) return;
        menuToggle.setAttribute('aria-expanded', 'false');
        mobileOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', function () {
            var isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
            if (isOpen) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });
    }

    // Close mobile menu on escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeMobileMenu();
    });


    // ===== SCROLL REVEAL ANIMATION =====
    function initScrollReveal() {
        var revealTargets = document.querySelectorAll(
            '.use-case-card, .step-card, .city-card, .pricing-card, ' +
            '.safety-checklist li, .faq-item, .gallery-item, ' +
            '.section-header, .safety-visual, .pricing-comparison'
        );

        revealTargets.forEach(function (el) {
            el.classList.add('reveal');
        });

        if (!('IntersectionObserver' in window)) {
            // Fallback: show everything
            revealTargets.forEach(function (el) {
                el.classList.add('visible');
            });
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    // Stagger animations for grid children
                    var parent = entry.target.parentElement;
                    if (parent) {
                        var siblings = parent.querySelectorAll('.reveal:not(.visible)');
                        var index = Array.prototype.indexOf.call(siblings, entry.target);
                        if (index >= 0) {
                            entry.target.style.transitionDelay = (index * 0.08) + 's';
                        }
                    }
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        revealTargets.forEach(function (el) {
            observer.observe(el);
        });
    }


    // ===== ANIMATED COUNTERS =====
    function initCounters() {
        var counters = document.querySelectorAll('.proof-number[data-count]');
        if (!counters.length) return;

        if (!('IntersectionObserver' in window)) {
            counters.forEach(function (counter) {
                counter.textContent = parseInt(counter.dataset.count, 10).toLocaleString();
            });
            return;
        }

        var observed = false;

        var observer = new IntersectionObserver(function (entries) {
            if (observed) return;
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    observed = true;
                    animateCounters(counters);
                    observer.disconnect();
                }
            });
        }, { threshold: 0.3 });

        counters.forEach(function (counter) {
            observer.observe(counter);
        });
    }

    function animateCounters(counters) {
        var duration = 2000;
        var startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            // Ease out cubic
            var eased = 1 - Math.pow(1 - progress, 3);

            counters.forEach(function (counter) {
                var target = parseInt(counter.dataset.count, 10);
                var current = Math.floor(eased * target);
                counter.textContent = current.toLocaleString();
            });

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        }

        requestAnimationFrame(step);
    }


    // ===== FAQ ACCORDION (only one open at a time) =====
    function initFaqAccordion() {
        var faqItems = document.querySelectorAll('.faq-item');

        faqItems.forEach(function (item) {
            item.addEventListener('toggle', function () {
                if (item.open) {
                    // Close other items in the same column
                    var column = item.parentElement;
                    if (column) {
                        column.querySelectorAll('.faq-item[open]').forEach(function (other) {
                            if (other !== item) other.open = false;
                        });
                    }
                }
            });
        });
    }


    // ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
            anchor.addEventListener('click', function (e) {
                var targetId = this.getAttribute('href');
                if (targetId === '#') return;

                var target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();
                    var headerHeight = header ? header.offsetHeight : 0;
                    var targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });

                    // Close mobile menu if open
                    closeMobileMenu();
                }
            });
        });
    }


    // ===== CITY SEARCH (typeahead hint) =====
    function initCitySearch() {
        var input = document.getElementById('city-search');
        if (!input) return;

        var cities = [
            'Las Vegas', 'Miami', 'Nashville', 'Austin', 'New Orleans',
            'New York', 'Los Angeles', 'Chicago', 'Toronto', 'Montreal',
            'San Diego', 'San Francisco', 'Atlanta', 'Dallas', 'Houston',
            'Phoenix', 'Denver', 'Seattle', 'Boston', 'Philadelphia',
            'Scottsdale', 'Savannah', 'Charleston', 'Memphis', 'Orlando',
            'Tampa', 'Minneapolis', 'Portland', 'Detroit', 'Charlotte',
            'San Antonio', 'Indianapolis', 'Columbus', 'Jacksonville',
            'Fort Lauderdale', 'Pittsburgh', 'St. Louis', 'Kansas City',
            'Milwaukee', 'Raleigh', 'Salt Lake City', 'Honolulu',
            'Ibiza', 'Cancun', 'London', 'Amsterdam', 'Barcelona',
            'Dublin', 'Prague', 'Berlin', 'Bangkok'
        ];

        input.addEventListener('input', function () {
            var value = this.value.trim().toLowerCase();
            if (value.length < 1) {
                this.placeholder = 'Enter your city...';
                return;
            }

            var match = cities.find(function (city) {
                return city.toLowerCase().startsWith(value);
            });

            if (match && match.toLowerCase() !== value) {
                this.setAttribute('data-suggestion', match);
            } else {
                this.removeAttribute('data-suggestion');
            }
        });

        // Tab to autocomplete
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Tab' && this.dataset.suggestion) {
                e.preventDefault();
                this.value = this.dataset.suggestion;
                this.removeAttribute('data-suggestion');
            }
        });
    }


    // ===== INITIALIZE =====
    function init() {
        initScrollReveal();
        initCounters();
        initFaqAccordion();
        initSmoothScroll();
        initCitySearch();
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
