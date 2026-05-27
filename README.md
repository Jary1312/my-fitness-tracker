# My Fitness Tracker

Aplikacja PWA do śledzenia treningów i pomiarów ciała. Działa offline po zainstalowaniu.

## Struktura plików

```
my-fitness-tracker/
├── index.html          ← Punkt startowy aplikacji (plik HTML ładowany przez przeglądarkę)
├── package.json        ← Lista bibliotek potrzebnych do zbudowania projektu
├── vite.config.js      ← Konfiguracja narzędzia budującego + ustawienia PWA/offline
├── vercel.json         ← Instrukcje dla Vercel jak serwować aplikację
├── .gitignore          ← Lista plików pomijanych przez Git (np. node_modules)
├── public/
│   ├── manifest.json   ← Metadane aplikacji (nazwa, ikony, kolor) – potrzebne do instalacji
│   ├── icon-192.png    ← Ikona aplikacji 192x192px
│   ├── icon-512.png    ← Ikona aplikacji 512x512px
│   └── apple-touch-icon.png ← Ikona dla iPhone (ekran główny)
└── src/
    ├── main.jsx        ← Uruchamia React i montuje aplikację w index.html
    └── App.jsx         ← Cały kod aplikacji (komponenty, logika, style)
```

## Jak wdrożyć na Vercel (przez GitHub – bez komputera)

### Krok 1 – Utwórz konto GitHub
Wejdź na github.com w Safari i zarejestruj się (darmowe).

### Krok 2 – Utwórz nowe repozytorium
- Kliknij "+" → "New repository"
- Nazwa: my-fitness-tracker
- Zaznacz "Public"
- Zaznacz "Add a README file"
- Kliknij "Create repository"

### Krok 3 – Wgraj pliki
W repozytorium kliknij "Add file" → "Upload files".
Wgraj WSZYSTKIE pliki z tego ZIP zachowując strukturę folderów.

### Krok 4 – Połącz z Vercel
- Wejdź na vercel.com
- "Sign up" → "Continue with GitHub"
- "Add New Project" → wybierz swoje repozytorium
- Vercel automatycznie wykryje Vite
- Kliknij "Deploy"
- Po ~60 sekundach masz link np. my-fitness-tracker.vercel.app

### Krok 5 – Zainstaluj na iPhone
- Otwórz link w Safari (nie Chrome!)
- Dotknij ikony Udostępnij (kwadrat ze strzałką)
- Wybierz "Dodaj do ekranu głównego"
- Aplikacja działa teraz jak natywna – pełny ekran, własna ikona
- Przy braku internetu działa offline dzięki Service Worker

## Jak działa offline (PWA)

vite-plugin-pwa automatycznie generuje Service Worker podczas budowania.
Service Worker to skrypt działający w tle który:
1. Przy pierwszym uruchomieniu zapisuje całą aplikację w cache przeglądarki
2. Przy kolejnych uruchomieniach ładuje aplikację z cache – bez internetu
3. Dane treningowe zapisywane są w localStorage telefonu – też offline

## Dane użytkownika

Wszystkie dane (treningi, pomiary, ustawienia) są przechowywane w localStorage
przeglądarki/Safari na Twoim urządzeniu. Nikt inny nie ma do nich dostępu.
Dane NIE są wysyłane na żaden serwer.
