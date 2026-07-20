-- Sprint 21.3: academic title + appointment acceptance flag

ALTER TABLE "user"
    ADD COLUMN academic_title VARCHAR(100),
    ADD COLUMN is_accepting_appointments BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE "user"
SET full_name = 'Ahmet Yılmaz',
    academic_title = 'Prof. Dr.'
WHERE institutional_email = 'ahmet.yilmaz@mars.edu.tr';

UPDATE "user"
SET full_name = 'Ayşe Demir',
    academic_title = 'Doç. Dr.'
WHERE institutional_email = 'ayse.demir@mars.edu.tr';

UPDATE "user"
SET full_name = 'Mehmet Kaya',
    academic_title = 'Arş. Gör.'
WHERE institutional_email = 'mehmet.kaya@mars.edu.tr';
