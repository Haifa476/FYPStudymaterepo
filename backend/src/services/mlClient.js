/**
 * Thin client for the separate FastAPI ML service.
 * In the 25% build only the health check is used; /predict is a documented placeholder.
 * Failures NEVER propagate: the rest of the application must keep working (NFR-05).
 */
const { mlServiceUrl, mlTimeoutMs } = require('../config/env');

async function checkHealth() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), mlTimeoutMs);
  try {
    const res = await fetch(`${mlServiceUrl}/health`, { signal: controller.signal });
    if (!res.ok) return { available: false, reason: `ML service responded with HTTP ${res.status}` };
    const body = await res.json();
    return { available: true, service: body };
  } catch (err) {
    return { available: false, reason: err.name === 'AbortError' ? 'timeout' : 'unreachable' };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { checkHealth };
