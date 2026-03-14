#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
API_URL="${API_URL:-http://localhost:3001}"
DB_PATH="$ROOT_DIR/data/digital-journal.db"
COOKIE_A="$(mktemp /tmp/dj_stage1_a_XXXXXX.cookie)"
COOKIE_B="$(mktemp /tmp/dj_stage1_b_XXXXXX.cookie)"
TMP_UPLOAD_FILE="$(mktemp /tmp/dj_stage1_upload_XXXXXX.png)"
SERVER_LOG="$(mktemp /tmp/dj_stage1_server_XXXXXX.log)"
SERVER_PID=""

TS="$(date +%s)"
EMAIL_A="stage1check_a_${TS}@example.com"
EMAIL_B="stage1check_b_${TS}@example.com"
PASSWORD="Passw0rd123!"

cleanup() {
  rm -f "$COOKIE_A" "$COOKIE_B" "$TMP_UPLOAD_FILE" "$SERVER_LOG"

  if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi

  if [ -f "$DB_PATH" ]; then
    sqlite3 "$DB_PATH" "DELETE FROM user_sessions WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'stage1check_%@example.com');"
    sqlite3 "$DB_PATH" "DELETE FROM users WHERE email LIKE 'stage1check_%@example.com';"
  fi
}
trap cleanup EXIT

assert_status() {
  local expected="$1"
  local actual="$2"
  local message="$3"
  if [ "$expected" != "$actual" ]; then
    echo "[FAIL] $message (expected $expected, got $actual)"
    exit 1
  fi
}

extract_json_value() {
  local key="$1"
  sed -n "s/.*\"$key\":\"\\([^\"]*\\)\".*/\\1/p"
}

start_server() {
  (
    cd "$ROOT_DIR"
    HOST=127.0.0.1 npm run dev:server >"$SERVER_LOG" 2>&1
  ) &
  SERVER_PID="$!"

  for _ in $(seq 1 60); do
    if curl -sS "$API_URL/api/health" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.2
  done

  echo "[FAIL] Server did not become healthy"
  cat "$SERVER_LOG"
  exit 1
}

printf '%s' 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/P6nxsQAAAABJRU5ErkJggg==' \
  | openssl base64 -d -A >"$TMP_UPLOAD_FILE"
start_server

echo "[STEP] register user A"
RESP_A="$(curl -sS -c "$COOKIE_A" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL_A\",\"password\":\"$PASSWORD\",\"nickname\":\"Stage1A\"}" \
  "$API_URL/api/auth/register")"

echo "[STEP] register user B"
RESP_B="$(curl -sS -c "$COOKIE_B" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL_B\",\"password\":\"$PASSWORD\",\"nickname\":\"Stage1B\"}" \
  "$API_URL/api/auth/register")"

ID_A="$(printf '%s' "$RESP_A" | extract_json_value "id")"
ID_B="$(printf '%s' "$RESP_B" | extract_json_value "id")"

if [ -z "$ID_A" ] || [ -z "$ID_B" ]; then
  echo "[FAIL] register response missing user ids"
  echo "A: $RESP_A"
  echo "B: $RESP_B"
  exit 1
fi

echo "[STEP] create A space"
SPACE_A_RESP="$(curl -sS -b "$COOKIE_A" -H 'Content-Type: application/json' \
  -d '{"name":"Stage1 A Space","avatarImage":"https://example.com/a.jpg"}' \
  "$API_URL/api/spaces")"
SPACE_A_ID="$(printf '%s' "$SPACE_A_RESP" | extract_json_value "id")"
if [ -z "$SPACE_A_ID" ]; then
  echo "[FAIL] failed to parse A space id"
  echo "$SPACE_A_RESP"
  exit 1
fi

echo "[STEP] create B space"
SPACE_B_RESP="$(curl -sS -b "$COOKIE_B" -H 'Content-Type: application/json' \
  -d '{"name":"Stage1 B Space","avatarImage":"https://example.com/b.jpg"}' \
  "$API_URL/api/spaces")"
SPACE_B_ID="$(printf '%s' "$SPACE_B_RESP" | extract_json_value "id")"
if [ -z "$SPACE_B_ID" ]; then
  echo "[FAIL] failed to parse B space id"
  echo "$SPACE_B_RESP"
  exit 1
fi

echo "[STEP] cross-space access checks"
STATUS_A_GET_B="$(curl -sS -o /tmp/dj_stage1_a_get_b.json -w '%{http_code}' -b "$COOKIE_A" "$API_URL/api/spaces/$SPACE_B_ID")"
STATUS_B_GET_A="$(curl -sS -o /tmp/dj_stage1_b_get_a.json -w '%{http_code}' -b "$COOKIE_B" "$API_URL/api/spaces/$SPACE_A_ID")"
assert_status "404" "$STATUS_A_GET_B" "A should not read B space"
assert_status "404" "$STATUS_B_GET_A" "B should not read A space"

echo "[STEP] cross-space snapshot write check"
SNAPSHOT_PAYLOAD="$(printf '{"id":"%s","name":"x","avatarImage":"https://example.com/x.jpg","avatarFocus":{"x":50,"y":50,"scale":1},"heroImage":"https://example.com/hero.jpg","description":"x","visibility":"private","entries":[],"treeholeEntries":[]}' "$SPACE_A_ID")"
STATUS_B_WRITE_A="$(curl -sS -o /tmp/dj_stage1_b_write_a.json -w '%{http_code}' -b "$COOKIE_B" \
  -H 'Content-Type: application/json' -X PUT -d "$SNAPSHOT_PAYLOAD" "$API_URL/api/spaces/$SPACE_A_ID/full")"
assert_status "404" "$STATUS_B_WRITE_A" "B should not overwrite A snapshot"

echo "[STEP] unauthenticated spaces call"
STATUS_ANON="$(curl -sS -o /tmp/dj_stage1_anon_spaces.json -w '%{http_code}' "$API_URL/api/spaces")"
assert_status "401" "$STATUS_ANON" "Anonymous /api/spaces should be unauthorized"

echo "[STEP] upload path isolation check"
UPLOAD_RESP="$(curl -sS -b "$COOKIE_A" -F "file=@$TMP_UPLOAD_FILE;type=image/png" "$API_URL/api/uploads")"
UPLOAD_URL="$(printf '%s' "$UPLOAD_RESP" | extract_json_value "url")"
if [ -z "$UPLOAD_URL" ]; then
  echo "[FAIL] upload response missing url"
  echo "$UPLOAD_RESP"
  exit 1
fi
STATUS_B_READ_A_UPLOAD="$(curl -sS -o /tmp/dj_stage1_b_read_a_upload.bin -w '%{http_code}' -b "$COOKIE_B" "$API_URL$UPLOAD_URL")"
STATUS_A_READ_A_UPLOAD="$(curl -sS -o /tmp/dj_stage1_a_read_a_upload.bin -w '%{http_code}' -b "$COOKIE_A" "$API_URL$UPLOAD_URL")"
assert_status "404" "$STATUS_B_READ_A_UPLOAD" "B should not read A upload"
assert_status "200" "$STATUS_A_READ_A_UPLOAD" "A should read own upload"

echo "[STEP] owner_id backfill checks"
EMPTY_OWNER_COUNT="$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM spaces WHERE owner_id IS NULL OR owner_id = '';")"
if [ "$EMPTY_OWNER_COUNT" != "0" ]; then
  echo "[FAIL] spaces contains rows without owner_id"
  exit 1
fi

echo "[PASS] Stage 1 auth/isolation acceptance passed."
