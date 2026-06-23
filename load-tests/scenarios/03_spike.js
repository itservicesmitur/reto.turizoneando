/**
 * Escenario 3: Spike test — pico repentino de tráfico
 *
 * Simula lo que pasa cuando un presentador dice "¡todos entren ya!" en un evento
 * y 5000 personas abren la app al mismo tiempo.
 *
 * El objetivo es ver:
 *   - ¿Cuántos cold starts dispara Firebase?
 *   - ¿Cuánto tarda en estabilizarse la latencia?
 *   - ¿Cuántos requests fallan en el primer minuto del pico?
 *
 * Ejecutar:
 *   k6 run --env ENV=prod scenarios/03_spike.js
 */

import { sleep }       from 'k6'
import { SharedArray } from 'k6/data'
import { Rate, Trend } from 'k6/metrics'
import { callFn, assertOk } from '../helpers/firebase.js'

const tokens = new SharedArray('tokens', () => {
  return open('../data/tokens.csv').trim().split('\n').slice(1).map(line => {
    const [uid, email, idToken] = line.split(',')
    return { uid, email, idToken }
  })
})

const stops = new SharedArray('stops', () =>
  JSON.parse(open('../data/stops.json'))
)

const errorRate    = new Rate('errors')
const spikeDuration = new Trend('spike_req_duration', true)

export const options = {
  scenarios: {
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 500  },  // baseline
        { duration: '30s', target: 5000 },  // spike instantáneo — 4500 nuevos VUs en 30s
        { duration: '3m',  target: 5000 },  // mantener el pico
        { duration: '1m',  target: 500  },  // bajar a normal
        { duration: '30s', target: 0    },  // apagar
      ],
    },
  },
  thresholds: {
    http_req_duration:  ['p(95)<5000'],   // toleramos hasta 5s durante pico
    http_req_failed:    ['rate<0.05'],    // hasta 5% de errores en spike es aceptable
    spike_req_duration: ['p(99)<8000'],   // el 99% debe responder en < 8s
  },
}

export default function () {
  const { idToken } = tokens[__VU % tokens.length]
  const stop        = stops[Math.floor(Math.random() * stops.length)]

  // Durante el spike, priorizamos la operación más importante: cargar la parada
  const t0  = Date.now()
  const res1 = callFn('getStopWithQuestions', { stopId: stop.id }, idToken)
  spikeDuration.add(Date.now() - t0)

  if (!assertOk(res1, 'getStopWithQuestions')) {
    errorRate.add(1)
    sleep(2)
    return
  }
  errorRate.add(0)

  sleep(Math.random() * 3 + 1) // comportamiento variable: 1-4s entre acciones
}
