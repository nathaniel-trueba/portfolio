console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const BASE_PATH =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "/"
    : "/portfolio/";

let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'contact/', title: 'Contact' },
  { url: 'resume/', title: 'Resume' },
  { url: 'https://github.com/nathaniel-trueba', title: 'GitHub' }
];

document.body.insertAdjacentHTML(
  'afterbegin',
  `
    <button class="theme-toggle" type="button">
      <svg class="icon icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4"></circle>
        <line x1="12" y1="2" x2="12" y2="4"></line>
        <line x1="12" y1="20" x2="12" y2="22"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="2" y1="12" x2="4" y2="12"></line>
        <line x1="20" y1="12" x2="22" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
      <svg class="icon icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    </button>
  `
);

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
    let url = p.url;
    let title = p.title;

    url = !url.startsWith('http') ? BASE_PATH + url : url;

    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;

    if (a.host === location.host && a.pathname === location.pathname) {
    a.classList.add('current');
    }

    if (a.host !== location.host) {
    a.target = '_blank';
    }

    nav.append(a);
    }


let themeToggle = document.querySelector('.theme-toggle');

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  document.documentElement.style.setProperty('color-scheme', theme);
  document.documentElement.dataset.theme = theme;
  themeToggle.setAttribute(
    'aria-label',
    theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
  );
}

let currentTheme = 'colorScheme' in localStorage ? localStorage.colorScheme : getSystemTheme();

applyTheme(currentTheme);

themeToggle.addEventListener('click', function () {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(currentTheme);
  localStorage.colorScheme = currentTheme;
});

if (!('colorScheme' in localStorage)) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (event) {
    if (!('colorScheme' in localStorage)) {
      currentTheme = event.matches ? 'dark' : 'light';
      applyTheme(currentTheme);
    }
  });
}

let form = document.querySelector('form');

form?.addEventListener('submit', function (event) {
  event.preventDefault();

  let data = new FormData(form);
  let params = [];

  for (let [name, value] of data) {
    params.push(`${name}=${encodeURIComponent(value)}`);
  }

  let url = form.action + '?' + params.join('&');
  location.href = url;
});

export async function fetchJSON(url) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  containerElement.innerHTML = '';

  for (let project of projects) {
    const article = document.createElement('article');
    article.innerHTML = `
      <${headingLevel}>${project.title}</${headingLevel}>
      <img src="${BASE_PATH}${project.image}" alt="${project.title}">
      <div class="project-body">
        <p>${project.description}</p>
        <p class="project-year"><em>${project.year}</em></p>
      </div>
    `;
    containerElement.appendChild(article);
  }
}
