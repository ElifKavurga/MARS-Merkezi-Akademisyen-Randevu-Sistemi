# MARS Frontend

Merkezi Akademisyen Randevu Sistemi — React istemci uygulaması.

## Teknoloji Yığını

- React 19 + TypeScript
- Vite 8
- React Router 7
- Material UI 9
- TanStack React Query 5
- Axios
- React Hook Form + Zod
- React Icons

## Klasör Yapısı

```
src/
 ├── assets
 ├── components
 ├── pages
 ├── layouts
 ├── routes
 ├── hooks
 ├── services
 ├── types
 ├── contexts
 ├── utils
 ├── constants
 └── styles
```

## Kurulum

```bash
cp .env.example .env
npm install
```

## Çalıştırma

```bash
npm run dev      # http://localhost:5173
npm run build    # production build
npm run preview  # build önizleme
npm run lint
```

Backend API proxy: `/api` → `http://localhost:8080`

## Rotalar

| Yol | Sayfa |
|-----|--------|
| `/login` | Giriş (public) |
| `/dashboard` | Dashboard (korumalı iskelet) |
| `*` | 404 |

## Ortam Değişkenleri

| Değişken | Varsayılan | Açıklama |
|----------|------------|----------|
| `VITE_API_BASE_URL` | `/api` | Axios base URL |
