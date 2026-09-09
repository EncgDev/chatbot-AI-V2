-- ============================================================
--  NORA — Chatbot ENCG Marrakech | Script d'Initialisation SQL
--  Auteur : Soufiane
-- ============================================================

-- Extension pour la recherche full-text
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ─────────────────────────────────────────────
--  TABLE : categories
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon        VARCHAR(50),
    color       VARCHAR(20),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────────
--  TABLE : faqs
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS faqs (
    id          SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    question    TEXT NOT NULL,
    reponse     TEXT NOT NULL,
    filiere     VARCHAR(100),
    source      VARCHAR(200),
    keywords    TEXT,
    views       INTEGER DEFAULT 0,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour la recherche Full-Text sur PostgreSQL
CREATE INDEX IF NOT EXISTS idx_faqs_question_fts
    ON faqs USING gin(to_tsvector('french', question));

CREATE INDEX IF NOT EXISTS idx_faqs_reponse_fts
    ON faqs USING gin(to_tsvector('french', reponse));

CREATE INDEX IF NOT EXISTS idx_faqs_keywords
    ON faqs USING gin(to_tsvector('simple', COALESCE(keywords, '')));

CREATE INDEX IF NOT EXISTS idx_faqs_category_id
    ON faqs(category_id);


-- ─────────────────────────────────────────────
--  SEED DATA : CATEGORIES
-- ─────────────────────────────────────────────
INSERT INTO categories (name, description, icon, color) VALUES
    ('Formations',      'Licences, Masters, et filières proposées par l''ENCG Marrakech', 'GraduationCap', '#3B82F6'),
    ('Admissions',      'Processus d''inscription, concours d''entrée et dossier de candidature', 'ClipboardList', '#8B5CF6'),
    ('Vie Étudiante',   'Clubs, associations, logement, bourses et vie sur le campus', 'Users', '#10B981'),
    ('Horaires',        'Emplois du temps, calendriers académiques et plannings des examens', 'Clock', '#F59E0B'),
    ('Contact',         'Coordonnées de l''école, directions et services administratifs', 'Phone', '#EF4444'),
    ('À Propos',        'Histoire de l''ENCG Marrakech, mission, vision et accréditations', 'Info', '#6366F1')
ON CONFLICT (name) DO NOTHING;


-- ─────────────────────────────────────────────
--  SEED DATA : FAQS — FORMATIONS
-- ─────────────────────────────────────────────
INSERT INTO faqs (category_id, question, reponse, filiere, source, keywords) VALUES
(
    (SELECT id FROM categories WHERE name = 'Formations'),
    'Quelles sont les filières disponibles à l''ENCG Marrakech ?',
    'L''ENCG Marrakech propose plusieurs formations : 
    • Licence en Sciences de Gestion (LSG) — Bac+3
    • Licence en Commerce International (LCI) — Bac+3
    • Master en Management des Organisations (MMO) — Bac+5
    • Master en Finance et Comptabilité (MFC) — Bac+5
    • Master en Marketing et Management Commercial (MMC) — Bac+5
    • Master en Audit et Contrôle de Gestion (MACG) — Bac+5',
    NULL,
    'https://www.encg-marrakech.ac.ma/formations',
    'filières formations licences masters programmes études'
),
(
    (SELECT id FROM categories WHERE name = 'Formations'),
    'Quelle est la durée du cycle Licence à l''ENCG ?',
    'Le cycle Licence à l''ENCG Marrakech dure 3 ans (Bac+3), soit 6 semestres. Il comprend un tronc commun les deux premières années et une spécialisation en 3ème année. Les étudiants peuvent choisir entre plusieurs mentions : Commerce International, Gestion des Entreprises, Management des Ressources Humaines.',
    'Licence',
    'https://www.encg-marrakech.ac.ma/formations/licence',
    'licence durée années semestres bac+3 tronc commun'
),
(
    (SELECT id FROM categories WHERE name = 'Formations'),
    'Est-ce que l''ENCG propose des formations en alternance ?',
    'Oui ! L''ENCG Marrakech propose des formations en alternance notamment pour les Masters professionnels. Les étudiants partagent leur temps entre l''école et l''entreprise partenaire. Des conventions sont signées avec de nombreuses entreprises de la région Marrakech-Safi.',
    'Master',
    'https://www.encg-marrakech.ac.ma/formations/alternance',
    'alternance entreprise stage professionnel convention'
),
(
    (SELECT id FROM categories WHERE name = 'Formations'),
    'Quelle est la langue d''enseignement à l''ENCG Marrakech ?',
    'L''enseignement à l''ENCG Marrakech est dispensé principalement en français. Certains modules sont enseignés en arabe (droit commercial, économie). À partir du Master, certains cours spécialisés sont donnés en anglais pour préparer les étudiants à l''international.',
    NULL,
    'https://www.encg-marrakech.ac.ma/formations',
    'langue français arabe anglais enseignement cours'
),
(
    (SELECT id FROM categories WHERE name = 'Formations'),
    'L''ENCG Marrakech est-elle accréditée ?',
    'Oui, l''ENCG Marrakech est accréditée par le Ministère de l''Enseignement Supérieur du Maroc. Elle fait partie du réseau national des ENCG (Écoles Nationales de Commerce et de Gestion) sous tutelle du Ministère. Les diplômes délivrés sont des diplômes d''État reconnus nationalement et internationalement.',
    NULL,
    'https://www.encg-marrakech.ac.ma/presentation',
    'accréditation diplôme état reconnaissance ministère'
);


-- ─────────────────────────────────────────────
--  SEED DATA : FAQS — ADMISSIONS
-- ─────────────────────────────────────────────
INSERT INTO faqs (category_id, question, reponse, filiere, source, keywords) VALUES
(
    (SELECT id FROM categories WHERE name = 'Admissions'),
    'Comment s''inscrire à l''ENCG Marrakech ?',
    'Pour s''inscrire à l''ENCG Marrakech :
    1. Consultez le site officiel : www.encg-marrakech.ac.ma
    2. Passez le Concours National Commun (CNC) pour les Licences
    3. Déposez votre dossier en ligne sur la plateforme nationale
    4. Attendez les résultats d''orientation
    5. Effectuez l''inscription administrative une fois admis
    Le dossier comprend : baccalauréat, relevés de notes, photos d''identité et formulaire d''inscription.',
    NULL,
    'https://www.encg-marrakech.ac.ma/admissions',
    'inscription inscrire dossier candidature admission processus'
),
(
    (SELECT id FROM categories WHERE name = 'Admissions'),
    'Quels sont les prérequis pour intégrer l''ENCG en Licence ?',
    'Pour intégrer l''ENCG Marrakech en cycle Licence, vous devez :
    • Être titulaire du Baccalauréat (toutes séries acceptées)
    • Avoir obtenu une mention Bien ou Très Bien est un atout
    • Passer et réussir le Concours National Commun (CNC)
    • Les filières scientifiques et économiques sont favorisées mais non obligatoires',
    'Licence',
    'https://www.encg-marrakech.ac.ma/admissions/licence',
    'prérequis baccalauréat concours CNC conditions entrée'
),
(
    (SELECT id FROM categories WHERE name = 'Admissions'),
    'Quand ont lieu les concours d''entrée à l''ENCG ?',
    'Le Concours National Commun (CNC) pour les Licences se tient généralement en juillet, après les résultats du Baccalauréat. Pour les Masters, les concours d''accès ont lieu en juin/juillet. Les dates exactes sont publiées chaque année sur le site du Ministère de l''Enseignement Supérieur et sur le site de l''ENCG.',
    NULL,
    'https://www.encg-marrakech.ac.ma/admissions/calendrier',
    'concours dates calendrier juillet inscription'
),
(
    (SELECT id FROM categories WHERE name = 'Admissions'),
    'Quels sont les frais de scolarité à l''ENCG Marrakech ?',
    'En tant qu''établissement public sous tutelle de l''État marocain, les frais de scolarité à l''ENCG Marrakech sont très accessibles. Les droits d''inscription annuels sont fixés par le Ministère et varient entre 200 et 500 MAD pour le cycle Licence. Des bourses d''études sont disponibles pour les étudiants méritants et ceux dans le besoin.',
    NULL,
    'https://www.encg-marrakech.ac.ma/admissions/frais',
    'frais scolarité droits inscription coût MAD bourses'
),
(
    (SELECT id FROM categories WHERE name = 'Admissions'),
    'L''ENCG accepte-t-elle des étudiants étrangers ?',
    'Oui, l''ENCG Marrakech accueille des étudiants étrangers dans le cadre de conventions de coopération internationale et du programme de mobilité académique. Les candidats étrangers doivent contacter directement la direction des Relations Internationales de l''ENCG pour connaître les procédures spécifiques.',
    NULL,
    'https://www.encg-marrakech.ac.ma/international',
    'étrangers international mobilité coopération échanges'
);


-- ─────────────────────────────────────────────
--  SEED DATA : FAQS — VIE ÉTUDIANTE
-- ─────────────────────────────────────────────
INSERT INTO faqs (category_id, question, reponse, filiere, source, keywords) VALUES
(
    (SELECT id FROM categories WHERE name = 'Vie Étudiante'),
    'Y a-t-il une cité universitaire près de l''ENCG Marrakech ?',
    'Oui, des cités universitaires sont disponibles à proximité de l''ENCG Marrakech. La cité universitaire de l''Université Cadi Ayyad accueille les étudiants de l''ENCG. Pour réserver une chambre, contactez le service de la scolarité ou le bureau des affaires estudiantines dès votre admission.',
    NULL,
    'https://www.encg-marrakech.ac.ma/vie-etudiante/logement',
    'logement cité universitaire résidence chambre hébergement'
),
(
    (SELECT id FROM categories WHERE name = 'Vie Étudiante'),
    'Quels clubs et associations existent à l''ENCG Marrakech ?',
    'L''ENCG Marrakech dispose d''un riche tissu associatif :
    • Club Entrepreneuriat & Business
    • Club Débat et Leadership
    • Club Culturel et Arts
    • Club Sportif (football, basketball, tennis de table)
    • Junior Entreprise ENCG
    • Club Relations Internationales
    • Association des Anciens Étudiants
    Ces clubs organisent régulièrement des événements, conférences et compétitions.',
    NULL,
    'https://www.encg-marrakech.ac.ma/vie-etudiante/clubs',
    'clubs associations sports culture entrepreneuriat activités'
),
(
    (SELECT id FROM categories WHERE name = 'Vie Étudiante'),
    'Des bourses sont-elles disponibles pour les étudiants ?',
    'Plusieurs types de bourses sont disponibles pour les étudiants de l''ENCG Marrakech :
    • Bourse d''excellence du Ministère de l''Enseignement Supérieur
    • Bourse sociale pour les étudiants en situation de besoin
    • Bourse de mobilité internationale (Erasmus+, bourses bilatérales)
    • Bourse d''entreprise (partenariats avec des entreprises locales)
    Pour postuler, contactez le service des affaires estudiantines de l''ENCG.',
    NULL,
    'https://www.encg-marrakech.ac.ma/vie-etudiante/bourses',
    'bourses aide financière excellence sociale mobilité'
),
(
    (SELECT id FROM categories WHERE name = 'Vie Étudiante'),
    'Existe-t-il une restauration universitaire à l''ENCG ?',
    'Oui, l''ENCG Marrakech dispose d''une cafétéria sur le campus offrant des repas à des prix subventionnés pour les étudiants. La restauration universitaire (RU) de l''Université Cadi Ayyad est également accessible aux étudiants de l''ENCG avec leur carte étudiant.',
    NULL,
    'https://www.encg-marrakech.ac.ma/vie-etudiante/restauration',
    'restauration cafétéria repas campus manger déjeuner'
);


-- ─────────────────────────────────────────────
--  SEED DATA : FAQS — HORAIRES
-- ─────────────────────────────────────────────
INSERT INTO faqs (category_id, question, reponse, filiere, source, keywords) VALUES
(
    (SELECT id FROM categories WHERE name = 'Horaires'),
    'Quels sont les horaires des cours à l''ENCG Marrakech ?',
    'Les cours à l''ENCG Marrakech se déroulent généralement :
    • Matin : 8h30 – 12h30
    • Après-midi : 14h00 – 18h00
    Les emplois du temps détaillés sont affichés sur le tableau d''affichage de l''école et publiés sur l''espace étudiant en ligne. Ils peuvent varier selon les filières et les semestres.',
    NULL,
    'https://www.encg-marrakech.ac.ma/horaires',
    'horaires cours heures matin après-midi emploi du temps planning'
),
(
    (SELECT id FROM categories WHERE name = 'Horaires'),
    'Quand commencent et se terminent les semestres ?',
    'L''année académique à l''ENCG Marrakech est organisée en deux semestres :
    • Semestre 1 (S1) : Septembre – Janvier (examens en janvier)
    • Semestre 2 (S2) : Février – Juin (examens en juin)
    Les sessions de rattrapage ont lieu en juillet. Le calendrier académique officiel est publié chaque année sur le site de l''ENCG.',
    NULL,
    'https://www.encg-marrakech.ac.ma/calendrier',
    'semestre calendrier académique septembre janvier juin rattrapage'
),
(
    (SELECT id FROM categories WHERE name = 'Horaires'),
    'Quels sont les horaires d''ouverture de l''administration ?',
    'Les services administratifs de l''ENCG Marrakech sont ouverts :
    • Lundi au Vendredi : 8h00 – 16h30
    • Samedi : 9h00 – 12h00 (certains services uniquement)
    • Fermé le Dimanche et les jours fériés
    Il est conseillé de vérifier les horaires avant de vous déplacer, notamment pendant les périodes d''examens.',
    NULL,
    'https://www.encg-marrakech.ac.ma/contact',
    'administration bureau horaires ouverture lundi vendredi scolarité'
);


-- ─────────────────────────────────────────────
--  SEED DATA : FAQS — CONTACT
-- ─────────────────────────────────────────────
INSERT INTO faqs (category_id, question, reponse, filiere, source, keywords) VALUES
(
    (SELECT id FROM categories WHERE name = 'Contact'),
    'Quelle est l''adresse de l''ENCG Marrakech ?',
    'L''ENCG Marrakech est située à :
    📍 Route de Casablanca, BP 549
    Marrakech 40000, Maroc
    
    Elle se trouve sur la Route de Casablanca, facilement accessible en transport en commun (bus de ville) et par taxi.',
    NULL,
    'https://www.encg-marrakech.ac.ma/contact',
    'adresse localisation route casablanca marrakech campus situation'
),
(
    (SELECT id FROM categories WHERE name = 'Contact'),
    'Quel est le numéro de téléphone de l''ENCG Marrakech ?',
    'Vous pouvez contacter l''ENCG Marrakech aux coordonnées suivantes :
    📞 Téléphone : +212 (0)5 24 33 85 12
    📠 Fax : +212 (0)5 24 33 65 64
    📧 Email : contact@encg-marrakech.ac.ma
    🌐 Site web : www.encg-marrakech.ac.ma',
    NULL,
    'https://www.encg-marrakech.ac.ma/contact',
    'téléphone numéro contact fax email adresse mail coordonnées'
),
(
    (SELECT id FROM categories WHERE name = 'Contact'),
    'Comment contacter la scolarité de l''ENCG ?',
    'Pour contacter la scolarité de l''ENCG Marrakech :
    📧 Email scolarité : scolarite@encg-marrakech.ac.ma
    📞 Téléphone direct : +212 (0)5 24 33 85 12 (poste 101)
    🕐 Horaires : Lundi-Vendredi, 8h00-16h30
    
    Pour les demandes de relevés de notes, attestations d''inscription ou autres documents administratifs, présentez-vous directement avec votre carte étudiant.',
    NULL,
    'https://www.encg-marrakech.ac.ma/contact/scolarite',
    'scolarité contact email documents attestation relevé notes administratif'
);


-- ─────────────────────────────────────────────
--  SEED DATA : FAQS — À PROPOS
-- ─────────────────────────────────────────────
INSERT INTO faqs (category_id, question, reponse, filiere, source, keywords) VALUES
(
    (SELECT id FROM categories WHERE name = 'À Propos'),
    'Quelle est l''histoire de l''ENCG Marrakech ?',
    'L''École Nationale de Commerce et de Gestion (ENCG) de Marrakech a été créée en 1995, dans le cadre du plan de développement des grandes écoles au Maroc. Elle fait partie du réseau national des 9 ENCG réparties à travers le Royaume. L''ENCG Marrakech forme des cadres compétents dans les domaines du management, du commerce et de la gestion pour répondre aux besoins économiques du Maroc.',
    NULL,
    'https://www.encg-marrakech.ac.ma/presentation/histoire',
    'histoire création 1995 fondation réseau national ENCG Maroc'
),
(
    (SELECT id FROM categories WHERE name = 'À Propos'),
    'Quelle est la mission de l''ENCG Marrakech ?',
    'La mission de l''ENCG Marrakech est triple :
    1. 🎓 Formation : Former des cadres et managers compétents et opérationnels
    2. 🔬 Recherche : Développer la recherche scientifique en sciences de gestion
    3. 🤝 Partenariat : Développer les liens avec le tissu économique régional et national
    L''ENCG s''engage à préparer ses diplômés aux défis de l''économie mondiale tout en ancrant leurs valeurs dans le contexte marocain.',
    NULL,
    'https://www.encg-marrakech.ac.ma/presentation/mission',
    'mission vision valeurs objectifs formation recherche partenariat'
),
(
    (SELECT id FROM categories WHERE name = 'À Propos'),
    'Qui est le directeur de l''ENCG Marrakech ?',
    'La direction de l''ENCG Marrakech est assurée par un Directeur nommé par le Ministère de l''Enseignement Supérieur. Pour connaître le nom du directeur actuel et l''organigramme complet de l''établissement, consultez la page "Présentation" sur le site officiel : www.encg-marrakech.ac.ma/presentation/direction',
    NULL,
    'https://www.encg-marrakech.ac.ma/presentation/direction',
    'directeur direction organigramme administration responsable'
),
(
    (SELECT id FROM categories WHERE name = 'À Propos'),
    'Combien d''étudiants y a-t-il à l''ENCG Marrakech ?',
    'L''ENCG Marrakech accueille environ 2 500 à 3 000 étudiants par an, répartis sur les cycles Licence et Master. L''école dispose d''un corps professoral de plus de 80 enseignants permanents et vacataires, ainsi que d''un réseau d''alumni de plusieurs milliers de diplômés actifs dans l''économie marocaine et internationale.',
    NULL,
    'https://www.encg-marrakech.ac.ma/presentation/chiffres',
    'étudiants nombre chiffres professeurs alumni diplômés taille effectifs'
);

-- ─────────────────────────────────────────────
--  VÉRIFICATION
-- ─────────────────────────────────────────────
DO $$
BEGIN
    RAISE NOTICE '✅ Base de données NORA initialisée avec succès !';
    RAISE NOTICE '📊 Catégories créées : %', (SELECT COUNT(*) FROM categories);
    RAISE NOTICE '❓ FAQs créées : %', (SELECT COUNT(*) FROM faqs);
END $$;
