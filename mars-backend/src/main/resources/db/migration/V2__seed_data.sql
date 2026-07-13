-- Seed: Role, AppointmentCategory, PenaltyRule

INSERT INTO role (role_name) VALUES
    ('STUDENT'),
    ('ASSISTANT'),
    ('ACADEMICIAN'),
    ('HOD'),
    ('ADMIN');

INSERT INTO appointment_category (category_name, duration_minutes, category_group, requires_course_selection) VALUES
    ('Bitirme Projesi / Tez Danışmanlığı', 30, 'ACADEMIC', false),
    ('TÜBİTAK / Teknofest / Hackathon Proje Danışmanlığı', 30, 'ACADEMIC', false),
    ('Kariyer, Sektör ve Staj Danışmanlığı', 30, 'ACADEMIC', false),
    ('Bağımsız Araştırma / Makale Çalışması', 30, 'ACADEMIC', false),
    ('Dersle Alakalı Soru / Konu Anlaşılmazlığı', 30, 'COURSE_EXAM', true),
    ('Sınav Kağıdı / Ödev İnceleme ve İtiraz', 10, 'COURSE_EXAM', true),
    ('Ders Kayıt ve Danışman Onayı', 10, 'COURSE_EXAM', false),
    ('Evrak Teslimi / Belge İmzalatma', 10, 'ADMINISTRATIVE', false),
    ('Mazeret Sınavı Görüşmesi / Belge İbrazı', 10, 'ADMINISTRATIVE', false),
    ('Genel Bölüm İşleyişi / İdari Soru', 10, 'ADMINISTRATIVE', false);

INSERT INTO penalty_rule (max_no_show_count, ban_duration_days, is_active) VALUES
    (3, 7, true);
