// Translation system
let currentLanguage = localStorage.getItem('language') || 'en';
let translations = {};

// Load translations
async function loadTranslations(lang) {
    try {
        const response = await fetch(`translations/${lang}.json`);
        translations[lang] = await response.json();
        return translations[lang];
    } catch (error) {
        console.error(`Error loading translations for ${lang}:`, error);
        // Fallback to English if translation fails
        if (lang !== 'en') {
            return loadTranslations('en');
        }
        return {};
    }
}

// Get nested translation value
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Update page content with translations
function updatePageContent(translations) {
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(element => {
        const key = element.getAttribute('data-translate');
        const translation = getNestedValue(translations, key);
        if (translation) {
            if (element.tagName === 'INPUT' && element.type === 'submit') {
                element.value = translation;
            } else {
                element.textContent = translation;
            }
        }
    });
}

// Update translatable images
function updateTranslatableImages(lang) {
    const appStoreIcon = document.getElementById('appStoreIcon');
    const appStoreIcon2 = document.getElementById('appStoreIcon2');
    
    if (appStoreIcon) {
        appStoreIcon.src = `resources/icons/${lang}/appstore.svg`;
    }
    if (appStoreIcon2) {
        appStoreIcon2.src = `resources/icons/${lang}/appstore.svg`;
    }
}

// Update legal page links
function updateLegalPageLinks(lang) {
    const privacyLink = document.getElementById('privacyLink');
    const termsLink = document.getElementById('termsLink');
    const kvkkLink = document.getElementById('kvkkLink');
    
    if (privacyLink) {
        privacyLink.href = `content/${lang}/privacy-policy.html`;
    }
    if (termsLink) {
        termsLink.href = `content/${lang}/terms-of-service.html`;
    }
    if (kvkkLink) {
        kvkkLink.href = `content/${lang}/kvkk.html`;
    }
}

// Change language
async function changeLanguage(lang) {
    if (!translations[lang]) {
        await loadTranslations(lang);
    }
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    updatePageContent(translations[lang]);
    updateTranslatableImages(lang);
    updateLegalPageLinks(lang);
    document.documentElement.lang = lang;
    
    // Update language selector
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.value = lang;
    }
}

// Initialize translations
async function initTranslations() {
    // Load current language translations
    await loadTranslations(currentLanguage);
    
    // Preload other language
    const otherLang = currentLanguage === 'en' ? 'tr' : 'en';
    await loadTranslations(otherLang);
    
    // Update page content
    updatePageContent(translations[currentLanguage]);
    updateTranslatableImages(currentLanguage);
    updateLegalPageLinks(currentLanguage);
    document.documentElement.lang = currentLanguage;
    
    // Set language selector
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.value = currentLanguage;
        languageSelect.addEventListener('change', (e) => {
            changeLanguage(e.target.value);
        });
    }
}

// Mobile menu toggle
function initMobileMenu() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
        
        // Close menu when clicking on a link
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });
    }
}

// Smooth scroll for anchor links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href !== '') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const offsetTop = target.offsetTop - 80; // Account for fixed navbar
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}

// Navbar scroll effect
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            navbar.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
        }
        
        lastScroll = currentScroll;
    });
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initTranslations();
    initMobileMenu();
    initSmoothScroll();
    initNavbarScroll();
});

