import express from 'express';
import urlConfigService from '../services/urlConfigService.js';

const router = express.Router();

function resolveWebNodeId(bodyOrQuery) {
  const b = bodyOrQuery ?? {};
  const raw =
    b.webNodeId ??
    b.web_node_id ??
    b.frontnodeId ??
    b.frontnode_id;
  const n = typeof raw === 'number' ? raw : parseInt(String(raw ?? ''), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Create URL configs from deployment data
router.post('/create-from-deployment', async (req, res) => {
  try {
    const { urlConfigs } = req.body;
    const webNodeId = resolveWebNodeId(req.body);
    
    if (!urlConfigs || !Array.isArray(urlConfigs) || !webNodeId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data. urlConfigs array and webNodeId (or legacy frontnodeId) are required.'
      });
    }

    await urlConfigService.deleteUrlConfigsByWebNode(webNodeId);
    
    console.log(urlConfigs, "urlConfigs");
    const createdConfigs = await urlConfigService.createUrlConfigsFromDeployment(urlConfigs, webNodeId);
    
    res.json({
      success: true,
      data: createdConfigs,
      message: `Successfully created ${createdConfigs.length} URL configurations`,
      count: createdConfigs.length
    });
  } catch (error) {
    console.error('Error creating URL configs from deployment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create URL configs from deployment',
      error: error.message
    });
  }
});

// Get URL configs by web preview node ID
router.get('/web-node/:webNodeId', async (req, res) => {
  try {
    const { webNodeId } = req.params;
    const configs = await urlConfigService.getUrlConfigsByWebNode(parseInt(webNodeId, 10));
    
    res.json({
      success: true,
      data: configs,
      count: configs.length
    });
  } catch (error) {
    console.error('Error fetching URL configs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch URL configs',
      error: error.message
    });
  }
});

// Get URL config by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const config = await urlConfigService.getUrlConfigById(parseInt(id));
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'URL config not found'
      });
    }
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error fetching URL config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch URL config',
      error: error.message
    });
  }
});

// Update URL config
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedConfig = await urlConfigService.updateUrlConfig(parseInt(id), updateData);
    
    res.json({
      success: true,
      data: updatedConfig,
      message: 'URL config updated successfully'
    });
  } catch (error) {
    console.error('Error updating URL config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update URL config',
      error: error.message
    });
  }
});

// Delete URL config (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await urlConfigService.deleteUrlConfigById(parseInt(id, 10));
    
    res.json({
      success: true,
      message: 'URL config deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting URL config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete URL config',
      error: error.message
    });
  }
});

export default router;
