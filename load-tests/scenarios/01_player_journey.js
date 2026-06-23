/**
 * Escenario 1: Flujo completo del jugador
 *
 * Simula el recorrido real de un usuario:
 *   1. Cargar parada y sus preguntas
 *   2. Responder una pregunta (getCorrectAnswer)
 *   3. Registrar el intento (registerAttempt)
 *   4. Ver el leaderboard
 *
 * Stages:
 *   0m  →  2m : ramp-up a 500 VUs  (carga normal de evento)
 *   2m  →  7m : sostenido en 3000 VUs
 *   7m  →  9m : pico a 5000 VUs
 *   9m  → 12m : ramp-down a 0
 *
 * Umbrales (thresholds):
 *   - p(95) de latencia < 3s
 *   - tasa de errores HTTP < 1%
 *
 * Ejecutar:
 *   k6 run --env ENV=prod scenarios/01_player_journey.js
 *   k6 run --env ENV=local scenarios/01_player_journey.js   (emulador local)
 *
 * Para smoke test (10 VUs, 1 min):
 *   k6 run --env ENV=prod --vus 10 --duration 1m scenarios/01_player_journey.js
 */

import { sleep }       from 'k6'
import { SharedArray } from 'k6/data'
import { Trend, Rate } from 'k6/metrics'
import { callFn, assertOk } from '../helpers/firebase.js'

// ── Datos compartidos (cargados una vez) ──────────────────────────────────────

const tokens = new SharedArray('tokens', () => {
  const raw = open('../data/tokens.csv').trim().split('\n').slice(1) // skip header
  return raw.map(line => {
    const [uid, email, idToken] = line.split(',')
    return { uid, email, idToken }
  })
})

const stops = new SharedArray('stops', () =>
  JSON.parse(open('../data/stops.json'))
)

// ── Métricas personalizadas ───────────────────────────────────────────────────

const stopLoadTime     = new Trend('stop_load_duration',     true)
const attemptTime      = new Trend('register_attempt_duration', true)
const leaderboardTime  = new Trend('leaderboard_duration',   true)
const errorRate        = new Rate('errors')

// ── Opciones ─────────────────────────────────────────────────────────────────

export const options = {
  scenarios: {
    jugadores: {
      executor:  'ramping-vus',
      startVUs:  0,
      stages: [
        { duration: '2m', target: 500  },  // calentamiento
        { duration: '5m', target: 3000 },  // carga sostenida — objetivo principal
        { duration: '2m', target: 5000 },  // pico máximo
        { duration: '3m', target: 0    },  // ramp-down
      ],
    },
  },
  thresholds: {
    http_req_duration:          ['p(95)<3000'],  // 95% requests < 3s
    http_req_failed:            ['rate<0.01'],   // < 1% errores HTTP
    stop_load_duration:         ['p(95)<2500'],
    register_attempt_duration:  ['p(95)<3000'],
    leaderboard_duration:       ['p(95)<2000'],
  },
}

// ── Función principal (ejecutada por cada VU en cada iteración) ───────────────

export default function () {
  // Rotar tokens y paradas de forma determinista por VU
  const { idToken } = tokens[__VU % tokens.length]
  const stop        = stops[Math.floor(Math.random() * stops.length)]

  // ── 1. Cargar parada con preguntas ────────────────────────────────────────
  const t0  = Date.now()
  const res1 = callFn('getStopWithQuestions', { stopId: stop.id }, idToken)
  stopLoadTime.add(Date.now() - t0)

  const stopData = assertOk(res1, 'getStopWithQuestions')
  if (!stopData) { errorRate.add(1); return }
  errorRate.add(0)

  // Seleccionar la primera pregunta de la lista
  const questions = stopData.questions || []
  if (!questions.length) { sleep(1); return }

  const question     = questions[0]
  const questionId   = question.id
  const selectedIndex = Math.floor(Math.random() * (question.options?.length || 4))

  sleep(2) // usuario "lee" la pregunta

  // ── 2. Validar respuesta ──────────────────────────────────────────────────
  const res2 = callFn('getCorrectAnswer', { questionId, selectedIndex }, idToken)
  if (!assertOk(res2, 'getCorrectAnswer')) { errorRate.add(1); return }
  errorRate.add(0)

  sleep(0.5)

  // ── 3. Registrar intento ──────────────────────────────────────────────────
  const t1  = Date.now()
  const res3 = callFn('registerAttempt', {
    questionId,
    selectedIndex,
    timeMs:            Math.floor(Math.random() * 20000) + 5000, // 5-25s
    stopId:            stop.id,
    clientAnsweredAt:  Date.now(),
  }, idToken)
  attemptTime.add(Date.now() - t1)

  if (!assertOk(res3, 'registerAttempt')) { errorRate.add(1); return }
  errorRate.add(0)

  sleep(1)

  // ── 4. Ver leaderboard ────────────────────────────────────────────────────
  const t2  = Date.now()
  const res4 = callFn('getTopTen', {}, idToken)
  leaderboardTime.add(Date.now() - t2)

  if (!assertOk(res4, 'getTopTen')) { errorRate.add(1); return }
  errorRate.add(0)

  sleep(3) // pausa natural entre paradas
}
