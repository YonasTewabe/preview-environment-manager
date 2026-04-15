import { Node, Project, ProjectEnvProfile } from '../models/index.js';
import crypto from "crypto";

export function normalizeUrlConfigList(raw) {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
}

function nextConfigId(existing) {
  const ids = existing
    .map((c) => String(c.id ?? "").trim())
    .filter(Boolean);
  if (!ids.length) return crypto.randomUUID();
  return crypto.randomUUID();
}

class UrlConfigService {
  async createUrlConfigsFromDeployment(urlConfigs, frontendNodeId) {
    const node = await Node.findOne({
      where: { id: frontendNodeId, role: 'frontend', is_deleted: false },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'env_name', 'short_code'],
        },
        {
          model: ProjectEnvProfile,
          as: 'envProfile',
          attributes: ['name'],
          required: false,
        },
      ],
    });
    if (!node) {
      throw new Error('Frontend node not found');
    }
    const projectEnvName =
      node?.envProfile?.name ||
      node?.project?.env_name ||
      node?.project?.short_code ||
      null;

    const existing = normalizeUrlConfigList(node.url_configs);
    const merged = [...existing];

    for (const config of urlConfigs) {
      const name = config.name;
      const url = config.url;
      const idx = merged.findIndex((c) => c.name === name);
      const row = {
        id: idx >= 0 ? merged[idx].id : nextConfigId(merged),
        name,
        url,
        description: config.description || '',
        serviceType: config.serviceType || 'api',
        defaultUrl: config.defaultUrl || null,
        env_name: projectEnvName,
        is_deleted: false,
      };
      if (idx >= 0) merged[idx] = row;
      else merged.push(row);
    }

    await node.update({
      url_configs: merged,
      updated_at: new Date(),
    });

    return merged;
  }

  async getUrlConfigsByWebNode(frontendNodeId) {
    const node = await Node.findOne({
      where: { id: frontendNodeId, role: 'frontend', is_deleted: false },
      attributes: ['id', 'url_configs'],
    });
    return normalizeUrlConfigList(node?.url_configs);
  }

  async deleteUrlConfigsByWebNode(frontendNodeId) {
    const node = await Node.findOne({
      where: { id: frontendNodeId, role: 'frontend', is_deleted: false },
    });
    if (!node) return 0;
    await node.update({ url_configs: [], updated_at: new Date() });
    return 1;
  }

  /** Find frontend node that holds url config id; return { node, list, index } */
  async findConfigHolder(configId) {
    const cid = String(configId ?? "").trim();
    if (!cid) return null;
    const nodes = await Node.findAll({
      where: { role: 'frontend', is_deleted: false },
      attributes: ['id', 'url_configs'],
    });
    for (const n of nodes) {
      const list = normalizeUrlConfigList(n.url_configs);
      const idx = list.findIndex((c) => String(c.id) === cid);
      if (idx >= 0) return { node: n, list, idx };
    }
    return null;
  }

  async getUrlConfigById(configId) {
    const hit = await this.findConfigHolder(configId);
    if (!hit) return null;
    return hit.list[hit.idx];
  }

  async deleteUrlConfigById(configId) {
    const hit = await this.findConfigHolder(configId);
    if (!hit) throw new Error('URL config not found');
    const next = hit.list.filter((_, i) => i !== hit.idx);
    await Node.update(
      { url_configs: next, updated_at: new Date() },
      { where: { id: hit.node.id } },
    );
    return true;
  }

  async updateUrlConfig(configId, updateData) {
    const hit = await this.findConfigHolder(configId);
    if (!hit) throw new Error('URL config not found');
    const row = { ...hit.list[hit.idx], ...updateData, updated_at: new Date() };
    const next = [...hit.list];
    next[hit.idx] = row;
    await Node.update(
      { url_configs: next, updated_at: new Date() },
      { where: { id: hit.node.id } },
    );
    return row;
  }
}

export default new UrlConfigService();
