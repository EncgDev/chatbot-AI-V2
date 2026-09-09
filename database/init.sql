-- ============================================================
--  NORA — Chatbot ENCG Marrakech | Script d'Initialisation SQL
--  Auteur : Soufiane
--  Schéma : TABLE categories + TABLE QAs
-- ============================================================

-- ─────────────────────────────────────────────
--  TABLE 1 : categories
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id   INT PRIMARY KEY,
    name VARCHAR(80) NOT NULL
);

-- ─────────────────────────────────────────────
--  TABLE 2 : QAs (Questions / Réponses)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS QAs (
    id          SERIAL PRIMARY KEY,
    question    TEXT NOT NULL,
    response    TEXT NOT NULL,
    category_id INT  NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Index pour accélérer les recherches par catégorie
CREATE INDEX IF NOT EXISTS idx_qas_category_id ON QAs(category_id);

-- Index Full-Text Search pour la recherche par mots-clés
CREATE INDEX IF NOT EXISTS idx_qas_question_fts
    ON QAs USING gin(to_tsvector('french', question));

CREATE INDEX IF NOT EXISTS idx_qas_response_fts
    ON QAs USING gin(to_tsvector('french', response));


-- ─────────────────────────────────────────────
--  SEED DATA : CATEGORIES (6 thématiques)
--  IDs fixes pour correspondre avec le frontend
-- ─────────────────────────────────────────────
INSERT INTO categories (id, name) VALUES
    (1, 'Formations'),
    (2, 'Horaires & emploi du temps'),
    (3, 'Admission & inscription'),
    (4, 'À propos de l''ENCG'),
    (5, 'Vie étudiante & clubs'),
    (6, 'Contact & localisation')
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────
--  SEED DATA : QAs — FORMATIONS (category_id=1)
--  4 questions
-- ─────────────────────────────────────────────
INSERT INTO QAs (question, response, category_id) VALUES
(
    'Quelles sont les filières disponibles à l''ENCG Marrakech ?',
    'L''ENCG Marrakech propose les formations suivantes :
• Licence en Sciences de Gestion (LSG) — Bac+3
• Licence en Commerce International (LCI) — Bac+3
• Master en Management des Organisations (MMO) — Bac+5
• Master en Finance et Comptabilité (MFC) — Bac+5
• Master en Marketing et Management Commercial (MMC) — Bac+5
• Master en Audit et Contrôle de Gestion (MACG) — Bac+5',
    1
),
(
    'Quelle est la durée du cycle Licence à l''ENCG ?',
    'Le cycle Licence dure 3 ans (Bac+3), soit 6 semestres. Les deux premières années forment un tronc commun, la 3ème année est une spécialisation. Mentions disponibles : Commerce International, Gestion des Entreprises, Management des Ressources Humaines.',
    1
),
(
    'L''ENCG propose-t-elle des formations en alternance ?',
    'Oui, l''ENCG Marrakech propose des formations en alternance pour les Masters professionnels. Les étudiants partagent leur temps entre l''école et une entreprise partenaire de la région Marrakech-Safi.',
    1
),
(
    'Quelle est la langue d''enseignement à l''ENCG ?',
    'L''enseignement est dispensé principalement en français. Certains modules sont en arabe (droit, économie). Au niveau Master, certains cours spécialisés sont donnés en anglais pour préparer les étudiants à l''international.',
    1
);


-- ─────────────────────────────────────────────
--  SEED DATA : QAs — HORAIRES (category_id=2)
--  3 questions
-- ─────────────────────────────────────────────
INSERT INTO QAs (question, response, category_id) VALUES
(
    'Quels sont les horaires des cours à l''ENCG Marrakech ?',
    'Les cours se déroulent généralement :
• Matin : 8h30 – 12h30
• Après-midi : 14h00 – 18h00
Les emplois du temps détaillés sont affichés sur le tableau d''affichage et sur l''espace étudiant en ligne. Ils peuvent varier selon les filières et semestres.',
    2
),
(
    'Quand commencent et se terminent les semestres ?',
    'L''année académique est organisée en deux semestres :
• Semestre 1 (S1) : Septembre – Janvier (examens en janvier)
• Semestre 2 (S2) : Février – Juin (examens en juin)
Les sessions de rattrapage ont lieu en juillet.',
    2
),
(
    'Quels sont les horaires d''ouverture de l''administration ?',
    'Les services administratifs sont ouverts :
• Lundi au Vendredi : 8h00 – 16h30
• Samedi : 9h00 – 12h00 (certains services uniquement)
• Fermé le Dimanche et les jours fériés',
    2
);


-- ─────────────────────────────────────────────
--  SEED DATA : QAs — ADMISSION (category_id=3)
--  4 questions
-- ─────────────────────────────────────────────
INSERT INTO QAs (question, response, category_id) VALUES
(
    'Comment s''inscrire à l''ENCG Marrakech ?',
    'Pour s''inscrire à l''ENCG Marrakech :
1. Consultez le site officiel : encg-marrakech.uca.ma
2. Passez le Concours National Commun (CNC) pour les Licences
3. Déposez votre dossier en ligne sur la plateforme nationale
4. Attendez les résultats d''orientation
5. Effectuez l''inscription administrative une fois admis
Le dossier comprend : baccalauréat, relevés de notes, photos d''identité et formulaire d''inscription.',
    3
),
(
    'Quels sont les prérequis pour intégrer l''ENCG en Licence ?',
    'Pour intégrer l''ENCG en cycle Licence :
• Être titulaire du Baccalauréat (toutes séries acceptées)
• Passer et réussir le Concours National Commun (CNC)
• Une mention Bien ou Très Bien est un atout
• Les filières scientifiques et économiques sont favorisées',
    3
),
(
    'Quand ont lieu les concours d''entrée à l''ENCG ?',
    'Le Concours National Commun (CNC) pour les Licences se tient généralement en juillet, après les résultats du Baccalauréat. Pour les Masters, les concours d''accès ont lieu en juin/juillet. Les dates exactes sont publiées chaque année sur le site du Ministère et sur le site de l''ENCG.',
    3
),
(
    'Quels sont les frais de scolarité à l''ENCG Marrakech ?',
    'En tant qu''établissement public, les frais de scolarité sont très accessibles. Les droits d''inscription annuels sont fixés par le Ministère (entre 200 et 500 MAD pour le cycle Licence). Des bourses d''études sont disponibles pour les étudiants méritants et ceux dans le besoin.',
    3
);


-- ─────────────────────────────────────────────
--  SEED DATA : QAs — À PROPOS (category_id=4)
--  3 questions
-- ─────────────────────────────────────────────
INSERT INTO QAs (question, response, category_id) VALUES
(
    'Quelle est l''histoire de l''ENCG Marrakech ?',
    'L''École Nationale de Commerce et de Gestion (ENCG) de Marrakech a été créée en 1995, dans le cadre du développement des grandes écoles au Maroc. Elle fait partie du réseau national des ENCG sous tutelle de l''Université Cadi Ayyad. Elle forme des cadres compétents dans les domaines du management, du commerce et de la gestion.',
    4
),
(
    'Quelle est la mission de l''ENCG Marrakech ?',
    'La mission de l''ENCG Marrakech est triple :
1. Formation : Former des cadres et managers compétents et opérationnels
2. Recherche : Développer la recherche en sciences de gestion
3. Partenariat : Développer les liens avec le tissu économique régional et national',
    4
),
(
    'Combien d''étudiants sont à l''ENCG Marrakech ?',
    'L''ENCG Marrakech accueille environ 2 500 à 3 000 étudiants par an, répartis sur les cycles Licence et Master. L''école dispose d''un corps professoral de plus de 80 enseignants permanents et vacataires, et d''un large réseau d''alumni.',
    4
);


-- ─────────────────────────────────────────────
--  SEED DATA : QAs — VIE ÉTUDIANTE (category_id=5)
--  3 questions
-- ─────────────────────────────────────────────
INSERT INTO QAs (question, response, category_id) VALUES
(
    'Quels clubs et associations existent à l''ENCG Marrakech ?',
    'L''ENCG Marrakech dispose d''un riche tissu associatif :
• Club Entrepreneuriat & Business
• Club Débat et Leadership
• Club Culturel et Arts
• Club Sportif (football, basketball, tennis de table)
• Junior Entreprise ENCG
• Club Relations Internationales
• Association des Anciens Étudiants',
    5
),
(
    'Des bourses sont-elles disponibles pour les étudiants ?',
    'Plusieurs types de bourses sont disponibles :
• Bourse d''excellence du Ministère de l''Enseignement Supérieur
• Bourse sociale pour les étudiants dans le besoin
• Bourse de mobilité internationale (Erasmus+)
• Bourse d''entreprise (partenariats locaux)
Contactez le service des affaires estudiantines pour postuler.',
    5
),
(
    'Y a-t-il une restauration universitaire à l''ENCG ?',
    'Oui, l''ENCG dispose d''une cafétéria sur le campus à des prix subventionnés. La restauration universitaire (RU) de l''Université Cadi Ayyad est également accessible avec la carte étudiant.',
    5
);


-- ─────────────────────────────────────────────
--  SEED DATA : QAs — CONTACT (category_id=6)
--  4 questions
-- ─────────────────────────────────────────────
INSERT INTO QAs (question, response, category_id) VALUES
(
    'Quelle est l''adresse de l''ENCG Marrakech ?',
    'L''ENCG Marrakech est située à :
📍 Route de Casablanca
Marrakech 40000, Maroc

Facilement accessible en transport en commun (bus de ville) et par taxi.',
    6
),
(
    'Quel est le numéro de téléphone de l''ENCG Marrakech ?',
    'Coordonnées de l''ENCG Marrakech :
📞 Téléphone : +212 524 33 70 26
📧 Email : contact@encg-marrakech.uca.ma
🌐 Site web : encg-marrakech.uca.ma',
    6
),
(
    'Comment contacter la scolarité de l''ENCG ?',
    'Pour contacter la scolarité :
📧 Email : scolarite@encg-marrakech.uca.ma
📞 Téléphone : +212 524 33 70 26
🕐 Horaires : Lundi-Vendredi, 8h00-16h30
Présentez-vous avec votre carte étudiant pour les documents administratifs.',
    6
),
(
    'Où se trouve l''ENCG Marrakech sur la carte ?',
    'L''ENCG Marrakech se situe sur la Route de Casablanca, à proximité du campus universitaire de l''Université Cadi Ayyad. Vous pouvez la retrouver sur Google Maps en cherchant "ENCG Marrakech" ou via l''adresse : Route de Casablanca, Marrakech 40000.',
    6
);


-- ─────────────────────────────────────────────
--  VÉRIFICATION FINALE
-- ─────────────────────────────────────────────
DO $$
BEGIN
    RAISE NOTICE '✅ Base de données NORA initialisée avec succès !';
    RAISE NOTICE '📊 Catégories créées : %', (SELECT COUNT(*) FROM categories);
    RAISE NOTICE '❓ QAs créées : %', (SELECT COUNT(*) FROM QAs);
END $$;
