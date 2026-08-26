# MARS Proje Durumu

**Merkezi Akademisyen Randevu Sistemi (MARS)** — üniversite akademisyen randevu yönetim platformu.  
Kurumsal `@...edu.tr` kimlik doğrulama, rol tabanlı erişim ve (planlanan) randevu / ofis saati / bekleme listesi akışlarını kapsar.

| Alan | Değer |
|------|--------|
| Son güncelleme | 15 Temmuz 2026 |
| Genel ilerleme | **~40%** |
| Odak fazı | Admin + Auth + Ortak UX tamamlandı; Akademisyen / Öğrenci / Randevu bekliyor |

**Durum ikonları:** ✅ Tamamlandı · 🚧 Devam ediyor · ⬜ Başlanmadı

---

## 1) Proje Altyapısı

| Madde | Durum |
|--------|--------|
| Spring Boot 3.5 / Java 25 | ✅ |
| React + Vite + TypeScript | ✅ |
| Docker / Docker Compose | ✅ |
| Flyway migrasyonları | ✅ |
| PostgreSQL (dev/prod) + H2 (local) | ✅ |
| Tailwind CSS | ✅ |
| Spring Security + JWT | ✅ |
| CORS / Actuator health | ✅ |
| Stitch UI referansları (`docs/ui`) | ✅ |
| SRS / ER dokümantasyonu | ✅ |
| Swagger / OpenAPI | ⬜ |
| CI/CD pipeline | ⬜ |

---

## 2) Veritabanı

Entity’ler ER/SRS’e uygun oluşturuldu (Flyway V1+). İş mantığı / API kapsamı ayrıdır.

| Entity | Schema | İş mantığı / API |
|--------|--------|------------------|
| Role | ✅ | ✅ (`GET /roles`) |
| Department | ✅ | ✅ (`GET /departments`) |
| User | ✅ | ✅ (Admin CRUD + durum) |
| Course | ✅ | ⬜ |
| CourseAssignment | ✅ | ⬜ |
| RecurrenceRule | ✅ | ⬜ |
| AvailabilitySlot | ✅ | ⬜ |
| OutOfOfficePeriod | ✅ | ⬜ |
| AppointmentCategory | ✅ | ✅ (Admin CRUD) |
| PenaltyRule | ✅ | ✅ (Admin okuma/güncelleme) |
| Appointment | ✅ | ⬜ |
| DelegationLog | ✅ | ⬜ |
| StudentPenaltyStatus | ✅ | ⬜ |
| WaitlistEntry | ✅ | ⬜ |

---

## 3) Authentication

| Özellik | Durum |
|---------|--------|
| JWT üretimi / doğrulama | ✅ |
| Spring Security filter chain | ✅ |
| Login (`POST /auth/login`) | ✅ |
| Logout (frontend `clearSession`) | ✅ |
| Forgot Password (dummy reset) | ✅ |
| Pasif kullanıcı JWT iptali (`isActive`) | ✅ |
| Role Based Redirect | ✅ |
| Protected Routes | ✅ |
| Refresh Token | ⬜ |
| Gerçek e-posta ile şifre sıfırlama | ⬜ |

---

## 4) Admin Modülü

### Kullanıcı Yönetimi

| Özellik | Durum |
|---------|--------|
| Listeleme | ✅ |
| Oluşturma | ✅ |
| Güncelleme | ✅ |
| Aktif / Pasif | ✅ |
| Rol & Bölüm select (API) | ✅ |
| Onay modalı (durum değişimi) | ✅ |

### Kategori Yönetimi

| Özellik | Durum |
|---------|--------|
| Listeleme | ✅ |
| CRUD | ✅ |
| Kategori Grubu | ✅ |
| Süre Yönetimi | ✅ |
| Ders Zorunluluğu | ✅ |

### Ceza Kuralları

| Özellik | Durum |
|---------|--------|
| Listeleme / Get | ✅ |
| Güncelleme | ✅ |
| Validasyon | ✅ |
| UI (Stitch uyumlu) | ✅ |
| Silme (ayrı CRUD) | ⬜ *(singleton güncelleme modeli)* |

### Diğer Admin

| Özellik | Durum |
|---------|--------|
| Admin Layout / Sidebar / Topbar | ✅ |
| Profilim (görüntüleme) | ✅ |
| Dashboard (karşılama) | ✅ |

---

## 5) Akademisyen Modülü

| Özellik | Durum |
|---------|--------|
| Ders Yönetimi | ⬜ |
| Asistan Atama | ⬜ |
| Ofis Saatleri | ⬜ |
| Tekrarlayan Takvim | ⬜ |
| OOO (Ofis Dışı) | ⬜ |
| Randevu Onay | ⬜ |
| Delegasyon | ⬜ |
| Stub dashboard sayfası | 🚧 *(yalnızca iskelet)* |

---

## 6) Asistan Modülü

| Özellik | Durum |
|---------|--------|
| Delegasyonlu randevu yönetimi | ⬜ |
| Ofis saati / görev listesi | ⬜ |
| Onay / red akışları | ⬜ |
| Stub dashboard sayfası | 🚧 *(yalnızca iskelet)* |

---

## 7) Öğrenci Modülü

| Özellik | Durum |
|---------|--------|
| Akademisyen Arama | ⬜ |
| Kategori Seçme | ⬜ |
| Ders Seçme | ⬜ |
| Randevu Talebi | ⬜ |
| Kısıtlı Süre (turuncu uyarı) | ⬜ |
| Bekleme Listesi | ⬜ |
| Randevu İptali | ⬜ |
| Randevularım | ⬜ |
| Stub dashboard sayfası | 🚧 *(yalnızca iskelet)* |

---

## 8) Randevu Yönetimi

| Özellik | Durum |
|---------|--------|
| Appointment entity | ✅ |
| Appointment API / iş kuralları | ⬜ |
| Approval | ⬜ |
| Reject | ⬜ |
| Delegation | ⬜ |
| Google Meet / harici takvim | ⬜ *(SRS kapsam dışı / planlanmadı)* |
| Waitlist | ⬜ |
| No-Show + ceza uygulaması | ⬜ |

---

## 9) Frontend

| Özellik | Durum |
|---------|--------|
| Admin Layout | ✅ |
| Sidebar (dark, Stitch) | ✅ |
| Header / Topbar + Logout | ✅ |
| Tailwind CSS | ✅ |
| Responsive Admin shell | ✅ |
| Login / Reset Password | ✅ |
| Profil Sayfası (Admin) | ✅ |
| Toast (success/error/info/warning) | ✅ |
| Loading (ortak) | ✅ |
| Confirm Modal | ✅ |
| Axios Interceptor (token + 401) | ✅ |
| Role / Department Select | ✅ |
| UI tutarlılığı (Admin + Auth) | ✅ |
| MUI kaldırıldı | ✅ |
| Akademisyen / Öğrenci / Asistan ekranları | ⬜ |
| HOD özel ekranları | ⬜ |

---

## 10) Backend

| Özellik | Durum |
|---------|--------|
| Controller (Auth + Admin + catalog) | ✅ |
| Service katmanı | ✅ |
| Repository | ✅ |
| DTO + Mapper | ✅ |
| Bean Validation (`@Valid`) | ✅ |
| Global Exception Handler (`ApiResponse`) | ✅ |
| Security (JWT + rol + isActive) | ✅ |
| Unit / WebMvc testler (ceza kuralı vb.) | 🚧 |
| Swagger | ⬜ |
| Akademisyen / Öğrenci / Randevu API’leri | ⬜ |

---

## 11) Sonraki Sprintler

Öncelik sırası (SRS use case sırasına uygun öneri):

1. **Akademisyen Modülü** — ofis saatleri, tekrarlayan slot, OOO
2. **Ders Yönetimi** — Course / CourseAssignment
3. **Asistan Atama** — yetki ve delegasyon kuralları
4. **Randevu çekirdeği** — talep, onay, red, durum makinesi
5. **Öğrenci Modülü** — arama, kategori/ders seçimi, talep
6. **Bekleme listesi (FIFO)** + kısıtlı süre (turuncu uyarı)
7. **No-Show** — ceza kuralının runtime uygulaması
8. **HOD görünümleri** — bölüm düzeyinde izleme
9. **Refresh Token** + gerçek şifre sıfırlama e-postası
10. **Swagger / test kapsamı / CI**

---

## 12) Genel İlerleme

| Kategori | Durum | Tamamlanma |
|----------|--------|------------|
| Proje Altyapısı | ✅ | %100 |
| Veritabanı (schema) | ✅ | %100 |
| Authentication | ✅ / 🚧 | %90 |
| Admin | ✅ | %95 |
| Akademisyen | ⬜ | %0 |
| Asistan | ⬜ | %0 |
| Öğrenci | ⬜ | %0 |
| Randevu Yönetimi | ⬜ | %5 *(yalnızca entity)* |
| Frontend (tüm roller) | 🚧 | %55 |
| Backend (tüm API’ler) | 🚧 | %50 |
| **Toplam Proje** | 🚧 | **~40%** |

---

## Güncelleme Notu

Bu dosya sprint sonunda güncellenmelidir:

- Yeni özellik → ilgili satırda ⬜ → 🚧 → ✅  
- İlerleme yüzdeleri ve “Son güncelleme” tarihi gözden geçirilmeli  
- Sonraki sprint listesi önceliğe göre yeniden sıralanabilir  
