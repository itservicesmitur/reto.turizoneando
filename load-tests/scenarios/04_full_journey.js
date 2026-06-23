/**
 * Escenario 4: Flujo completo del jugador — 2,000 VUs en red móvil
 *
 * Replica exactamente lo que hace un usuario real:
 *
 *   [Primera vez - iter 0 de cada VU]
 *   1. Registrarse: crea doc en /players en Firestore (simula completar el perfil)
 *
 *   [Cada iteración]
 *   2. Cargar el mapa → getPlayerStatus (ve sus etapas y paradas disponibles)
 *   3. Elegir una parada de la etapa actual
 *   4. Abrir la parada → getStopWithQuestions (carga preguntas)
 *   5. Responder TODAS las preguntas → registerAttempt × N (una por pregunta)
 *   6. Ver ranking global → getTopTen
 *   7. Ver su posición personal → getMyPositionsRanking
 *   8. Caminar a la siguiente parada (think time: 6-12s)
 *   9. Repetir desde paso 2
 *
 * Red móvil simulada con tiempos de pausa realistas:
 *   - 4-9s  : leer la narración de la parada
 *   - 3-8s  : leer y responder cada pregunta
 *   - 2-4s  : leer el feedback de la respuesta
 *   - 6-12s : caminar entre paradas / navegar el mapa
 *
 * Carga:
 *   0m → 3m  : rampa suave a 500 VUs
 *   3m → 8m  : rampa a 2,000 VUs
 *   8m → 12m : 2,000 VUs sostenidos ← momento crítico
 *  12m → 15m : ramp-down a 0
 *
 * Umbrales (thresholds):
 *   p95 latencia  < 4s  (mobile data tiene overhead mayor)
 *   p99 latencia  < 8s
 *   errores HTTP  < 2%
 *
 * Ejecutar:
 *   k6 run --env ENV=prod load-tests/scenarios/04_full_journey.js
 *
 * Smoke test antes del test completo (20 VUs, 2 min):
 *   k6 run --env ENV=prod --vus 20 --duration 2m load-tests/scenarios/04_full_journey.js
 */

import { sleep }       from 'k6'
import { SharedArray } from 'k6/data'
import { Trend, Rate, Counter } from 'k6/metrics'
import { callFn, assertOk, firestoreUpsert } from '../helpers/firebase.js'

// ── Datos compartidos (cargados una vez para todos los VUs) ───────────────────

const tokens = new SharedArray('tokens', () => {
  const raw = open('../data/tokens.csv').trim().split('\n').slice(1) // skip header
  return raw.map(line => {
    const parts = line.split(',')
    return { uid: parts[0], email: parts[1], idToken: parts[2] }
  }).filter(u => u.uid && u.email && u.idToken)
})

const stops = new SharedArray('stops', () =>
  JSON.parse(open('../data/stops.json'))
)

// ── Métricas personalizadas ───────────────────────────────────────────────────

const registerTime     = new Trend('player_register_duration', true)
const mapLoadTime      = new Trend('map_load_duration',        true)
const stopLoadTime     = new Trend('stop_load_duration',       true)
const attemptTime      = new Trend('register_attempt_duration', true)
const leaderboardTime  = new Trend('leaderboard_duration',     true)
const questionsAnswered = new Counter('questions_answered_total')
const stopsCompleted   = new Counter('stops_completed_total')
const errorRate        = new Rate('errors')

// ── Opciones ──────────────────────────────────────────────────────────────────

export const options = {
  scenarios: {
    jugadores: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '3m',  target: 500  },  // calentamiento gradual
        { duration: '5m',  target: 2000 },  // rampa al objetivo
        { duration: '4m',  target: 2000 },  // 2,000 VUs sostenidos — momento clave
        { duration: '3m',  target: 0    },  // ramp-down
      ],
      gracefulStop: '30s',
    },
  },

  thresholds: {
    http_req_duration:             ['p(95)<4000', 'p(99)<8000'],
    http_req_failed:               ['rate<0.02'],
    player_register_duration:      ['p(95)<5000'],
    map_load_duration:             ['p(95)<5000'],
    stop_load_duration:            ['p(95)<3000'],
    register_attempt_duration:     ['p(95)<4000'],
    leaderboard_duration:          ['p(95)<2500'],
    errors:                        ['rate<0.02'],
  },

  userAgent: 'TurizoneandoApp/1.0 (Mobile)',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function thinkTime(minSec, maxSec) {
  sleep(minSec + Math.random() * (maxSec - minSec))
}

// Genera un nombre de jugador a partir del índice del VU
function playerName(vu) {
  const names = ['Carlos','María','José','Ana','Luis','Laura','Pedro','Sofia','Diego','Valentina']
  return names[vu % names.length]
}

// Registra al jugador en la colección /players de Firestore.
// Se llama solo en la primera iteración de cada VU (__ITER === 0).
function registerPlayer(uid, email, idToken, vu) {
  const t = Date.now()
  const ok = firestoreUpsert('players', uid, {
    uid,
    displayName:   `${playerName(vu)} Test`,
    firstName:     playerName(vu),
    lastName:      'Test',
    email,
    gender:        vu % 2 === 0 ? 'male' : 'female',
    nationality:   'US',
    ageRange:      '18-35',
    preferredLang: vu % 3 === 0 ? 'en' : 'es',
    emailVerified: true,
  }, idToken)
  registerTime.add(Date.now() - t)

  if (!ok) { errorRate.add(1); return false }
  errorRate.add(0)
  return true
}

// Responde una pregunta y registra el intento en Firestore via Cloud Function.
function answerQuestion(question, stop, seasonId, idToken, vu) {
  // Simular que el jugador lee la pregunta antes de responder
  thinkTime(3, 8)

  const selectedIndex = Math.floor(Math.random() * (question.options?.length || 4))
  const timeMs = Math.floor(Math.random() * 18000) + 3000 // 3-21 segundos

  const t = Date.now()
  const res = callFn('registerAttempt', {
    questionId:       question.id,
    selectedIndex,
    timeMs,
    seasonId,
    stopId:           stop.id,
    clientAnsweredAt: Date.now(),
  }, idToken)
  attemptTime.add(Date.now() - t)

  const result = assertOk(res, 'registerAttempt')
  if (!result) {
    errorRate.add(1)
    console.log(`[VU ${vu}] ❌ Error al registrar intento para la pregunta ${question.id}`)
    return false
  }
  errorRate.add(0)
  questionsAnswered.add(1)

  const isCorrect = result.correct === true
  console.log(`[VU ${vu}] ❓ Pregunta ${question.id}: Opción ${selectedIndex} -> ${isCorrect ? '✅ CORRECTA' : '❌ INCORRECTA'} (Puntos: ${result.pointsAwarded || 0})`)

  // El jugador lee el feedback (correct/incorrect + explicación)
  thinkTime(2, 4)
  return true
}

// ── Función principal (ejecutada por cada VU en cada iteración) ───────────────

export default function () {
  const vuIndex       = (__VU - 1) % tokens.length
  const { uid, email, idToken } = tokens[vuIndex]

  // ── PASO 1: Registro del jugador (solo la primera vez que entra) ──────────
  if (__ITER === 0) {
    thinkTime(3, 6)
    console.log(`[VU ${__VU}] 👤 Registrando/actualizando jugador: ${email}...`)
    const registered = registerPlayer(uid, email, idToken, __VU)
    if (!registered) {
      console.log(`[VU ${__VU}] ❌ Falló el registro/actualización de ${email}`)
      return
    }
    console.log(`[VU ${__VU}] 👤 Registro listo para ${email}`)
  }

  // ── PASO 2: Cargar el mapa — ver etapas y paradas ────────────────────────
  const t0 = Date.now()
  console.log(`[VU ${__VU}] 🗺️ Cargando mapa (getPlayerStatus)...`)
  const statusRes = callFn('getPlayerStatus', {}, idToken)
  mapLoadTime.add(Date.now() - t0)

  const status = assertOk(statusRes, 'getPlayerStatus')
  if (!status) {
    errorRate.add(1)
    console.log(`[VU ${__VU}] ❌ Falló getPlayerStatus`)
    return
  }
  errorRate.add(0)

  // El jugador mira el mapa y decide qué parada visitar
  thinkTime(3, 7)

  // ── PASO 3: Elegir una parada ─────────────────────────────────────────────
  if (!stops.length) { sleep(2); return }

  // Distribuir carga entre paradas: cada VU empieza en una parada distinta
  // pero elige aleatoriamente entre las disponibles en cada iteración
  const stopIndex = (__VU + __ITER + Math.floor(Math.random() * stops.length)) % stops.length
  const stop = stops[stopIndex]
  console.log(`[VU ${__VU}] 📍 Parada seleccionada: ${stop.name} (${stop.id})`)

  // ── PASO 4: Abrir la parada — cargar preguntas ───────────────────────────
  const t1 = Date.now()
  console.log(`[VU ${__VU}] ❓ Cargando preguntas para la parada ${stop.id}...`)
  const stopRes = callFn('getStopWithQuestions', { stopId: stop.id }, idToken)
  stopLoadTime.add(Date.now() - t1)

  const stopData = assertOk(stopRes, 'getStopWithQuestions')
  if (!stopData) {
    errorRate.add(1)
    console.log(`[VU ${__VU}] ❌ Falló getStopWithQuestions para parada ${stop.id}`)
    return
  }
  errorRate.add(0)

  const questions = stopData.questions || []
  const seasonId  = stopData.stop?.seasonId || ''

  if (!questions.length || !seasonId) {
    console.log(`[VU ${__VU}] ⚠ Parada ${stop.id} no tiene preguntas o seasonId. Volviendo al mapa...`)
    thinkTime(2, 4)
    return
  }

  // El jugador escucha/lee la narración de la parada antes de las preguntas
  thinkTime(4, 9)

  // ── PASO 5: Responder TODAS las preguntas de la parada ───────────────────
  // Las preguntas normales primero, bonus al final (ya ordenadas por el servidor)
  let allAnswered = true
  for (let qi = 0; qi < questions.length; qi++) {
    const ok = answerQuestion(questions[qi], stopData.stop, seasonId, idToken, __VU)
    if (!ok) {
      allAnswered = false
      break
    }
  }

  if (allAnswered) {
    stopsCompleted.add(1)
    console.log(`[VU ${__VU}] 🎉 Parada ${stop.id} completada exitosamente por completo.`)
  }

  // El jugador ve el resumen de la parada y decide qué hacer
  thinkTime(2, 5)

  // ── PASO 6: Ver ranking global ────────────────────────────────────────────
  const t2 = Date.now()
  console.log(`[VU ${__VU}] 🏆 Consultando ranking global (getTopTen)...`)
  const leaderRes = callFn('getTopTen', {}, idToken)
  leaderboardTime.add(Date.now() - t2)

  if (!assertOk(leaderRes, 'getTopTen')) {
    errorRate.add(1)
    console.log(`[VU ${__VU}] ❌ Falló getTopTen`)
  } else {
    errorRate.add(0)
  }

  // ── PASO 7: Ver su posición personal ─────────────────────────────────────
  thinkTime(1, 3)

  console.log(`[VU ${__VU}] 🥇 Consultando posición personal (getMyPositionsRanking)...`)
  const rankRes = callFn('getMyPositionsRanking', {}, idToken)
  if (!assertOk(rankRes, 'getMyPositionsRanking')) {
    errorRate.add(1)
    console.log(`[VU ${__VU}] ❌ Falló getMyPositionsRanking`)
  } else {
    errorRate.add(0)
  }

  // ── PASO 8: Caminar a la siguiente parada ─────────────────────────────────
  // En un evento real esto son minutos, en el test usamos 6-12s para mantener
  // carga sostenida y que k6 tenga tiempo de rampar a los 2,000 VUs
  console.log(`[VU ${__VU}] 🚶 Caminando a la siguiente parada (esperando think time)...`)
  thinkTime(6, 12)
}
