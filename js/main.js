/**
 * SQLGram Main JavaScript
 * Core functionality for the website
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize section animations
    initSectionAnimations();
    
    // Initialize smooth scrolling for anchor links
    initSmoothScrolling();
    
    // Update active navigation state
    updateActiveNavigation();
    
    // Initialize mobile menu behavior
    initMobileMenu();
    
    // Add ripple effect to buttons
    initButtonRippleEffect();
    
    // Check URL hash and scroll if needed
    checkUrlHash();
    
    // Initialize any tooltips
    initTooltips();
});

/**
 * Initialize animations for page sections
 */
function initSectionAnimations() {
    // Sections to animate when they come into view
    const sections = [
        '.hero', 
        '.features', 
        '.topics', 
        '.playground-preview', 
        '.about'
    ];
    
    // Initially check which sections are visible
    checkVisibleSections(sections);
    
    // Listen for scroll events
    window.addEventListener('scroll', function() {
        checkVisibleSections(sections);
    });
    
    // Animate feature and topic cards with staggered delay
    const cards = document.querySelectorAll('.feature-card, .topic-card');
    cards.forEach((card, index) => {
        // Add a delay based on the index
        setTimeout(() => {
            card.classList.add('fade-in');
        }, 100 * (index % 4)); // Reset the delay every 4 cards
    });
}

/**
 * Check which sections are visible and animate them
 * @param {Array} sections - CSS selectors for sections to check
 */
function checkVisibleSections(sections) {
    sections.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        
        elements.forEach(element => {
            if (isElementInViewport(element) && !element.classList.contains('active')) {
                element.classList.add('active');
            }
        });
    });
}

/**
 * Check if an element is in the viewport
 * @param {Element} el - The element to check
 * @returns {boolean} - True if element is in viewport
 */
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    
    return (
        rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.85 &&
        rect.bottom >= 0
    );
}

/**
 * Initialize smooth scrolling for anchor links
 */
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            // Only act on links to anchors on the same page
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                
                // Special case for # alone
                if (targetId === '#') {
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                    return;
                }
                
                const target = document.querySelector(targetId);
                
                if (target) {
                    // Account for fixed header
                    const headerOffset = 80;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Update URL hash without scrolling
                    history.pushState(null, null, targetId);
                }
            }
        });
    });
}

/**
 * Update active state in navigation based on current page/section
 */
function updateActiveNavigation() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    // First, handle active state based on URL path
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        
        // Handle links to other pages
        if (linkPath && !linkPath.startsWith('#')) {
            // Extract page name for comparison
            const currentPage = currentPath.split('/').pop() || 'index.html';
            const linkPage = linkPath.split('/').pop();
            
            if (currentPage === linkPage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        }
    });
    
    // For homepage, update active state based on scroll position
    if (currentPath.endsWith('index.html') || currentPath.endsWith('/')) {
        window.addEventListener('scroll', updateActiveNavOnScroll);
        // Initial check
        updateActiveNavOnScroll();
    }
}

/**
 * Update active navigation link based on scroll position
 */
function updateActiveNavOnScroll() {
    // Only apply to links that point to sections on current page
    const sectionLinks = Array.from(document.querySelectorAll('.navbar-nav .nav-link[href^="#"]'));
    
    // Get all sections
    const sections = sectionLinks.map(link => {
        const sectionId = link.getAttribute('href');
        return {
            id: sectionId,
            element: document.querySelector(sectionId),
            link: link
        };
    }).filter(section => section.element !== null); // Filter out non-existent sections
    
    // Find the section that's currently most visible
    let mostVisibleSection = null;
    let maxVisibility = 0;
    
    sections.forEach(section => {
        const rect = section.element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        
        // Calculate how much of the section is visible
        const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
        const visibility = Math.max(0, visibleHeight / rect.height);
        
        if (visibility > maxVisibility) {
            maxVisibility = visibility;
            mostVisibleSection = section;
        }
    });
    
    // Update active class
    if (mostVisibleSection) {
        sectionLinks.forEach(link => link.classList.remove('active'));
        mostVisibleSection.link.classList.add('active');
    }
}

/**
 * Initialize mobile menu behavior
 */
function initMobileMenu() {
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    
    if (navbarToggler && navbarCollapse) {
        // Close menu when clicking outside
        document.addEventListener('click', (event) => {
            const isClickInside = navbarToggler.contains(event.target) || navbarCollapse.contains(event.target);
            
            if (!isClickInside && navbarCollapse.classList.contains('show')) {
                // Close the menu
                const bsCollapse = new bootstrap.Collapse(navbarCollapse);
                bsCollapse.hide();
            }
        });
        
        // Close menu when a link is clicked (mobile)
        navbarCollapse.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if (navbarCollapse.classList.contains('show')) {
                    const bsCollapse = new bootstrap.Collapse(navbarCollapse);
                    bsCollapse.hide();
                }
            });
        });
    }
}

/**
 * Add ripple effect to buttons
 */
function initButtonRippleEffect() {
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
        button.addEventListener('mousedown', function(e) {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const circle = document.createElement('span');
            circle.classList.add('ripple');
            circle.style.left = `${x}px`;
            circle.style.top = `${y}px`;
            
            this.appendChild(circle);
            
            // Remove the span after animation completes
            setTimeout(() => {
                circle.remove();
            }, 600);
        });
    });
}

/**
 * Check URL hash and scroll to section if needed
 */
function checkUrlHash() {
    const hash = window.location.hash;
    
    if (hash && hash !== '#') {
        setTimeout(() => {
            const target = document.querySelector(hash);
            
            if (target) {
                // Account for fixed header
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        }, 300); // Small delay to ensure page is fully loaded
    }
}

/**
 * Initialize tooltips
 */
/**
 * Initialize tooltips
 */
function initTooltips() {
    // Initialize Bootstrap tooltips if jQuery is available
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
}

/**
 * Initialize progress bars
 */
function initProgressBars() {
    const progressBars = document.querySelectorAll('.progress-bar');
    progressBars.forEach(bar => {
        const targetWidth = bar.getAttribute('aria-valuenow') + '%';
        setTimeout(() => {
            bar.style.width = targetWidth;
        }, 500); // Small delay for animation effect
    });
}

/**
 * Handle form submissions
 */
function handleFormSubmissions() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            // Add your form handling logic here
            console.log('Form submitted:', this);
        });
    });
}

/**
 * Initialize custom dropdown behavior
 */
function initCustomDropdowns() {
    const dropdowns = document.querySelectorAll('.custom-dropdown');
    dropdowns.forEach(dropdown => {
        const button = dropdown.querySelector('.dropdown-toggle');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        button.addEventListener('click', (e) => {
            e.preventDefault();
            menu.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                menu.classList.remove('show');
            }
        });
    });
}

/**
 * Initialize lazy loading for images
 */
function initLazyLoading() {
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    const lazyLoadObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });
    
    lazyImages.forEach(img => lazyLoadObserver.observe(img));
}

/**
 * Handle dynamic content loading
 */
function handleDynamicContentLoading() {
    const dynamicContentContainers = document.querySelectorAll('[data-dynamic-content]');
    dynamicContentContainers.forEach(container => {
        const contentUrl = container.dataset.dynamicContent;
        fetch(contentUrl)
            .then(response => response.text())
            .then(html => {
                container.innerHTML = html;
                // Re-initialize any necessary functions for the new content
                initTooltips();
                initLazyLoading();
            })
            .catch(error => console.error('Error loading dynamic content:', error));
    });
}

/**
 * Initialize theme switcher
 */
function initThemeSwitcher() {
    const themeSwitcher = document.getElementById('theme-switcher');
    if (themeSwitcher) {
        themeSwitcher.addEventListener('change', function() {
            document.body.classList.toggle('dark-theme', this.checked);
            localStorage.setItem('dark-theme', this.checked);
        });
        
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('dark-theme');
        if (savedTheme === 'true') {
            themeSwitcher.checked = true;
            document.body.classList.add('dark-theme');
        }
    }
}

/**
 * Initialize scroll-to-top button
 */
function initScrollToTopButton() {
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 100) {
                scrollToTopBtn.classList.add('show');
            } else {
                scrollToTopBtn.classList.remove('show');
            }
        });
        
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// Call additional initialization functions
document.addEventListener('DOMContentLoaded', function() {
    initProgressBars();
    handleFormSubmissions();
    initCustomDropdowns();
    initLazyLoading();
    handleDynamicContentLoading();
    initThemeSwitcher();
    initScrollToTopButton();
});

// Export functions for use in other scripts if needed
export {
    initSectionAnimations,
    initSmoothScrolling,
    updateActiveNavigation,
    initMobileMenu,
    initButtonRippleEffect,
    checkUrlHash,
    initTooltips,
    initProgressBars,
    handleFormSubmissions,
    initCustomDropdowns,
    initLazyLoading,
    handleDynamicContentLoading,
    initThemeSwitcher,
    initScrollToTopButton
};

