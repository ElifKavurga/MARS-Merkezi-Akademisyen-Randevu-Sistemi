-- Test data: departments and users for login testing
-- Password for all users: Mars123* (BCryptPasswordEncoder hash)

INSERT INTO department (department_name) VALUES
    ('Bilgisayar Mühendisliği'),
    ('Yazılım Mühendisliği'),
    ('Elektrik Elektronik Mühendisliği'),
    ('Makine Mühendisliği');

INSERT INTO "user" (full_name, institutional_email, password_hash, role_id, department_id, is_active, created_at)
SELECT
    'Sistem Yöneticisi',
    'admin@mars.edu.tr',
    '$2a$10$Bez4rPOQtZpd8/mfLAVMiuY2dFIZ/.u/K1pzmoWs9nZn/eL64F0oS',
    r.role_id,
    d.department_id,
    TRUE,
    CURRENT_TIMESTAMP
FROM role r
CROSS JOIN department d
WHERE r.role_name = 'ADMIN'
  AND d.department_name = 'Yazılım Mühendisliği';

INSERT INTO "user" (full_name, institutional_email, password_hash, role_id, department_id, is_active, created_at)
SELECT
    'Prof. Dr. Ahmet Yılmaz',
    'ahmet.yilmaz@mars.edu.tr',
    '$2a$10$Bez4rPOQtZpd8/mfLAVMiuY2dFIZ/.u/K1pzmoWs9nZn/eL64F0oS',
    r.role_id,
    d.department_id,
    TRUE,
    CURRENT_TIMESTAMP
FROM role r
CROSS JOIN department d
WHERE r.role_name = 'HOD'
  AND d.department_name = 'Yazılım Mühendisliği';

INSERT INTO "user" (full_name, institutional_email, password_hash, role_id, department_id, is_active, created_at)
SELECT
    'Doç. Dr. Ayşe Demir',
    'ayse.demir@mars.edu.tr',
    '$2a$10$Bez4rPOQtZpd8/mfLAVMiuY2dFIZ/.u/K1pzmoWs9nZn/eL64F0oS',
    r.role_id,
    d.department_id,
    TRUE,
    CURRENT_TIMESTAMP
FROM role r
CROSS JOIN department d
WHERE r.role_name = 'ACADEMICIAN'
  AND d.department_name = 'Yazılım Mühendisliği';

INSERT INTO "user" (full_name, institutional_email, password_hash, role_id, department_id, is_active, created_at)
SELECT
    'Arş. Gör. Mehmet Kaya',
    'mehmet.kaya@mars.edu.tr',
    '$2a$10$Bez4rPOQtZpd8/mfLAVMiuY2dFIZ/.u/K1pzmoWs9nZn/eL64F0oS',
    r.role_id,
    d.department_id,
    TRUE,
    CURRENT_TIMESTAMP
FROM role r
CROSS JOIN department d
WHERE r.role_name = 'ASSISTANT'
  AND d.department_name = 'Yazılım Mühendisliği';

INSERT INTO "user" (full_name, institutional_email, password_hash, role_id, department_id, is_active, created_at)
SELECT
    'Elif Kaya',
    'elif.kaya@mars.edu.tr',
    '$2a$10$Bez4rPOQtZpd8/mfLAVMiuY2dFIZ/.u/K1pzmoWs9nZn/eL64F0oS',
    r.role_id,
    d.department_id,
    TRUE,
    CURRENT_TIMESTAMP
FROM role r
CROSS JOIN department d
WHERE r.role_name = 'STUDENT'
  AND d.department_name = 'Yazılım Mühendisliği';
