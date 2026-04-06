import express from 'express';
import { Node } from '../models/index.js';
import { checkNodeServiceNameUniqueInProject } from '../utils/checkNodeServiceNameUniqueInProject.js';

const router = express.Router();

const BR = { role: 'api_branch', is_deleted: false };

function toBranchDto(b) {
  const p = b.get ? b.get({ plain: true }) : b;
  return {
    ...p,
    name: p.service_name,
    node_id: p.parent_node_id,
  };
}

// Get all branches for an API service node (parent id)
router.get('/node/:nodeId', async (req, res) => {
  try {
    const branches = await Node.findAll({
      where: {
        parent_node_id: req.params.nodeId,
        ...BR,
      },
      order: [['created_at', 'DESC']]
    });
    res.json(branches.map(toBranchDto));
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const branch = await Node.findOne({
      where: {
        id: req.params.id,
        ...BR,
      }
    });
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    res.json(toBranchDto(branch));
  } catch (error) {
    console.error('Error fetching branch:', error);
    res.status(500).json({ error: 'Failed to fetch branch' });
  }
});

router.post('/', async (req, res) => {
  try {
    const parentId = req.body.node_id ?? req.body.parent_node_id;
    const parent = await Node.findOne({
      where: { id: parentId, role: 'api_service', is_deleted: false },
    });
    if (!parent) {
      return res.status(400).json({ error: 'Parent API service node not found' });
    }
    const branchData = {
      role: 'api_branch',
      parent_node_id: parentId,
      project_id: parent.project_id,
      service_name: req.body.name || req.body.service_name,
      description: req.body.description ?? null,
      created_by: req.body.created_by || 1,
      created_at: new Date(),
      updated_at: new Date()
    };

    const nameCheck = await checkNodeServiceNameUniqueInProject(
      parent.project_id,
      branchData.service_name,
      null,
    );
    if (!nameCheck.ok) {
      return res.status(400).json({ error: nameCheck.error, field: nameCheck.field });
    }

    const branch = await Node.create(branchData);
    res.status(201).json(toBranchDto(branch));
  } catch (error) {
    console.error('Error creating branch:', error);
    res.status(500).json({ error: 'Failed to create branch', details: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updated_at: new Date()
    };
    delete updateData.node_id;
    delete updateData.name;
    if (req.body.name != null) updateData.service_name = req.body.name;

    const branch = await Node.findOne({ where: { id, ...BR } });
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    const mergedProjectId =
      updateData.project_id !== undefined ? updateData.project_id : branch.project_id;
    const nextServiceName =
      updateData.service_name !== undefined ? updateData.service_name : branch.service_name;
    const nameCheck = await checkNodeServiceNameUniqueInProject(
      mergedProjectId,
      nextServiceName,
      branch.id,
    );
    if (!nameCheck.ok) {
      return res.status(400).json({ error: nameCheck.error, field: nameCheck.field });
    }

    await branch.update(updateData);
    res.json({ message: 'Branch updated successfully', data: toBranchDto(branch) });
  } catch (error) {
    console.error('Error updating branch:', error);
    res.status(500).json({ error: 'Failed to update branch', details: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await Node.findOne({ where: { id, ...BR } });
    
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    await branch.update({ 
      is_deleted: true, 
      updated_at: new Date() 
    });
    
    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Error deleting branch:', error);
    res.status(500).json({ error: 'Failed to delete branch', details: error.message });
  }
});

router.get('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await Node.findOne({
      where: { id, ...BR },
      attributes: ['id', 'service_name', 'build_number', 'build_result', 'status', 'preview_link', 'jenkins_job_url']
    });
    
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    
    res.json({
      id: branch.id,
      name: branch.service_name,
      buildNumber: branch.build_number,
      buildResult: branch.build_result,
      status: branch.status,
      previewLink: branch.preview_link,
      jenkinsJobUrl: branch.jenkins_job_url
    });
  } catch (error) {
    console.error('Error fetching branch status:', error);
    res.status(500).json({ error: 'Failed to fetch branch status', details: error.message });
  }
});

export default router;
