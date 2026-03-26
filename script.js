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

    // YouTube click-to-load (thumbnail + iframe injected on demand)
    function setupYouTubeClickToLoad() {
        var containers = document.querySelectorAll('[data-youtube-container]');
        if (!containers || containers.length === 0) return;

        containers.forEach(function(container) {
            var playBtn = container.querySelector('[data-youtube-play]');
            var target = container.querySelector('[data-youtube-target]');
            if (!playBtn || !target) return;

            playBtn.addEventListener('click', function() {
                // Prevent duplicate iframe injection.
                if (target.querySelector('iframe')) return;

                var videoId = container.getAttribute('data-youtube-id');
                var videoTitle = container.getAttribute('data-youtube-title') || 'YouTube video';
                if (!videoId) return;

                var iframe = document.createElement('iframe');
                iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(videoId);
                iframe.title = videoTitle;
                iframe.loading = 'lazy';
                iframe.frameBorder = '0';
                iframe.referrerPolicy = 'strict-origin-when-cross-origin';
                iframe.allowFullscreen = true;
                iframe.allow = 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
                iframe.className = 'w-full h-full block border-0';

                target.appendChild(iframe);
                // Enable interactions now that iframe exists.
                target.classList.remove('pointer-events-none');

                // Hide thumbnail placeholder after iframe is created.
                var placeholder = container.querySelector('[data-youtube-placeholder]');
                if (placeholder) placeholder.classList.add('hidden');
            });
        });
    }

    setupYouTubeClickToLoad();

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
