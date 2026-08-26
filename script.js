const languages = ['en', 'tr'];
const translationCache = new Map();
const darkMode = window.matchMedia('(prefers-color-scheme: dark)');

function storedValue(key, allowedValues) {
    try {
        const value = localStorage.getItem(key);
        return allowedValues.includes(value) ? value : null;
    } catch {
        return null;
    }
}

function storeValue(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch {
        // Preferences remain available for this page when storage is unavailable.
    }
}

const isLegalPage = document.body.classList.contains('legal-page');
let currentLanguage = isLegalPage
    ? document.documentElement.lang
    : storedValue('language', languages)
        || (navigator.language.toLowerCase().startsWith('tr') ? 'tr' : 'en');
let currentTheme = storedValue('theme', ['light', 'dark'])
    || (darkMode.matches ? 'dark' : 'light');
let languageRequest = 0;

function translationValue(source, path) {
    return path.split('.').reduce((value, key) => value?.[key], source);
}

async function translationsFor(language) {
    if (translationCache.has(language)) return translationCache.get(language);

    const response = await fetch(`translations/${language}.json`);
    if (!response.ok) throw new Error(`Translation request failed: ${response.status}`);

    const values = await response.json();
    translationCache.set(language, values);
    return values;
}

function applyTranslations(values) {
    document.querySelectorAll('[data-translate]').forEach(element => {
        const value = translationValue(values, element.dataset.translate);
        if (value) element.textContent = value;
    });

    document.querySelectorAll('[data-translate-aria]').forEach(element => {
        const value = translationValue(values, element.dataset.translateAria);
        if (value) element.setAttribute('aria-label', value);
    });

    document.querySelectorAll('[data-translate-alt]').forEach(element => {
        const value = translationValue(values, element.dataset.translateAlt);
        if (value) element.setAttribute('alt', value);
    });

    const title = translationValue(values, 'metadata.title');
    const description = translationValue(values, 'metadata.description');
    if (title) document.title = title;
    if (title) {
        document.querySelectorAll('meta[property="og:title"], meta[name="twitter:title"]').forEach(meta => {
            meta.setAttribute('content', title);
        });
    }
    if (description) {
        document.querySelector('meta[name="description"]')?.setAttribute('content', description);
        document.querySelectorAll('meta[property="og:description"], meta[name="twitter:description"]').forEach(meta => {
            meta.setAttribute('content', description);
        });
    }
}

function updateLocalizedAssets(language) {
    document.querySelectorAll('[data-app-store-badge]').forEach(image => {
        image.src = `resources/icons/${language}/appstore.svg`;
    });

    document.querySelectorAll('[data-screenshot]').forEach(image => {
        image.src = `resources/screenshots/${language}/${image.dataset.screenshot}`;
    });

    const links = {
        privacyLink: 'privacy-policy.html',
        termsLink: 'terms-of-service.html',
        kvkkLink: 'kvkk.html'
    };

    Object.entries(links).forEach(([id, page]) => {
        const link = document.getElementById(id);
        if (link) link.href = `content/${language}/${page}`;
    });
}

function updateLanguageControls(language) {
    document.querySelectorAll('[data-language]').forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.language === language));
    });
}

async function setLanguage(language, persist = true) {
    if (!languages.includes(language)) language = 'en';
    const request = ++languageRequest;

    try {
        const values = await translationsFor(language);
        if (request !== languageRequest) return;
        currentLanguage = language;
        applyTranslations(values);
    } catch (error) {
        if (request !== languageRequest) return;
        console.error(error);
        if (language !== 'en') return setLanguage('en', persist);
    }

    updateLocalizedAssets(currentLanguage);
    updateLanguageControls(currentLanguage);
    document.documentElement.lang = currentLanguage;
    if (persist) storeValue('language', currentLanguage);
    updateThemeControls();
}

function updateThemeControls() {
    const useLight = currentLanguage === 'tr' ? 'Açık görünümü kullan' : 'Use light appearance';
    const useDark = currentLanguage === 'tr' ? 'Koyu görünümü kullan' : 'Use dark appearance';

    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
        button.setAttribute('aria-label', currentTheme === 'dark' ? useLight : useDark);
        button.querySelector('.theme-symbol').textContent = currentTheme === 'dark' ? '☀︎' : '☾';
    });
}

function setTheme(theme, persist = true) {
    currentTheme = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = currentTheme;
    document.documentElement.style.colorScheme = currentTheme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
        'content',
        currentTheme === 'dark' ? '#0D1117' : '#F8FAFB'
    );
    if (persist) storeValue('theme', currentTheme);
    updateThemeControls();
}

function initNavigation() {
    const toggle = document.querySelector('.nav-toggle');
    const panel = document.getElementById('navPanel');
    if (!toggle || !panel) return;

    const close = () => {
        panel.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.addEventListener('click', () => {
        const opening = panel.hidden;
        panel.hidden = !opening;
        toggle.setAttribute('aria-expanded', String(opening));
    });

    panel.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !panel.hidden) {
            close();
            toggle.focus();
        }
    });
}

function initReveals() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const elements = document.querySelectorAll('[data-reveal]');
    if (!elements.length || !('IntersectionObserver' in window)) return;

    elements.forEach(element => element.classList.add('reveal-pending'));
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.14 });

    elements.forEach(element => observer.observe(element));
}

document.querySelectorAll('[data-language]').forEach(button => {
    button.addEventListener('click', () => setLanguage(button.dataset.language));
});

document.querySelectorAll('[data-theme-toggle]').forEach(button => {
    button.addEventListener('click', () => setTheme(currentTheme === 'dark' ? 'light' : 'dark'));
});

setTheme(currentTheme, false);
if (isLegalPage) {
    updateThemeControls();
} else {
    setLanguage(currentLanguage, false);
}
initNavigation();
initReveals();
