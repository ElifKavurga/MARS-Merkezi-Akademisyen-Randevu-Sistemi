# MARS Backend

Modern Akademisyen Randevu Sistemi — Spring Boot API katmanı.

## Teknoloji Yığını

- Java 21
- Spring Boot 3.5.x
- Spring Web, Data JPA, Security, Validation, Actuator
- PostgreSQL (dev/prod) · H2 (local/test)
- Flyway
- Lombok
- Maven Wrapper

## Paket Yapısı

```
com.mars
 ├── config
 ├── security
 ├── controller
 ├── service
 │    └── impl
 ├── repository
 ├── entity
 ├── dto
 ├── mapper
 ├── exception
 │    └── handler
 ├── validator
 ├── util
 └── enums
```

## Profiller

| Profil | Veritabanı | Kullanım |
|--------|------------|----------|
| `local` (varsayılan) | H2 in-memory | DB kurmadan iskelet çalıştırma |
| `dev` | PostgreSQL | Geliştirme (Docker Compose) |
| `prod` | PostgreSQL | Ortam değişkenleri zorunlu |
| `test` | H2 in-memory | Otomatik testler |

## Çalıştırma

### Local (H2 — varsayılan)

```bash
./mvnw spring-boot:run
# Windows: .\mvnw.cmd spring-boot:run
```

API: `http://localhost:8080/api`  
Health: `http://localhost:8080/api/actuator/health`

### Dev (PostgreSQL)

```bash
# repo kökünden
docker compose up -d

./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

### Test

```bash
./mvnw test
```

## Ortam Değişkenleri

| Değişken | Açıklama |
|----------|----------|
| `SPRING_PROFILES_ACTIVE` | Aktif profil (`local` / `dev` / `prod`) |
| `SPRING_DATASOURCE_URL` | JDBC URL |
| `SPRING_DATASOURCE_USERNAME` | DB kullanıcı |
| `SPRING_DATASOURCE_PASSWORD` | DB şifre |
| `MARS_CORS_ALLOWED_ORIGINS` | CORS origin listesi (virgülle ayrılmış) |
| `SERVER_PORT` | Sunucu portu (varsayılan `8080`) |

## Notlar

- JPA `ddl-auto: validate` (dev/prod) — şema yalnızca Flyway ile yönetilir.
- Migration dosyaları: `src/main/resources/db/migration`
- Local profilde Flyway kapalıdır; H2 şeması JPA ile oluşturulur.
