# MARS

**Merkezi Akademisyen Randevu Sistemi**

![Java](https://img.shields.io/badge/Java-21-red?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-6DB33F?logo=springboot&logoColor=white)
![Spring Security](https://img.shields.io/badge/Spring%20Security-JWT-6DB33F?logo=springsecurity&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Authentication-000000?logo=jsonwebtokens)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111111)
![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![Flyway](https://img.shields.io/badge/Flyway-Migrations-CC0200?logo=flyway&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)
![Maven](https://img.shields.io/badge/Maven-Build-C71A36?logo=apachemaven&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?logo=tailwindcss&logoColor=white)

MARS, üniversitelerde öğrenci, akademisyen, araştırma görevlisi, bölüm başkanı ve yönetici rollerinin randevu süreçlerini tek merkezden yönetebilmesi için geliştirilmiş modern bir akademik randevu sistemidir. Sistem; randevu oluşturma, ofis saati yönetimi, bekleme listesi, randevu devri, no-show ceza kuralları, bildirimler, e-posta tercihleri, dashboardlar ve istatistik ekranlarını rol bazlı olarak sunar.

## Amaç

MARS'ın amacı, akademik görüşme süreçlerini şeffaf, izlenebilir ve ölçeklenebilir hale getirmektir. Öğrenciler uygun akademisyen ve saatleri bulabilir, akademisyenler takvimlerini yönetebilir, bölüm başkanları bölüm performansını takip edebilir, yöneticiler ise sistem kurallarını ve kullanıcıları merkezi olarak kontrol edebilir.

## Temel Özellikler

- Rol bazlı kullanıcı deneyimi: Admin, Bölüm Başkanı, Akademisyen, Araştırma Görevlisi ve Öğrenci
- Akademisyen müsaitliğine göre randevu oluşturma
- Ofis saatleri ve tekrarlayan takvim yönetimi
- Randevu onay, red, tamamlandı ve no-show akışları
- Randevu devri ve bekleme listesi süreçleri
- No-show ceza sistemi ve admin tarafından yönetilen ceza kuralları
- Bildirim merkezi ve e-posta bildirim tercihleri
- Dashboard KPI kartları, grafikler ve istatistikler
- Kategori, kullanıcı ve sistem durumu yönetimi
- JWT tabanlı kimlik doğrulama ve rol bazlı yetkilendirme

## Kullanılan Teknolojiler

| Katman | Teknolojiler |
| --- | --- |
| Backend | Java 21, Spring Boot, Spring Security, Spring Data JPA, Bean Validation, WebSocket, Mail |
| Frontend | React, TypeScript, Vite, React Router, TanStack Query, Axios, TailwindCSS |
| Veritabanı | PostgreSQL, Flyway |
| Kimlik Doğrulama | JWT |
| DevOps | Docker, Docker Compose, Maven, npm |
| Dokümantasyon | SRS, ER Diagramı, ekran görüntüleri |

## Mimari

Proje Clean Architecture yaklaşımını koruyacak şekilde ayrıştırılmıştır. Backend tarafında iş kuralları servis katmanında tutulur, controller katmanı HTTP isteklerini karşılar, repository katmanı veri erişimini yönetir. DTO ve mapper yapıları ile API modelleri domain/entity modellerinden ayrılır.

Backend ana katmanları:

- **Controller:** REST endpointlerini sağlar.
- **Service:** Randevu, bildirim, ceza, kullanıcı ve takvim iş kurallarını yürütür.
- **Repository:** Spring Data JPA ile veri erişimini yönetir.
- **DTO:** Frontend ile paylaşılan istek ve cevap modellerini tanımlar.
- **Mapper:** Entity ve DTO dönüşümlerini merkezi hale getirir.
- **Entity:** Veritabanı modellerini temsil eder.
- **Security:** JWT authentication ve role based authorization süreçlerini yönetir.

Frontend tarafında sayfalar, ortak bileşenler, servisler, context yapıları ve tip tanımları ayrılmıştır. API çağrıları Axios ve TanStack Query ile yönetilir.

## Proje Yapısı

```text
MARS-Merkezi-Akademisyen-Randevu-Sistemi/
├── docs/
│   ├── ER.md
│   └── SRS.md
├── mars-backend/
│   ├── pom.xml
│   └── src/
│       └── main/
│           ├── java/
│           └── resources/
│               └── db/migration/
├── mars-frontend/
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
├── screenshots/
├── .env.example
├── docker-compose.yml
└── README.md
```

## Kurulum

### Gereksinimler

- Java 21
- Maven veya Maven Wrapper
- Node.js ve npm
- Docker ve Docker Compose
- PostgreSQL

### Ortam Değişkenleri

Proje kökünde örnek ortam değişkenleri `.env.example` dosyasında tutulur. Docker ile çalıştırmadan önce bu dosya `.env` olarak kopyalanabilir.

```powershell
Copy-Item .env.example .env
```

Linux/macOS için:

```bash
cp .env.example .env
```

## Docker ile Çalıştırma

Proje kök dizininde aşağıdaki komut kullanılabilir:

```bash
docker compose up --build
```

Varsayılan servisler:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080`
- PostgreSQL: `localhost:5432`

Servisler `docker-compose.yml` üzerinden PostgreSQL, Spring Boot backend ve Vite frontend olarak birlikte ayağa kaldırılır. Veritabanı şeması Flyway migration dosyaları ile hazırlanır.

## Manuel Kurulum

### Backend

```bash
cd mars-backend
./mvnw spring-boot:run
```

Windows için:

```powershell
cd mars-backend
.\mvnw.cmd spring-boot:run
```

Backend çalışmadan önce PostgreSQL bağlantı bilgilerinin ortam değişkenleri veya Spring konfigürasyonu üzerinden sağlandığından emin olunmalıdır.

### Frontend

```bash
cd mars-frontend
npm install
npm run dev
```

Frontend varsayılan olarak Vite geliştirme sunucusu üzerinden çalışır.

## Varsayılan Kullanıcı Rolleri

| Rol | Açıklama |
| --- | --- |
| Admin | Kullanıcı yönetimi, kategori yönetimi, ceza kuralları ve sistem durumu ekranlarını yönetir. |
| Bölüm Başkanı | Bölüm akademisyenlerini, bölüm istatistiklerini ve randevu süreçlerini takip eder. |
| Akademisyen | Derslerini, ofis saatlerini, takvimini, randevularını ve randevu devri süreçlerini yönetir. |
| Araştırma Görevlisi | Akademisyen rolüne benzer randevu ve takvim ekranlarını kullanır. |
| Öğrenci | Akademisyen arar, randevu oluşturur, randevularını ve bildirimlerini takip eder. |

## Sistem Modülleri

| Modül | Açıklama |
| --- | --- |
| Randevu Yönetimi | Öğrenci randevu oluşturma, akademisyen onay/red, tamamlandı ve no-show akışlarını kapsar. |
| Ofis Saatleri | Akademisyenlerin görüşme yapılabilecek zaman aralıklarını tanımlamasını sağlar. |
| Tekrarlayan Takvim | Düzenli müsaitlik ve program yönetimi için kullanılır. |
| Randevu Devri | Akademisyenlerin uygun durumlarda randevu sorumluluğunu devretmesini sağlar. |
| Bekleme Listesi | Uygun kontenjan oluştuğunda öğrencilerin teklif alabilmesini sağlar. |
| No-Show Ceza Sistemi | Randevuya katılmayan öğrenciler için admin kurallarına göre geçici kısıt uygular. |
| Bildirim Merkezi | Sistem olaylarının kullanıcılara okunabilir bildirimler olarak iletilmesini sağlar. |
| E-posta Bildirimleri | Kullanıcı tercihleriyle uyumlu e-posta bilgilendirmeleri üretir. |
| Dashboardlar | Her rol için KPI, özet bilgi, grafik ve son hareket alanları sunar. |
| Grafikler ve İstatistikler | Randevu, bölüm ve sistem verilerini görsel olarak raporlar. |
| Rol Bazlı Yetkilendirme | Ekran ve endpoint erişimlerini kullanıcı rolüne göre sınırlar. |
| Kullanıcı Yönetimi | Admin tarafından kullanıcıların görüntülenmesi ve yönetilmesi için kullanılır. |
| Kategori Yönetimi | Randevu kategorilerinin merkezi olarak yönetilmesini sağlar. |
| Ceza Kuralları | No-show limit ve ceza süresi gibi kuralların yönetilmesini sağlar. |
| Sistem Durumu | Sistem sağlığı ve operasyonel durumların izlenmesine yardımcı olur. |

## Ekran Görüntüleri

Ekran görüntüleri modül bazında gruplanmıştır. İlgili ekranlar README'nin okunabilirliğini korumak için yan yana gösterilir.

### Giriş

| Giriş ekranı | Şifremi unuttum |
| --- | --- |
| ![Giriş Ekranı](screenshots/giris_ekrani.png) | ![Şifremi Unuttum](screenshots/sifremi_unuttum.png) |
| Kullanıcıların sisteme rol bazlı giriş yaptığı ana ekran. | Parola sıfırlama sürecinin başlatıldığı sade form ekranı. |

### Öğrenci Modülü

| Ana ekran | Akademisyen profili | Randevularım |
| --- | --- | --- |
| ![Öğrenci Ana Ekran](screenshots/ogrenci_anasayfa.png) | ![Akademisyen Profil Detayı](screenshots/ogrenci_randevu_akademisyen_profildetayi.png) | ![Öğrenci Randevularım](screenshots/ogrenci_randevularim.png) |
| Öğrencinin randevu özetlerini takip ettiği dashboard. | Randevu öncesi akademisyen bilgilerinin incelendiği ekran. | Aktif ve geçmiş randevuların listelendiği ekran. |

| Randevu alma | Saat seçimi | Randevu onayı |
| --- | --- | --- |
| ![Öğrenci Randevu Al](screenshots/ogrenci_randevu_al.png) | ![Öğrenci Randevu Al 2](screenshots/ogrenci_randevu_al2.png) | ![Öğrenci Randevu Al 3](screenshots/ogrenci_randevu_al3.png) |
| Akademisyen arama ve filtreleme adımı. | Uygun tarih ve saatlerin seçildiği adım. | Randevu talebi gönderilmeden önceki doğrulama adımı. |

| Randevu detayı |
| --- |
| ![Öğrenci Randevu Detayı](screenshots/ogrenci_randevual.png) |
| Öğrencinin oluşturduğu randevunun durumunu ve ayrıntılarını takip ettiği ekran. |

### Akademisyen / Araştırma Görevlisi Modülü

Akademisyen ve araştırma görevlisi rolleri ortak randevu ve takvim deneyimini kullanır. Araştırma görevlisi ekranları, yetkileri dahilinde akademisyen arayüzüyle aynı tasarım dilini paylaşır.

| Dashboard 1 | Dashboard 2 | Dashboard 3 |
| --- | --- | --- |
| ![Akademisyen Ana Ekran](screenshots/akademisyen_anaekran.png) | ![Akademisyen Ana Ekran 2](screenshots/akademisyen_anaekran2.png) | ![Akademisyen Ana Ekran 3](screenshots/akademisyen_anaekran3.png) |
| Günlük program, KPI ve bekleyen talepler. | Dashboard geniş ekran yerleşimi. | Ek özet ve liste alanları. |

| Derslerim | Ofis saatleri | Takvim |
| --- | --- | --- |
| ![Akademisyen Derslerim](screenshots/akademisyen_derslerim.png) | ![Akademisyen Ofis Saatleri](screenshots/akademisyen_ofis_saatleri.png) | ![Akademisyen Takvim](screenshots/akademisyen_takvim.png) |
| Ders ilişkilerinin yönetildiği ekran. | Randevuya açık zaman aralıkları. | Randevu ve müsaitlik takvimi. |

| İzin aralıkları | Randevularım | Randevu detayı |
| --- | --- | --- |
| ![Akademisyen İzin Aralıkları](screenshots/akademisyen_izin_aralıiklari.png) | ![Akademisyen Randevularım](screenshots/akademisyen_randevularım.png) | ![Akademisyen Randevu Detay](screenshots/akademisyen_randevu_detay.png) |
| Randevu alınamayacak tarih aralıkları. | Gelen, onaylanan ve geçmiş randevular. | Randevu ayrıntıları ve işlem seçenekleri. |

| Randevu devri | Randevu devri detayı |
| --- | --- |
| ![Akademisyen Randevu Devri](screenshots/akademisyen_randevu_devri.png) | ![Akademisyen Randevu Devri Detay](screenshots/akademisyen_randevu_devri_detay.png) |
| Devir taleplerinin görüntülendiği ekran. | Seçilen devir talebinin detay ekranı. |

### Bölüm Başkanı Modülü

Bölüm Başkanı rolü, akademisyen randevu ekranlarına ek olarak bölüm yönetimi ve istatistik ekranlarına erişir.

| Akademisyen yönetimi |
| --- |
| ![HOD Akademisyenler](screenshots/hod_akademisyenler.png) |
| Bölümdeki akademisyenlerin görüntülendiği ve takip edildiği yönetim ekranı. |

| Akademisyen detayı 1 | Akademisyen detayı 2 | Akademisyen detayı 3 |
| --- | --- | --- |
| ![HOD Akademisyen Detay](screenshots/hod_akademisyen_detay.png) | ![HOD Akademisyen Detay 2](screenshots/hod_akademisyen_detay2.png) | ![HOD Akademisyen Detay 3](screenshots/hod_akademisyen_detay3.png) |
| Seçilen akademisyenin genel bilgileri. | Akademisyen bazlı randevu ve performans özetleri. | Akademisyen inceleme akışının devam bölümü. |

| Bölüm istatistikleri 1 | Bölüm istatistikleri 2 | Bölüm istatistikleri 3 |
| --- | --- | --- |
| ![HOD Bölüm İstatistikleri](screenshots/hod_bolum_istatistikleri.png) | ![HOD Bölüm İstatistikleri 2](screenshots/hod_bolum_istatistikleri2.png) | ![HOD Bölüm İstatistikleri 3](screenshots/hod_bolum_istatistikleri3.png) |
| Bölüm düzeyindeki randevu metrikleri. | Grafik ve KPI kırılımları. | Liste ve dağılım alanlarının yer aldığı devam görünümü. |

### Yönetici (Admin) Modülü

| Ana ekran | Kullanıcı yönetimi | Kategori yönetimi |
| --- | --- | --- |
| ![Admin Ana Ekran](screenshots/admin_anasayfa.png) | ![Admin Kullanıcı Yönetimi](screenshots/admin_kullanici_yonetimi.png) | ![Admin Kategori Yönetimi](screenshots/admin_kategori_yonetimi.png) |
| Sistem geneli KPI ve yönetim özetleri. | Kullanıcıların merkezi yönetim ekranı. | Randevu kategorilerinin yönetildiği ekran. |

| Ceza kuralları | Sistem durumu |
| --- | --- |
| ![Admin Ceza Kuralları](screenshots/admin_ceza_kurallari.png) | ![Admin Sistem Durumu](screenshots/admin_sistem_durumu.png) |
| No-show limitleri ve ceza süreleri. | Sistem sağlığı ve operasyonel durumlar. |

### Profil

| Profil |
| --- |
| ![Profil](screenshots/profil.png) |
| Rol bağımsız kullanıcı bilgilerinin yönetildiği ortak profil ekranı. |

## Gelecek Çalışmalar

- Uçtan uca test kapsamının genişletilmesi
- Dashboard grafiklerinde daha gelişmiş tarih aralığı karşılaştırmaları
- Bildirim merkezi için gelişmiş arşivleme ve arama seçenekleri
- Erişilebilirlik denetimlerinin otomatik kalite sürecine eklenmesi
- Sistem gözlemlenebilirliği için daha detaylı operasyon metrikleri

## Dokümantasyon

Detaylı gereksinimler ve veri modeli dokümantasyonu aşağıdaki dosyalarda yer alır:

- `docs/SRS.md`
- `docs/ER.md`

## Lisans

Bu proje akademik teslim kapsamında hazırlanmıştır. Lisans koşulları proje sahibi ve teslim gereksinimlerine göre belirlenmelidir. Açık kaynak dağıtım planlanıyorsa repository kök dizinine ayrıca bir `LICENSE` dosyası eklenmelidir.
