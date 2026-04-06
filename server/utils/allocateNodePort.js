import { Op } from "sequelize";
import { Node } from "../models/index.js";

const MIN_PORT = 3000;
const MAX_PORT = 7999;
const MAX_ATTEMPTS = 120;

function normalizePort(p) {
  const n = Number(p);
  if (!Number.isInteger(n) || n < MIN_PORT || n > MAX_PORT) return null;
  return n;
}

/**
 * Ports already stored on any preview node row (including soft-deleted) stay
 * reserved so we never hand the same port to a new node after deletion.
 */
async function loadUsedPorts(transaction) {
  const base = {
    attributes: ["port"],
    where: {
      port: { [Op.ne]: null },
      role: { [Op.in]: ["frontend", "api_service"] },
    },
    raw: true,
  };
  const opts = transaction ? { ...base, transaction } : base;
  const rows = await Node.findAll(opts);
  const used = new Set();
  for (const row of rows) {
    const n = normalizePort(row.port);
    if (n != null) used.add(n);
  }
  return used;
}

async function countPortUsage(port, transaction) {
  return Node.count({
    where: { port },
    transaction,
  });
}

function pickPort(used) {
  for (let i = 0; i < 400; i++) {
    const p =
      Math.floor(Math.random() * (MAX_PORT - MIN_PORT + 1)) + MIN_PORT;
    if (!used.has(p)) return p;
  }
  for (let p = MIN_PORT; p <= MAX_PORT; p++) {
    if (!used.has(p)) return p;
  }
  return null;
}

/**
 * Pick a free TCP port for new preview nodes (frontend + api_service).
 * Ports are never recycled from deleted nodes while the old row still stores `port`.
 *
 * @param {import('sequelize').Transaction | null} [transaction]
 */
export async function allocateNodePort(transaction = null) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const used = await loadUsedPorts(transaction);
    const candidate = pickPort(used);
    if (candidate === null) {
      throw new Error("No free port available for preview node in range");
    }
    const inUse = await countPortUsage(candidate, transaction);
    if (inUse === 0) {
      return candidate;
    }
  }
  throw new Error("Could not allocate a unique preview port after multiple attempts");
}
