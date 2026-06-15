import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue, WriteBatch } from "firebase-admin/firestore";

export const seedTestData = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }
  if ((request.auth.token.role as string | undefined)?.toLowerCase() !== "admin") {
    throw new HttpsError("permission-denied", "Access denied: Administrator privileges required.");
  }

  const db = getFirestore();

  // Guard: no duplicar semilla
  const existingSeasonSnap = await db
    .collection("seasons")
    .where("name", "==", "Temporada Demo — Zona Colonial")
    .limit(1)
    .get();
  if (!existingSeasonSnap.empty) {
    throw new HttpsError(
      "already-exists",
      "Ya existen datos de prueba. Elimina la temporada 'Temporada Demo — Zona Colonial' antes de volver a cargar."
    );
  }

  // ── 1. PREMIOS ──────────────────────────────────────────────────────────
  const prizeBatch: WriteBatch = db.batch();

  const prize1Ref = db.collection("prizes").doc();
  prizeBatch.set(prize1Ref, {
    id: prize1Ref.id,
    name: "Cena Gastronómica en Pat'e Palo",
    description: "Cena para dos personas en el restaurante más emblemático de la Zona Colonial, con vista al Mar Caribe.",
    imageUrl: "",
    categoria: "Restaurantes",
    relevance: 2,
    requiresAdult: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  const prize2Ref = db.collection("prizes").doc();
  prizeBatch.set(prize2Ref, {
    id: prize2Ref.id,
    name: "Noche en Hodelpa Nicolás de Ovando",
    description: "Una noche de hospedaje para dos en el icónico hotel boutique ubicado en la primera calle de América.",
    imageUrl: "",
    categoria: "Hoteles",
    relevance: 3,
    requiresAdult: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  const prize3Ref = db.collection("prizes").doc();
  prizeBatch.set(prize3Ref, {
    id: prize3Ref.id,
    name: "Degustación de Ron en El Mesón de Bari",
    description: "Experiencia de degustación de rones premium dominicanos para dos personas.",
    imageUrl: "",
    categoria: "Bares",
    relevance: 1,
    requiresAdult: true,
    createdAt: FieldValue.serverTimestamp(),
  });

  await prizeBatch.commit();

  // ── 2. TEMPORADA ────────────────────────────────────────────────────────
  const seasonRef = db.collection("seasons").doc();
  const seasonId = seasonRef.id;

  const stages = [
    { stageId: "stage_1", prizeRef: prize1Ref, stock: 5 },
    { stageId: "stage_2", prizeRef: prize2Ref, stock: 3 },
    { stageId: "stage_3", prizeRef: prize3Ref, stock: 8 },
  ];

  const seasonBatch: WriteBatch = db.batch();

  seasonBatch.set(seasonRef, {
    id: seasonId,
    name: "Temporada Demo — Zona Colonial",
    status: "upcoming",
    startDate: new Date("2026-07-01T00:00:00.000Z"),
    endDate: new Date("2026-09-30T23:59:59.000Z"),
    createdAt: FieldValue.serverTimestamp(),
    createdBy: request.auth.uid,
  });

  for (let i = 0; i < stages.length; i++) {
    const { stageId, prizeRef, stock } = stages[i];
    const stageRef = seasonRef.collection("stages").doc(stageId);
    seasonBatch.set(stageRef, {
      id: stageId,
      number: i + 1,
      prizeIds: [prizeRef.id],
      prizes: [{ prizeId: prizeRef.id, stock }],
      pointsCount: 3,
      createdAt: FieldValue.serverTimestamp(),
    });
    const prizeStockRef = seasonRef.collection("prizes").doc(prizeRef.id);
    seasonBatch.set(prizeStockRef, {
      id: prizeRef.id,
      stock,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  await seasonBatch.commit();

  // ── 3. PARADAS Y PREGUNTAS ───────────────────────────────────────────────
  const stopsData = [
    // Stage 1
    {
      stageId: "stage_1",
      name: "Catedral Primada de América",
      nameEn: "Cathedral of the Americas",
      narration: "Ante ti se alza la Catedral Primada de América, construida entre 1512 y 1541. Sus paredes de coral guardan siglos de historia, desde la primera misa celebrada en tierra americana hasta los secretos de la conquista española.",
      narrationEn: "Before you stands the Cathedral of the Americas, built between 1512 and 1541. Its coral walls hold centuries of history, from the first mass celebrated on American soil to the secrets of the Spanish conquest.",
      lat: 18.4731, lng: -69.8850, order: 1, active: true,
      questions: [
        {
          text: "¿En qué año fue concluida la construcción de la Catedral Primada de América?",
          textEn: "In what year was the construction of the Cathedral of the Americas completed?",
          options: ["1492", "1541", "1586", "1625"],
          optionsEn: ["1492", "1541", "1586", "1625"],
          correctIndex: 1, difficulty: "easy", points: 10, isBonus: false,
          explanation: "La Catedral Primada de América fue construida entre 1512 y 1541, siendo la primera catedral terminada en el continente americano.",
          explanationEn: "The Cathedral of the Americas was built between 1512 and 1541, being the first completed cathedral on the American continent.",
        },
        {
          text: "¿Cuál es el nombre oficial de la Catedral Primada de América?",
          textEn: "What is the official name of the Cathedral of the Americas?",
          options: ["Catedral de San Juan Bautista", "Catedral de Santa María la Menor", "Catedral de la Inmaculada Concepción", "Basílica de Nuestra Señora de la Altagracia"],
          optionsEn: ["Cathedral of Saint John the Baptist", "Cathedral of Santa María la Menor", "Cathedral of the Immaculate Conception", "Basilica of Our Lady of Altagracia"],
          correctIndex: 1, difficulty: "hard", points: 20, isBonus: true,
          explanation: "El nombre oficial es 'Catedral de Santa María la Menor', también conocida como Catedral Primada de América por ser la primera en completarse en el Nuevo Mundo.",
          explanationEn: "The official name is 'Cathedral of Santa María la Menor', also known as the Cathedral of the Americas for being the first completed in the New World.",
        },
      ],
    },
    {
      stageId: "stage_1",
      name: "Alcázar de Colón",
      nameEn: "Columbus Alcázar Palace",
      narration: "El Alcázar de Colón fue construido hacia 1510 para Diego Colón, hijo de Cristóbal Colón y virrey de las Indias. Desde este palacio se administraron las colonias del Nuevo Mundo por más de un siglo.",
      narrationEn: "The Alcázar de Colón was built around 1510 for Diego Columbus, son of Christopher Columbus and Viceroy of the Indies. From this palace, the colonies of the New World were governed for over a century.",
      lat: 18.4742, lng: -69.8874, order: 2, active: true,
      questions: [
        {
          text: "¿Para quién fue construido el Alcázar de Colón?",
          textEn: "For whom was the Alcázar de Colón built?",
          options: ["Cristóbal Colón", "Diego Colón (su hijo)", "Bartolomé Colón", "Fernando el Católico"],
          optionsEn: ["Christopher Columbus", "Diego Columbus (his son)", "Bartolomé Columbus", "Ferdinand the Catholic"],
          correctIndex: 1, difficulty: "easy", points: 10, isBonus: false,
          explanation: "El Alcázar fue construido para Diego Colón, hijo de Cristóbal Colón, quien fue el segundo Gobernador y Virrey de las Indias.",
          explanationEn: "The Alcázar was built for Diego Columbus, son of Christopher Columbus, who was the second Governor and Viceroy of the Indies.",
        },
        {
          text: "¿Cuántos años aproximadamente tardó la construcción del Alcázar de Colón?",
          textEn: "How many years did it approximately take to build the Alcázar de Colón?",
          options: ["5 años", "10 años", "20 años", "50 años"],
          optionsEn: ["5 years", "10 years", "20 years", "50 years"],
          correctIndex: 0, difficulty: "medium", points: 10, isBonus: false,
          explanation: "El Alcázar de Colón fue construido en aproximadamente 5 años, entre 1510 y 1515, siendo una obra arquitectónica notable para su época.",
          explanationEn: "The Alcázar de Colón was built in approximately 5 years, between 1510 and 1515, being a notable architectural work for its time.",
        },
      ],
    },
    {
      stageId: "stage_1",
      name: "Fortaleza Ozama",
      nameEn: "Ozama Fortress",
      narration: "La Fortaleza Ozama es la más antigua de las Américas, construida entre 1502 y 1508 a orillas del río Ozama. Su función era proteger la ciudad de ataques piratas y corsarios que amenazaban las costas caribeñas.",
      narrationEn: "The Ozama Fortress is the oldest in the Americas, built between 1502 and 1508 on the banks of the Ozama River. Its purpose was to protect the city from pirate and corsair attacks that threatened the Caribbean coasts.",
      lat: 18.4710, lng: -69.8835, order: 3, active: true,
      questions: [
        {
          text: "¿Cuál es la distinción de la Fortaleza Ozama en el continente americano?",
          textEn: "What is the distinction of the Ozama Fortress in the Americas?",
          options: ["Es la más grande", "Es la más antigua", "Es la más alta", "Es la mejor conservada"],
          optionsEn: ["It's the largest", "It's the oldest", "It's the tallest", "It's the best preserved"],
          correctIndex: 1, difficulty: "easy", points: 10, isBonus: false,
          explanation: "La Fortaleza Ozama es reconocida como la más antigua de las Américas, construida entre 1502 y 1508 por orden del rey Fernando el Católico.",
          explanationEn: "The Ozama Fortress is recognized as the oldest in the Americas, built between 1502 and 1508 by order of King Ferdinand the Catholic.",
        },
        {
          text: "¿Sobre cuál río fue construida la Fortaleza Ozama?",
          textEn: "On which river was the Ozama Fortress built?",
          options: ["Río Yaque del Norte", "Río Ozama", "Río Isabela", "Río Haina"],
          optionsEn: ["Yaque del Norte River", "Ozama River", "Isabela River", "Haina River"],
          correctIndex: 1, difficulty: "easy", points: 10, isBonus: false,
          explanation: "La Fortaleza fue estratégicamente construida a orillas del río Ozama, desde donde se podía controlar la entrada al puerto de la ciudad.",
          explanationEn: "The Fortress was strategically built on the banks of the Ozama River, from where the entrance to the city's port could be controlled.",
        },
      ],
    },
    // Stage 2
    {
      stageId: "stage_2",
      name: "Panteón Nacional",
      nameEn: "National Pantheon",
      narration: "Este imponente edificio fue originalmente construido como iglesia de los Padres Jesuitas en el siglo XVIII. En 1956 fue convertido en el Panteón Nacional, donde reposan los restos de los héroes más importantes de la patria dominicana.",
      narrationEn: "This imposing building was originally constructed as a Jesuit church in the 18th century. In 1956 it was converted into the National Pantheon, where the remains of the most important heroes of the Dominican Republic rest.",
      lat: 18.4740, lng: -69.8864, order: 1, active: true,
      questions: [
        {
          text: "¿Qué tipo de edificio era el Panteón Nacional antes de 1956?",
          textEn: "What type of building was the National Pantheon before 1956?",
          options: ["Un hospital militar", "Una iglesia de los Jesuitas", "Un tribunal de justicia", "Un almacén colonial"],
          optionsEn: ["A military hospital", "A Jesuit church", "A court of justice", "A colonial warehouse"],
          correctIndex: 1, difficulty: "medium", points: 10, isBonus: false,
          explanation: "Fue construido como iglesia de la Compañía de Jesús (Jesuitas) en el siglo XVIII. Trujillo lo mandó a restaurar y convertir en Panteón Nacional en 1956.",
          explanationEn: "It was built as a church of the Society of Jesus (Jesuits) in the 18th century. Trujillo had it restored and converted into the National Pantheon in 1956.",
        },
        {
          text: "¿En qué calle se encuentra el Panteón Nacional?",
          textEn: "On which street is the National Pantheon located?",
          options: ["Calle El Conde", "Calle Las Damas", "Calle Arzobispo Meriño", "Av. George Washington"],
          optionsEn: ["El Conde Street", "Las Damas Street", "Archbishop Meriño Street", "George Washington Ave."],
          correctIndex: 1, difficulty: "medium", points: 20, isBonus: true,
          explanation: "El Panteón Nacional se encuentra en la Calle Las Damas, considerada la primera calle construida en América, en pleno corazón de la Zona Colonial.",
          explanationEn: "The National Pantheon is located on Las Damas Street, considered the first street built in America, in the heart of the Colonial Zone.",
        },
      ],
    },
    {
      stageId: "stage_2",
      name: "Casa de las Gárgolas",
      nameEn: "House of the Gargoyles",
      narration: "La Casa de las Gárgolas es uno de los edificios más misteriosos de la Zona Colonial. Su fachada está decorada con figuras de piedra tallada que representan seres fantásticos, dándole un aspecto único y enigmático que atrae a visitantes de todo el mundo.",
      narrationEn: "The House of the Gargoyles is one of the most mysterious buildings in the Colonial Zone. Its facade is decorated with carved stone figures representing fantastical beings, giving it a unique and enigmatic appearance that attracts visitors from around the world.",
      lat: 18.4738, lng: -69.8857, order: 2, active: true,
      questions: [
        {
          text: "¿Por qué se llama 'Casa de las Gárgolas'?",
          textEn: "Why is it called the 'House of the Gargoyles'?",
          options: ["Por sus figuras de piedra tallada en la fachada", "Por los murciélagos que la habitan", "Por su arquitectura gótica oscura", "Por el apellido de su primer dueño"],
          optionsEn: ["For its carved stone figures on the facade", "For the bats that inhabit it", "For its dark Gothic architecture", "After its first owner's surname"],
          correctIndex: 0, difficulty: "easy", points: 10, isBonus: false,
          explanation: "Recibe su nombre por las figuras decorativas de piedra tallada en forma de seres fantásticos que adornan su fachada colonial.",
          explanationEn: "It gets its name from the decorative carved stone figures in the shape of fantastical beings that adorn its colonial facade.",
        },
        {
          text: "¿En qué siglo fue construida la Casa de las Gárgolas?",
          textEn: "In which century was the House of the Gargoyles built?",
          options: ["Siglo XV", "Siglo XVI", "Siglo XVII", "Siglo XVIII"],
          optionsEn: ["15th century", "16th century", "17th century", "18th century"],
          correctIndex: 1, difficulty: "medium", points: 10, isBonus: false,
          explanation: "Fue construida durante el siglo XVI, en el período de máximo esplendor colonial de Santo Domingo como capital del Nuevo Mundo.",
          explanationEn: "It was built during the 16th century, in the period of Santo Domingo's greatest colonial splendor as capital of the New World.",
        },
      ],
    },
    {
      stageId: "stage_2",
      name: "Torre del Homenaje",
      nameEn: "Tower of Homage",
      narration: "La Torre del Homenaje, dentro de la Fortaleza Ozama, es la estructura defensiva más antigua en pie de todo el continente americano. Desde su cima se tiene una vista privilegiada del río Ozama y las aguas del Mar Caribe.",
      narrationEn: "The Tower of Homage, within the Ozama Fortress, is the oldest standing defensive structure in all of the Americas. From its top, you have a privileged view of the Ozama River and the waters of the Caribbean Sea.",
      lat: 18.4713, lng: -69.8836, order: 3, active: true,
      questions: [
        {
          text: "¿Dentro de qué recinto se encuentra la Torre del Homenaje?",
          textEn: "Within which complex is the Tower of Homage located?",
          options: ["Alcázar de Colón", "Fortaleza Ozama", "Panteón Nacional", "Catedral Primada"],
          optionsEn: ["Alcázar de Colón", "Ozama Fortress", "National Pantheon", "Cathedral of the Americas"],
          correctIndex: 1, difficulty: "easy", points: 10, isBonus: false,
          explanation: "La Torre del Homenaje forma parte del complejo de la Fortaleza Ozama y es la estructura defensiva más antigua en pie en toda América.",
          explanationEn: "The Tower of Homage is part of the Ozama Fortress complex and is the oldest standing defensive structure in all of the Americas.",
        },
        {
          text: "¿Cuál fue el uso principal de la Torre del Homenaje durante la colonia?",
          textEn: "What was the primary use of the Tower of Homage during the colonial period?",
          options: ["Era un almacén de armas", "Era una prisión y punto de vigilancia militar", "Era la residencia del gobernador", "Era un lugar de culto religioso"],
          optionsEn: ["It was a weapons storage", "It was a prison and military lookout", "It was the governor's residence", "It was a place of religious worship"],
          correctIndex: 1, difficulty: "hard", points: 20, isBonus: true,
          explanation: "Servía como prisión para prisioneros importantes y como punto estratégico de vigilancia militar para defender el puerto y la ciudad.",
          explanationEn: "It served as a prison for important prisoners and as a strategic military lookout to defend the port and the city.",
        },
      ],
    },
    // Stage 3
    {
      stageId: "stage_3",
      name: "Ruinas del Monasterio de San Francisco",
      nameEn: "Ruins of the San Francisco Monastery",
      narration: "Las Ruinas del Monasterio de San Francisco son testimonio del primer monasterio construido en América, edificado en el siglo XVI por la Orden Franciscana. Terremotos y el paso del tiempo han reducido esta gran obra a unas ruinas majestuosas que hoy se usan para espectáculos culturales.",
      narrationEn: "The Ruins of the San Francisco Monastery bear witness to the first monastery built in America, erected in the 16th century by the Franciscan Order. Earthquakes and the passage of time have reduced this great work to majestic ruins now used for cultural events.",
      lat: 18.4758, lng: -69.8853, order: 1, active: true,
      questions: [
        {
          text: "¿En qué estado se encuentra actualmente el Monasterio de San Francisco?",
          textEn: "In what state is the San Francisco Monastery currently?",
          options: ["Es un museo activo", "Es una iglesia en uso regular", "Son ruinas históricas", "Es una escuela de artes"],
          optionsEn: ["It's an active museum", "It's a regularly used church", "It's historical ruins", "It's an arts school"],
          correctIndex: 2, difficulty: "easy", points: 10, isBonus: false,
          explanation: "El Monasterio quedó en ruinas a causa de terremotos y fue usado como manicomio. Hoy sus ruinas son un espacio cultural al aire libre.",
          explanationEn: "The Monastery was left in ruins by earthquakes and was used as a mental asylum. Today its ruins serve as an open-air cultural space.",
        },
        {
          text: "¿Qué orden religiosa construyó el Monasterio de San Francisco?",
          textEn: "Which religious order built the San Francisco Monastery?",
          options: ["Los Dominicos", "Los Franciscanos", "Los Jesuitas", "Los Benedictinos"],
          optionsEn: ["The Dominicans", "The Franciscans", "The Jesuits", "The Benedictines"],
          correctIndex: 1, difficulty: "easy", points: 10, isBonus: false,
          explanation: "Fue construido por la Orden Franciscana en el siglo XVI, convirtiéndose en el primer convento de la Orden en el Nuevo Mundo.",
          explanationEn: "It was built by the Franciscan Order in the 16th century, becoming the first convent of the Order in the New World.",
        },
      ],
    },
    {
      stageId: "stage_3",
      name: "Puerta de la Misericordia",
      nameEn: "Gate of Mercy",
      narration: "La Puerta de la Misericordia es el lugar más sagrado de la historia dominicana. Aquí, en la madrugada del 27 de febrero de 1844, Francisco del Rosario Sánchez disparó el primer cañonazo que proclamó la independencia de la República Dominicana.",
      narrationEn: "The Gate of Mercy is the most sacred place in Dominican history. Here, in the early morning of February 27, 1844, Francisco del Rosario Sánchez fired the first cannon shot that proclaimed the independence of the Dominican Republic.",
      lat: 18.4743, lng: -69.8906, order: 2, active: true,
      questions: [
        {
          text: "¿Qué evento histórico ocurrió en la Puerta de la Misericordia el 27 de febrero de 1844?",
          textEn: "What historical event occurred at the Gate of Mercy on February 27, 1844?",
          options: ["La llegada de los colonizadores españoles", "El primer cañonazo que inició la Independencia Dominicana", "La firma del tratado de paz con España", "El inicio de la Era de Trujillo"],
          optionsEn: ["The arrival of Spanish colonizers", "The first cannon shot that started Dominican Independence", "The signing of the peace treaty with Spain", "The beginning of the Trujillo Era"],
          correctIndex: 1, difficulty: "easy", points: 10, isBonus: false,
          explanation: "El 27 de febrero de 1844, Francisco del Rosario Sánchez disparó el primer cañonazo desde aquí, dando inicio a la proclamación de la independencia dominicana.",
          explanationEn: "On February 27, 1844, Francisco del Rosario Sánchez fired the first cannon shot from here, initiating the proclamation of Dominican independence.",
        },
        {
          text: "¿Quién disparó el primer cañonazo en la Puerta de la Misericordia?",
          textEn: "Who fired the first cannon shot at the Gate of Mercy?",
          options: ["Juan Pablo Duarte", "Ramón Mella", "Francisco del Rosario Sánchez", "Pedro Santana"],
          optionsEn: ["Juan Pablo Duarte", "Ramón Mella", "Francisco del Rosario Sánchez", "Pedro Santana"],
          correctIndex: 2, difficulty: "hard", points: 20, isBonus: true,
          explanation: "Francisco del Rosario Sánchez fue quien disparó el cañonazo, siendo uno de los Padres de la Patria junto a Juan Pablo Duarte y Ramón Mella.",
          explanationEn: "Francisco del Rosario Sánchez was the one who fired the cannon shot, being one of the Founding Fathers alongside Juan Pablo Duarte and Ramón Mella.",
        },
      ],
    },
    {
      stageId: "stage_3",
      name: "Calle El Conde",
      nameEn: "El Conde Street",
      narration: "La Calle El Conde es la arteria principal de la Zona Colonial. Peatonal y vibrante, conecta la Puerta del Conde con el Parque Colón, pasando por tiendas, cafés y monumentos que narran siglos de historia dominicana.",
      narrationEn: "El Conde Street is the main artery of the Colonial Zone. Pedestrian and vibrant, it connects the El Conde Gate with Columbus Park, passing through shops, cafes, and monuments that narrate centuries of Dominican history.",
      lat: 18.4737, lng: -69.8872, order: 3, active: true,
      questions: [
        {
          text: "¿Cuál es el principal uso actual de la Calle El Conde?",
          textEn: "What is the main current use of El Conde Street?",
          options: ["Es una calle vehicular exclusiva", "Es la principal calle peatonal y comercial de la Zona Colonial", "Es una zona residencial histórica", "Es un paseo marítimo costero"],
          optionsEn: ["It's an exclusive vehicular street", "It's the main pedestrian and commercial street of the Colonial Zone", "It's a historic residential area", "It's a coastal boardwalk"],
          correctIndex: 1, difficulty: "easy", points: 10, isBonus: false,
          explanation: "La Calle El Conde es la principal arteria peatonal de la Zona Colonial, llena de comercios, restaurantes y monumentos históricos.",
          explanationEn: "El Conde Street is the main pedestrian artery of the Colonial Zone, filled with shops, restaurants, and historical monuments.",
        },
        {
          text: "¿Qué monumento al final de la Calle El Conde está ligado al inicio de la independencia dominicana?",
          textEn: "What monument at the end of El Conde Street is linked to the beginning of Dominican independence?",
          options: ["La Catedral Primada", "La Puerta del Conde", "El Alcázar de Colón", "El Panteón Nacional"],
          optionsEn: ["The Cathedral of the Americas", "The El Conde Gate", "The Alcázar de Colón", "The National Pantheon"],
          correctIndex: 1, difficulty: "medium", points: 10, isBonus: false,
          explanation: "La Puerta del Conde es donde la bandera dominicana fue izada por primera vez el 27 de febrero de 1844, simbolizando el nacimiento de la República Dominicana.",
          explanationEn: "The El Conde Gate is where the Dominican flag was raised for the first time on February 27, 1844, symbolizing the birth of the Dominican Republic.",
        },
      ],
    },
  ];

  let stopsCreated = 0;
  let questionsCreated = 0;

  // Write stops and questions in batches of 500 ops max
  const stopsBatch: WriteBatch = db.batch();

  for (const stopData of stopsData) {
    const { questions, ...stopFields } = stopData;
    const stopRef = db.collection("stops").doc();

    stopsBatch.set(stopRef, {
      ...stopFields,
      seasonIds: [seasonId],
      imageUrl: "",
      audioUrl: "",
      audioUrlEn: "",
      createdAt: FieldValue.serverTimestamp(),
    });
    stopsCreated++;

    for (const q of questions) {
      const qRef = db.collection("questions").doc();
      stopsBatch.set(qRef, {
        ...q,
        stopId: stopRef.id,
        createdAt: FieldValue.serverTimestamp(),
      });
      questionsCreated++;
    }
  }

  await stopsBatch.commit();

  return {
    success: true,
    seasonId,
    prizesCreated: 3,
    stopsCreated,
    questionsCreated,
  };
});
