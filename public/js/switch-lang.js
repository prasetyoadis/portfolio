// Fungsi untuk load file JSON
async function loadLanguage(lang) {
  try {
    const res = await fetch(`../public/lang/${lang}.json`);
    const translations = await res.json();

    Object.keys(translations).forEach(key => {
      const el = document.getElementById(key);
      if (el) el.innerHTML = translations[key];
    });

    localStorage.setItem('language', lang);
  } catch (err) {
    console.error('Error loading language:', err);
  }
}

// Pasang event listener ke semua link
document.querySelectorAll('#language-selector a').forEach(link => {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    const selectedLang = this.dataset.lang;
    // Hapus class aktif dari semua link
    document.querySelectorAll('#language-selector a').forEach(a => {
      a.parentElement.classList.remove('lang-active');
      if (a.dataset.lang != selectedLang) {
        document.querySelector('#language').classList.replace(`bg-lang-${a.dataset.lang}`, `bg-lang-${selectedLang}`)
      }
    });
    // Tambahkan class aktif ke link yang diklik
    this.parentElement.classList.add('lang-active');
    // document.querySelector('#language').classList.add(`bg-lang-${selectedLang})`);

    loadLanguage(selectedLang);
  });
});

// Load bahasa terakhir disimpan / default ke 'id'
const savedLang = localStorage.getItem('language') || 'id';
if (savedLang) {
  const activeLink = document.querySelector(`#language-selector a[data-lang="${savedLang}"]`);
  if (activeLink) activeLink.click();
}