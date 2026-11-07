import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Health
  checkHealth: () => client.get('/health'),

  // Projects
  getProjects: () => client.get('/projects'),
  createProject: (data) => client.post('/projects', data),
  getProject: (id) => client.get(`/projects/${id}`),

  // Datasets
  getDatasets: (projectId) => client.get(`/datasets/project/${projectId}`),
  createDataset: (projectId, data) => client.post(`/datasets/project/${projectId}`, data),
  getTestCases: (datasetId) => client.get(`/datasets/${datasetId}/test_cases`),
  addTestCase: (datasetId, data) => client.post(`/datasets/${datasetId}/test_cases`, data),
  uploadCSV: (datasetId, formData) => client.post(`/datasets/${datasetId}/upload_csv`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Experiments
  getExperiments: (projectId) => client.get(`/experiments/project/${projectId}`),
  createExperiment: (projectId, data) => client.post(`/experiments/project/${projectId}`, data),
  getRuns: (experimentId) => client.get(`/experiments/${experimentId}/runs`),
  getRunDetails: (runId) => client.get(`/experiments/runs/${runId}`),
  getRunRecords: (runId) => client.get(`/experiments/runs/${runId}/records`),
  compareRuns: (runAId, runBId) => client.get(`/experiments/compare/${runAId}/${runBId}`),

  // Evaluation execution
  triggerRun: (payload) => client.post('/evaluate/run', payload),
};
