// Initialize AOS (Animate On Scroll)
document.addEventListener('DOMContentLoaded', function() {
    // Autoplay cho tất cả video (muted) — Safari / mobile
    document.querySelectorAll('video').forEach(function(v) {
        v.muted = true;
        v.setAttribute('muted', '');
        v.play().catch(function() {});
    });

    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        offset: 100,
        delay: 0
    });

    var galleryScroll = document.querySelector('.gallery-carousel__scroll');
    if (galleryScroll) {
        document.addEventListener('wheel', function(e) {
            if (!galleryScroll.contains(e.target)) return;
            if (e.deltaY === 0) return;
            var maxScroll = galleryScroll.scrollWidth - galleryScroll.clientWidth;
            if (maxScroll <= 0) return;
            e.preventDefault();
            e.stopPropagation();
            galleryScroll.scrollLeft += e.deltaY;
        }, { passive: false, capture: true });

        var isDown = false, startX, startScrollLeft;
        galleryScroll.addEventListener('mousedown', function(e) {
            if (e.button !== 0) return;
            isDown = true;
            galleryScroll.classList.add('grabbing');
            startX = e.pageX - galleryScroll.offsetLeft;
            startScrollLeft = galleryScroll.scrollLeft;
        });
        galleryScroll.addEventListener('mouseleave', function() {
            isDown = false;
            galleryScroll.classList.remove('grabbing');
        });
        galleryScroll.addEventListener('mouseup', function() {
            isDown = false;
            galleryScroll.classList.remove('grabbing');
        });
        galleryScroll.addEventListener('mousemove', function(e) {
            if (!isDown) return;
            e.preventDefault();
            var x = e.pageX - galleryScroll.offsetLeft;
            var walk = (x - startX) * 1.2;
            galleryScroll.scrollLeft = startScrollLeft - walk;
        });
    }

    // Autoplay khi vào viewport (acid_drop + acid_osmosis)
    function setupVideoAutoplay(video) {
        if (!video) return;
        video.muted = true;
        video.setAttribute('muted', '');
        function tryPlay() {
            video.muted = true;
            video.play().catch(function() {});
        }
        video.addEventListener('canplay', tryPlay);
        video.addEventListener('loadeddata', tryPlay);
        if (typeof IntersectionObserver !== 'undefined') {
            var io = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        video.muted = true;
                        video.play().catch(function() {});
                    }
                });
            }, { rootMargin: '20px', threshold: 0.25 });
            io.observe(video);
        } else {
            tryPlay();
        }
    }
    setupVideoAutoplay(document.getElementById('acid-drop-video'));
    setupVideoAutoplay(document.getElementById('acid-osmosis-video'));
});

// Back to Top Button
const backToTopButton = document.getElementById('backToTop');

// Show/hide back to top button based on scroll position
window.addEventListener('scroll', function() {
    if (window.pageYOffset > 300) {
        backToTopButton.classList.add('visible');
    } else {
        backToTopButton.classList.remove('visible');
    }
});

// Smooth scroll to top when button is clicked
backToTopButton.addEventListener('click', function() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Header scroll effect (optional enhancement)
let lastScroll = 0;
const header = document.querySelector('header');

window.addEventListener('scroll', function() {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll <= 0) {
        header.classList.remove('bg-white/80');
        header.classList.add('bg-transparent');
    } else {
        header.classList.remove('bg-transparent');
        header.classList.add('bg-white/80');
    }
    
    lastScroll = currentScroll;
});
