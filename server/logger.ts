import fs from 'fs';
import path from 'path';

const LOGS_DIR = path.resolve(process.cwd(), 'logs');
const AUDIT_LOG = path.join(LOGS_DIR, 'audit.log');
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

function ensureLogsDir() {
  try {
    if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });
  } catch (e) {
    // ignore
  }
}

function rotateIfNeeded() {
  try {
    if (!fs.existsSync(AUDIT_LOG)) return;
    const st = fs.statSync(AUDIT_LOG);
    if (st.size > MAX_BYTES) {
      const dest = AUDIT_LOG + '.' + Date.now();
      fs.renameSync(AUDIT_LOG, dest);
    }
  } catch (e) {
    // ignore rotation errors silently
  }
}

export function logAudit(obj: Record<string, any>) {
  try {
    ensureLogsDir();
    const payload = { ...obj, timestamp: new Date().toISOString() };
    const line = JSON.stringify(payload) + '\n';
    fs.appendFileSync(AUDIT_LOG, line, { encoding: 'utf8' });
    rotateIfNeeded();
  } catch (e) {
    // best effort
    // fallback to console
    try { console.error('[logger:error]', e); } catch (_) {}
  }
}

export default { logAudit };
