#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
SEOC Backup API — Production-grade dual-write to PostgreSQL
Runs on localhost:8099, proxied by IIS
Features: transaction logging, retry queue, village lookup
"""

import sys, os, json, logging, time, threading, traceback
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime
import psycopg2

# ── Logging ──
LOG_DIR = os.path.join(os.path.dirname(__file__), 'logs')
os.makedirs(LOG_DIR, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(LOG_DIR, 'seoc_api.log'), encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('SEOC')

# ── Transaction Log (every insert/update is recorded) ──
TX_LOG = os.path.join(LOG_DIR, 'transactions.jsonl')

def log_transaction(action, module, record_id, status, details=None):
    entry = {
        'timestamp': datetime.now().isoformat(),
        'action': action,
        'module': module,
        'record_id': record_id,
        'status': status,
        'details': details
    }
    try:
        with open(TX_LOG, 'a', encoding='utf-8') as f:
            f.write(json.dumps(entry) + '\n')
    except:
        pass

# ── Retry Queue (failed inserts are retried) ──
RETRY_QUEUE = os.path.join(LOG_DIR, 'retry_queue.jsonl')
retry_lock = threading.Lock()

def queue_retry(module, attributes):
    with retry_lock:
        try:
            with open(RETRY_QUEUE, 'a', encoding='utf-8') as f:
                f.write(json.dumps({'module': module, 'attributes': attributes, 'queued_at': datetime.now().isoformat()}) + '\n')
        except:
            pass

def process_retry_queue():
    """Process failed inserts every 5 minutes"""
    while True:
        time.sleep(300)
        try:
            if not os.path.exists(RETRY_QUEUE):
                continue
            with retry_lock:
                with open(RETRY_QUEUE, 'r') as f:
                    items = [json.loads(line) for line in f if line.strip()]
                if not items:
                    continue

                logger.info(f"Processing {len(items)} retry items")
                remaining = []
                for item in items:
                    try:
                        _insert_to_pg(item['module'], item['attributes'])
                        log_transaction('retry_success', item['module'], None, 'ok')
                    except Exception as e:
                        remaining.append(item)
                        logger.error(f"Retry failed: {e}")

                with open(RETRY_QUEUE, 'w') as f:
                    for item in remaining:
                        f.write(json.dumps(item) + '\n')

                if items and not remaining:
                    logger.info("All retry items processed successfully")
        except Exception as e:
            logger.error(f"Retry queue error: {e}")

# Start retry thread
retry_thread = threading.Thread(target=process_retry_queue, daemon=True)
retry_thread.start()

# ── Database Config (loaded from config.json) ──
CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'config.json')
try:
    with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
        _config = json.load(f)
    DB = _config['database']
    BIND_HOST = _config.get('server', {}).get('bind_host', '127.0.0.1')
    BIND_PORT = _config.get('server', {}).get('bind_port', 8099)
except Exception as e:
    logger.error(f'Failed to load config.json: {e}. Copy config.example.json to config.json and set credentials.')
    sys.exit(1)

TABLE_MAP = {
    'lightning': 'seoc.lightning_deaths',
    'drowning': 'seoc.drowning_incidents',
    'floods': 'seoc.flood_damage',
    'calls': 'seoc.emergency_calls',
    'rescue': 'seoc.rescue_operations',
    'heatwave': 'seoc.heatwave_monitoring',
    'reservoir': 'seoc.reservoir_levels',
    'dsr': 'seoc.daily_situation_report',
    'staff': 'seoc.staff_registration',
}

SKIP_FIELDS = {'_moduleKey', '_moduleName', '_moduleIcon', '_serviceUrl',
               'objectid', 'globalid', 'OBJECTID', 'GlobalID',
               'Shape__Area', 'Shape__Length', '_latitude', '_longitude'}


def _insert_to_pg(module_key, attributes):
    """Insert a record into PostgreSQL. Raises on failure."""
    table = TABLE_MAP.get(module_key)
    if not table:
        raise ValueError(f"Unknown module: {module_key}")

    cols, vals = [], []
    for k, v in attributes.items():
        if k in SKIP_FIELDS or v is None or v == '':
            continue
        # Skip non-scalar values
        if isinstance(v, (dict, list)):
            continue
        # Convert epoch ms to date string
        if isinstance(v, (int, float)) and v > 946684800000 and v < 2524608000000:
            v = datetime.fromtimestamp(v / 1000).strftime('%Y-%m-%d')
        cols.append(k)
        vals.append(v)

    if not cols:
        raise ValueError("No valid fields to insert")

    placeholders = ', '.join(['%s'] * len(cols))
    col_str = ', '.join(cols)
    sql = f'INSERT INTO {table} ({col_str}) VALUES ({placeholders}) RETURNING id'

    conn = psycopg2.connect(**DB)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(sql, vals)
    new_id = cur.fetchone()[0]
    conn.close()
    return new_id


class SEOCHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors_headers()
        self.send_header('Content-Length', '0')
        self.end_headers()

    def do_GET(self):
        # Health check
        path = self.path.rstrip('/')
        if path == '' or path == '/health':
            try:
                conn = psycopg2.connect(**DB)
                conn.close()
                db_ok = True
            except:
                db_ok = False

            self._respond(200, {
                'status': 'running',
                'db': 'connected' if db_ok else 'disconnected',
                'uptime': time.time() - START_TIME,
                'transactions_logged': _count_lines(TX_LOG),
                'retry_queue': _count_lines(RETRY_QUEUE)
            })
        else:
            self._respond(404, {'error': 'Not found'})

    def do_POST(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length).decode('utf-8')
            data = json.loads(body)

            path = self.path.rstrip('/')

            # ── Villages endpoint ──
            if path.endswith('/villages'):
                self._handle_villages(data)
                return

            # ── Main: save record to PostgreSQL ──
            module_key = data.get('module')
            attributes = data.get('attributes', {})

            if not module_key or module_key not in TABLE_MAP:
                self._respond(400, {'error': f'Unknown module: {module_key}'})
                return

            try:
                new_id = _insert_to_pg(module_key, attributes)
                log_transaction('insert', module_key, new_id, 'ok',
                    f"{len(attributes)} fields → {TABLE_MAP[module_key]}")
                logger.info(f"Saved {TABLE_MAP[module_key]} id={new_id}")
                self._respond(200, {'success': True, 'id': new_id, 'table': TABLE_MAP[module_key]})

            except psycopg2.Error as e:
                logger.error(f"DB error for {module_key}: {e}")
                log_transaction('insert', module_key, None, 'db_error', str(e)[:200])
                # Queue for retry
                queue_retry(module_key, attributes)
                self._respond(500, {
                    'error': f'Database error (queued for retry): {str(e)[:200]}',
                    'queued': True
                })

        except json.JSONDecodeError:
            self._respond(400, {'error': 'Invalid JSON'})
        except Exception as e:
            logger.error(f"Unexpected error: {traceback.format_exc()}")
            self._respond(500, {'error': str(e)[:200]})

    def _handle_villages(self, data):
        district = data.get('district', '')
        mandal = data.get('mandal', '')
        try:
            conn = psycopg2.connect(**DB)
            cur = conn.cursor()

            # Exact match first
            cur.execute(
                "SELECT DISTINCT village FROM admin.ap_villages WHERE district=%s AND mandal=%s ORDER BY village",
                (district, mandal)
            )
            villages = [r[0] for r in cur.fetchall()]

            # Fuzzy fallback
            if not villages and mandal:
                base = mandal.split()[0]
                cur.execute(
                    "SELECT DISTINCT village FROM admin.ap_villages WHERE district=%s AND mandal LIKE %s ORDER BY village",
                    (district, f'%{base}%')
                )
                villages = [r[0] for r in cur.fetchall()]

            conn.close()
            self._respond(200, {'villages': villages, 'count': len(villages)})
        except Exception as e:
            self._respond(500, {'error': str(e)[:200], 'villages': []})

    def _cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def _respond(self, code, obj):
        body = json.dumps(obj).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self._cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        pass


def _count_lines(filepath):
    try:
        with open(filepath, 'r') as f:
            return sum(1 for _ in f)
    except:
        return 0


START_TIME = time.time()

if __name__ == '__main__':
    server = HTTPServer((BIND_HOST, BIND_PORT), SEOCHandler)
    logger.info(f'SEOC Backup API v2.0 running on http://{BIND_HOST}:{BIND_PORT}')
    logger.info(f'Transaction log: {TX_LOG}')
    logger.info(f'Retry queue: {RETRY_QUEUE}')
    server.serve_forever()
