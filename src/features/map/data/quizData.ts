import type { StopQuizData } from '../types/quiz.types'

export const STOP_QUIZ_DATA: StopQuizData[] = [
  // 0 — Alcázar de Colón
  {
    narration: 'Ante ti se alza el Alcázar de Colón, palacio donde habitó Diego Colón, hijo del Almirante. Construido entre 1511 y 1514, sus gruesos muros de coral han resistido cinco siglos de historia caribeña. Aquí se tomaron decisiones que moldearon el destino de todo un continente. Escucha el eco de aquellas voces coloniales en cada rincón de piedra.',
    questions: [
      {
        question: '¿Entre qué años fue construido el Alcázar de Colón?',
        options: ['1492 – 1498', '1511 – 1514', '1520 – 1530', '1503 – 1508'],
        correctIndex: 1,
      },
      {
        question: '¿Quién mandó construir el Alcázar de Colón?',
        options: ['Cristóbal Colón', 'Bartolomé de las Casas', 'Diego Colón', 'Nicolás de Ovando'],
        correctIndex: 2,
      },
    ],
    prize: {
      name: 'Café Colonial Gratis',
      description: 'Disfruta de un café dominicano de origen en La Atarazana. El sabor de cinco siglos en cada sorbo.',
      icon: '☕',
      code: 'ALCAZAR-001',
      validUntil: '31 Dic, 2026',
    },
  },
  // 1 — Plaza de España
  {
    narration: 'La Plaza de España es el corazón latente de la Ciudad Colonial. Frente a ti, el Alcázar de Colón preside con majestuosidad el lugar donde la historia del Nuevo Mundo tomó forma. Aquí se celebraban fiestas reales, se proclamaban decretos y la vida colonial fluía entre mercaderes y gobernantes. Este espacio abierto al cielo del Caribe ha sido testigo de cinco siglos de transformación.',
    questions: [
      {
        question: '¿Cuántas horas al día está abierta la Plaza de España?',
        options: ['12 horas', '18 horas', '24 horas', '8 horas'],
        correctIndex: 2,
      },
      {
        question: '¿Qué edificio histórico domina la vista desde la Plaza de España?',
        options: ['Catedral Primada', 'Fortaleza Ozama', 'Alcázar de Colón', 'Panteón Nacional'],
        correctIndex: 2,
      },
    ],
    prize: {
      name: 'Foto Souvenir Impresa Gratis',
      description: 'Una foto panorámica de la Plaza de España con acabado vintage. Un recuerdo para toda la vida.',
      icon: '📸',
      code: 'PLAZA-002',
      validUntil: '31 Dic, 2026',
    },
  },
  // 2 — Fortaleza Ozama
  {
    narration: 'La Fortaleza Ozama, construida en 1502, es la más antigua fortaleza militar de América. Sus murallas de piedra coral han resistido piratas, invasiones y el paso inexorable del tiempo. Desde la Torre del Homenaje, los colonizadores vigilaban el río Ozama buscando cualquier amenaza. Hoy, sus sombras guardan secretos de batallas olvidadas y glorias pasadas.',
    questions: [
      {
        question: '¿En qué año fue construida la Fortaleza Ozama?',
        options: ['1492', '1502', '1515', '1498'],
        correctIndex: 1,
      },
      {
        question: '¿Cuál fue el propósito original de la Fortaleza Ozama?',
        options: ['Palacio gubernamental', 'Monasterio religioso', 'Protección militar de la ciudad', 'Cárcel colonial'],
        correctIndex: 2,
      },
    ],
    prize: {
      name: 'Visita Guiada — Torre del Homenaje',
      description: 'Acceso privado con guía experto a la Torre del Homenaje. Vistas únicas de toda la Zona Colonial.',
      icon: '🏰',
      code: 'FORTALE-003',
      validUntil: '31 Dic, 2026',
    },
  },
  // 3 — Calle Las Damas
  {
    narration: 'La Calle Las Damas es la primera calle empedrada del Nuevo Mundo, testigo silencioso del nacimiento de una civilización. Su nombre rinde homenaje a las damas de la corte de María de Toledo, virreina de Indias, que aquí paseaban con elegancia colonial. Cada adoquín bajo tus pies ha soportado el peso de quinientos años de historia viva. Camina y siente la eternidad.',
    questions: [
      {
        question: '¿Por qué se llama "Calle Las Damas"?',
        options: ['Por sus tiendas de moda', 'Por las damas de la corte de María de Toledo', 'Por ser la más elegante', 'En honor a la Reina Isabel'],
        correctIndex: 1,
      },
      {
        question: '¿Qué distinción histórica tiene la Calle Las Damas?',
        options: ['Primera calle iluminada', 'Primera calle empedrada del Nuevo Mundo', 'La más larga de América', 'Primera calle comercial'],
        correctIndex: 1,
      },
    ],
    prize: {
      name: 'Degustación de Mamajuana Gratis',
      description: 'Prueba la bebida ancestral dominicana en un bar histórico de la Zona Colonial. ¡Salud!',
      icon: '🍶',
      code: 'DAMAS-004',
      validUntil: '31 Dic, 2026',
    },
  },
  // 4 — Museo de las Casas Reales
  {
    narration: 'En este imponente edificio del siglo XVI funcionaron la Real Audiencia y el Palacio de los Gobernadores, centros del poder colonial en América. Desde aquí se dictaban las leyes que gobernaban millones de personas a lo largo y ancho del continente. Sus salas conservan armaduras, documentos y tesoros que narran la compleja historia de la conquista española. El museo respira el alma de una era pasada.',
    questions: [
      {
        question: '¿Qué institución colonial funcionó en el Museo de las Casas Reales?',
        options: ['La primera universidad', 'La Real Audiencia y Palacio de los Gobernadores', 'El primer hospital', 'La Casa de la Moneda'],
        correctIndex: 1,
      },
      {
        question: '¿Cuánto cuesta la entrada al Museo de las Casas Reales?',
        options: ['Gratis', '$200 DOP', '$100 DOP / $2 USD', '$50 DOP'],
        correctIndex: 2,
      },
    ],
    prize: {
      name: 'Libro "Historia Colonial" de Regalo',
      description: 'Un libro ilustrado con la historia completa de la Zona Colonial de Santo Domingo. Tuyo para siempre.',
      icon: '📚',
      code: 'CASAS-005',
      validUntil: '31 Dic, 2026',
    },
  },
  // 5 — Reloj de Sol
  {
    narration: 'Este reloj de sol, construido en 1753, marcaba las horas para toda la ciudad colonial. En tiempos donde los relojes mecánicos eran un lujo, la sombra de su gnomon sobre el mármol guiaba las actividades cotidianas de nobles y mercaderes. Bajo el mismo sol caribeño de entonces, sigue marcando el tiempo con la misma precisión de antaño. El sol nunca miente.',
    questions: [
      {
        question: '¿En qué año fue construido el Reloj de Sol de la Zona Colonial?',
        options: ['1700', '1753', '1800', '1650'],
        correctIndex: 1,
      },
      {
        question: '¿Durante la gobernación de quién fue construido el Reloj de Sol?',
        options: ['Diego Colón', 'Nicolás de Ovando', 'Francisco de Rubio y Peñaranda', 'Hernán Cortés'],
        correctIndex: 2,
      },
    ],
    prize: {
      name: 'Cóctel Artesanal Tropical Gratis',
      description: 'Un refrescante cóctel de frutas tropicales en La Cafetera Colonial. Perfecto para el calor del Caribe.',
      icon: '🍹',
      code: 'RELOJ-006',
      validUntil: '31 Dic, 2026',
    },
  },
  // 6 — Panteón Nacional
  {
    narration: 'Lo que fue una iglesia jesuita en el siglo XVIII hoy es el sagrado recinto donde descansan los héroes de la patria dominicana. Sus bóvedas de piedra guardan los restos de quienes dieron su vida por la libertad y la dignidad de un pueblo. La llama eterna que arde en su interior no se ha apagado en décadas, símbolo del fuego inextinguible de la nación. Aquí duerme la historia que nos dio libertad.',
    questions: [
      {
        question: '¿Qué era el Panteón Nacional antes de convertirse en mausoleo?',
        options: ['Un palacio colonial', 'Una iglesia jesuita', 'Una fortaleza', 'Un convento franciscano'],
        correctIndex: 1,
      },
      {
        question: '¿Qué tipo de personajes descansan en el Panteón Nacional?',
        options: ['Artistas dominicanos', 'Héroes y próceres de la patria', 'Presidentes extranjeros', 'Religiosos coloniales'],
        correctIndex: 1,
      },
    ],
    prize: {
      name: 'Entrada Doble — Museo del Larimar',
      description: 'Dos entradas para descubrir el fascinante Museo del Larimar, piedra semipreciosa única de RD.',
      icon: '💎',
      code: 'PANTEON-007',
      validUntil: '31 Dic, 2026',
    },
  },
  // 7 — Catedral Primada de América
  {
    narration: 'La Catedral de Santa María la Menor es la más antigua catedral del continente americano, consagrada por el Papa Julio II en 1504. Sus robustas torres de coral han visto pasar conquistadores, obispos y revolucionarios a lo largo de cinco siglos. En su interior, el tiempo parece detenerse entre altares dorados y vitrales que filtran la luz del trópico. Esta es la madre de todas las iglesias americanas.',
    questions: [
      {
        question: '¿Por qué el Papa Julio II consagró la Catedral Primada de América?',
        options: ['Por ser la más grande', 'Por ser la más antigua de las Américas', 'Por ser la más costosa', 'Por ser la más alta'],
        correctIndex: 1,
      },
      {
        question: '¿En qué año fue consagrada la Catedral Primada de América?',
        options: ['1492', '1504', '1520', '1498'],
        correctIndex: 1,
      },
    ],
    prize: {
      name: '2x1 en Tour Nocturno Colonial',
      description: 'Dos entradas al tour nocturno con antorchas por la Zona Colonial. La historia cobra vida de noche.',
      icon: '🕯️',
      code: 'CATEDRAL-008',
      validUntil: '31 Dic, 2026',
    },
  },
  // 8 — Parque Colón
  {
    narration: 'El Parque Colón es el salón al aire libre de la Ciudad Colonial, presidido por la imponente estatua del Almirante Cristóbal Colón. A su alrededor, la Catedral, los cafés históricos y el murmullo eterno de la gente crean una sinfonía de vida y memoria. Aquí se han celebrado victorias, se han llorado derrotas y se ha proclamado la esperanza de un pueblo. El parque es la memoria viva de Santo Domingo.',
    questions: [
      {
        question: '¿Qué es lo más emblemático del Parque Colón?',
        options: ['Una fuente colonial', 'La estatua de Cristóbal Colón', 'Un árbol centenario', 'Un teatro histórico'],
        correctIndex: 1,
      },
      {
        question: '¿Qué función cumple el Parque Colón en la Zona Colonial?',
        options: ['Sede de gobierno', 'Centro social y de recreación', 'Mercado histórico', 'Cementerio colonial'],
        correctIndex: 1,
      },
    ],
    prize: {
      name: 'Helado Artesanal Gratis en Bon',
      description: 'Dos helados artesanales de sabores tropicales en Helados Bon, frente al Parque Colón. ¡Refréscate!',
      icon: '🍦',
      code: 'PARQUE-009',
      validUntil: '31 Dic, 2026',
    },
  },
  // 9 — Ruinas de San Francisco
  {
    narration: 'Las Ruinas del Monasterio de San Francisco, erigido en 1508, son las más antiguas del Nuevo Mundo. Terremotos, huracanes y el tiempo las convirtieron en un esqueleto de piedra que hoy se yergue majestuoso contra el cielo colonial. Los franciscanos que aquí vivían fueron los primeros misioneros que preservaron las culturas indígenas. Hoy estas ruinas acogen conciertos y el arte cobra vida entre las piedras.',
    questions: [
      {
        question: '¿En qué año fue construido el Monasterio de San Francisco?',
        options: ['1492', '1508', '1520', '1500'],
        correctIndex: 1,
      },
      {
        question: '¿A qué orden religiosa pertenecía el Monasterio de San Francisco?',
        options: ['Jesuitas', 'Dominicos', 'Franciscanos', 'Benedictinos'],
        correctIndex: 2,
      },
    ],
    prize: {
      name: 'Entrada — Concierto Cultural Gratis',
      description: 'Una entrada al próximo concierto de música colonial en las Ruinas de San Francisco. Cultura viva.',
      icon: '🎵',
      code: 'SANFRAN-010',
      validUntil: '31 Dic, 2026',
    },
  },
  // 10 — Puerta de la Misericordia
  {
    narration: 'El 27 de febrero de 1844, Matías Ramón Mella disparó su trabucazo junto a esta puerta, proclamando la independencia de la República Dominicana. Aquel sonido retumbó por toda la ciudad colonial y encendió la chispa de la libertad que tanto tiempo había esperado arder. Esta puerta de piedra, modesta en apariencia, es uno de los monumentos más cargados de significado en toda América. Aquí nació una nación libre.',
    questions: [
      {
        question: '¿Qué evento histórico ocurrió en la Puerta de la Misericordia?',
        options: ['La llegada de Colón', 'El trabucazo de Mella proclamando la Independencia', 'La firma del Tratado de París', 'La fundación de Santo Domingo'],
        correctIndex: 1,
      },
      {
        question: '¿En qué año se proclamó la Independencia en la Puerta de la Misericordia?',
        options: ['1821', '1838', '1844', '1865'],
        correctIndex: 2,
      },
    ],
    prize: {
      name: 'Mapa Histórico Enmarcado de Regalo',
      description: 'Una réplica enmarcada del mapa original de Santo Domingo del siglo XVI. Arte e historia para tu hogar.',
      icon: '🗺️',
      code: 'MISERI-011',
      validUntil: '31 Dic, 2026',
    },
  },
  // 11 — Puerta del Conde
  {
    narration: 'La Puerta del Conde es el baluarte donde el pueblo dominicano plantó su bandera por primera vez en 1844. Este símbolo de independencia y resistencia ha sobrevivido guerras, invasiones y el tiempo mismo. Desde sus almenas, los defensores de la patria juraron pelear hasta la victoria o la muerte. Hoy, la bandera tricolor sigue ondeando orgullosa sobre este monumento que vio nacer una república.',
    questions: [
      {
        question: '¿Qué importancia tiene la Puerta del Conde en la historia dominicana?',
        options: ['Fue el primer edificio colonial', 'Es un baluarte defensivo y símbolo de la Independencia', 'Es la puerta más antigua de América', 'Fue residencia del primer gobernador'],
        correctIndex: 1,
      },
      {
        question: '¿Qué tipo de estructura es la Puerta del Conde?',
        options: ['Museo Histórico', 'Catedral', 'Monumento Nacional / Baluarte', 'Palacio Colonial'],
        correctIndex: 2,
      },
    ],
    prize: {
      name: '🏆 Premio Conquistador — Cena para 2',
      description: '¡Completaste la aventura! Cena romántica para 2 en el mejor restaurante de la Zona Colonial. ¡Lo lograste!',
      icon: '🍽️',
      code: 'CONDE-FINAL',
      validUntil: '31 Dic, 2026',
    },
  },
]
