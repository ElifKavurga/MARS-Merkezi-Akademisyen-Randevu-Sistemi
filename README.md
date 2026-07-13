# MARS — Modern Akademisyen Randevu Sistemi

Üniversite akademisyen randevu yönetim sistemi.

## Repository Yapısı

```
mars/
 ├── docker-compose.yml   # PostgreSQL (dev)
 ├── mars-backend          # Spring Boot 3.5 / Java 21 API
 └── mars-frontend        # React + Vite + TypeScript UI
```

Her iki proje bağımsız çalışacak şekilde yapılandırılmıştır.

## Hızlı Başlangıç

### Backend (local — H2, DB gerekmez)

```bash
cd mars-backend
.\mvnw.cmd spring-boot:run
```

- API: `http://localhost:8080/api`
- Health: `http://localhost:8080/api/actuator/health`

### Backend (dev — PostgreSQL)

```bash
docker compose up -d
cd mars-backend
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev
```

### Frontend

```bash
cd mars-frontend
copy .env.example .env
npm install
npm run dev
```

- UI: `http://localhost:5173`

## Gereksinimler

| Bileşen    | Sürüm   |
|------------|---------|
| Java       | 21      |
| Node.js    | 20+     |
| PostgreSQL | 16+ (dev/prod) |
| Docker     | Opsiyonel (dev DB) |

## Docker

```bash
cp .env.example .env
docker compose up --build
```

| Servis | Adres |
|--------|--------|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8080/api |
| Health | http://localhost:8080/api/actuator/health |
| PostgreSQL | localhost:5432 |

Durdurmak için: `docker compose down`
