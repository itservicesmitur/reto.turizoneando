/**
 * Escenario 2: Lectura masiva del leaderboard
 *
 * Simula muchos usuarios consultando el ranking en tiempo real.
 * Es el escenario más común entre usuarios que NO están respondiendo activamente
 * pero están siguiendo el evento (ej: pantalla en el venue).
 *
 * Este test expone si Firestore/getTopTen se convierte en cuello de botella
 * porque computeRankings() carga TODOS los players para ordenarlos en memoria.
 *
 * Ejecutar:
 *   k6 run --env ENV=prod scenarios/02_leaderboard.js
 */

import { sleep }       from 'k6'
import { SharedArray } from 'k6/data'
import { Trend, Rate } from 'k6/metrics'
import { callFn, assertOk } from '../helpers/firebase.js'

const tokens = new SharedArray('tokens', () => {
  return open('../data/tokens.csv').trim().split('\n').slice(1).map(line => {
    const [uid, email, idToken] = line.split(',')
    return { uid, email, idToken }
  })
})

const topTenDuration   = new Trend('top_ten_duration',      true)
const myRankDuration   = new Trend('my_rank_duration',      true)
const playerStatDuration = new Trend('player_status_duration', true)
const errorRate        = new Rate('errors')

export const options = {
  scenarios: {
    lectores: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 1000 },
        { duration: '5m', target: 2000 },
        { duration: '2m', target: 0    },
      ],
    },
  },
  thresholds: {
    http_req_duration:    ['p(95)<2000'],
    http_req_failed:      ['rate<0.01'],
    top_ten_duration:     ['p(95)<1500'],
    my_rank_duration:     ['p(95)<2000'],
  },
}

export default function () {
  const { idToken } = tokens[__VU % tokens.length]

  // Top 10 global
  const t0  = Date.now()
  const res1 = callFn('getTopTen', {}, idToken)
  topTenDuration.add(Date.now() - t0)
  if (!assertOk(res1, 'getTopTen')) { errorRate.add(1) } else { errorRate.add(0) }

  sleep(1)

  // Posición propia del jugador
  const t1  = Date.now()
  const res2 = callFn('getMyPositionsRanking', {}, idToken)
  myRankDuration.add(Date.now() - t1)
  if (!assertOk(res2, 'getMyPositionsRanking')) { errorRate.add(1) } else { errorRate.add(0) }

  sleep(1)

  // Estado del jugador (progreso de paradas)
  const t2  = Date.now()
  const res3 = callFn('getPlayerStatus', {}, idToken)
  playerStatDuration.add(Date.now() - t2)
  if (!assertOk(res3, 'getPlayerStatus')) { errorRate.add(1) } else { errorRate.add(0) }

  sleep(5) // el usuario mira la pantalla unos segundos antes de refrescar
}
