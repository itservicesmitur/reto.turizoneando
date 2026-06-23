#!/usr/bin/env bash
# run.sh — Secuencia progresiva de load tests para Turizoneando
#
# Uso:
#   bash run.sh             # Corre la secuencia completa
#   bash run.sh smoke       # Solo smoke test (10 VUs, 1 min)
#   bash run.sh load        # Solo carga sostenida (3000 VUs)
#   bash run.sh spike       # Solo spike test (5000 VUs)
#
# Prerrequisitos:
#   brew install k6
#   cd load-tests && npm install
#   npm run setup            # genera tokens.csv y stops.json

set -euo pipefail

TARGET="${1:-all}"
ENV="${ENV:-prod}"
RESULTS_DIR="results/$(date +%Y-%m-%d_%H-%M)"
mkdir -p "$RESULTS_DIR"

K6_BASE="k6 run --env ENV=$ENV"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║        Turizoneando — k6 Load Test Suite                 ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  ENV: $ENV"
echo "║  Resultados: $RESULTS_DIR"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

smoke() {
  echo "▶  [1/4] SMOKE TEST — 10 VUs × 1 min"
  $K6_BASE --vus 10 --duration 1m \
    --out json="$RESULTS_DIR/01_smoke.json" \
    scenarios/01_player_journey.js
  echo "✅  Smoke test completado"
}

load_normal() {
  echo ""
  echo "▶  [2/4] CARGA NORMAL — 500 VUs × 5 min"
  $K6_BASE --vus 500 --duration 5m \
    --out json="$RESULTS_DIR/02_load_normal.json" \
    scenarios/01_player_journey.js
  echo "✅  Carga normal completada"
}

load_heavy() {
  echo ""
  echo "▶  [3/4] CARGA ALTA — ramp hasta 3000–5000 VUs × 12 min"
  $K6_BASE \
    --out json="$RESULTS_DIR/03_load_heavy.json" \
    scenarios/01_player_journey.js
  echo "✅  Carga alta completada"
}

leaderboard() {
  echo ""
  echo "▶  [4/4] LEADERBOARD — 2000 VUs × 7 min (solo lecturas)"
  $K6_BASE \
    --out json="$RESULTS_DIR/04_leaderboard.json" \
    scenarios/02_leaderboard.js
  echo "✅  Leaderboard test completado"
}

spike() {
  echo ""
  echo "▶  SPIKE TEST — 0→5000 VUs en 30s"
  $K6_BASE \
    --out json="$RESULTS_DIR/spike.json" \
    scenarios/03_spike.js
  echo "✅  Spike test completado"
}

case "$TARGET" in
  smoke)      smoke ;;
  load)       load_normal && load_heavy ;;
  leaderboard) leaderboard ;;
  spike)      spike ;;
  all)
    smoke
    sleep 30
    load_normal
    sleep 30
    load_heavy
    sleep 60
    leaderboard
    ;;
  *)
    echo "Uso: bash run.sh [smoke|load|leaderboard|spike|all]"
    exit 1
    ;;
esac

echo ""
echo "══════════════════════════════════════════════════════════"
echo "  Resultados guardados en: $RESULTS_DIR/"
echo "  Para analizar: k6 inspect $RESULTS_DIR/*.json"
echo "══════════════════════════════════════════════════════════"
echo ""
