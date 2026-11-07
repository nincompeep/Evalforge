import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../services/api';

export const fetchInitialData = createAsyncThunk(
  'eval/fetchInitialData',
  async (_, { rejectWithValue }) => {
    try {
      const projRes = await api.getProjects();
      const projects = projRes.data;
      if (!projects.length) return { projects: [], activeProject: null, datasets: [], experiments: [], runs: [] };

      const activeProject = projects[0];
      const [dsRes, expRes] = await Promise.all([
        api.getDatasets(activeProject.id),
        api.getExperiments(activeProject.id)
      ]);

      let runs = [];
      if (expRes.data.length > 0) {
        const runRes = await api.getRuns(expRes.data[0].id);
        runs = runRes.data;
      }

      return {
        projects,
        activeProject,
        datasets: dsRes.data,
        experiments: expRes.data,
        runs
      };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const triggerEvaluationRun = createAsyncThunk(
  'eval/triggerRun',
  async (payload, { rejectWithValue, dispatch, getState }) => {
    try {
      const res = await api.triggerRun(payload);
      // Refresh runs for the experiment
      const runsRes = await api.getRuns(payload.experiment_id);
      return { newRun: res.data, runs: runsRes.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || err.message);
    }
  }
);

export const compareTwoRuns = createAsyncThunk(
  'eval/compareRuns',
  async ({ runAId, runBId }, { rejectWithValue }) => {
    try {
      const res = await api.compareRuns(runAId, runBId);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const evalSlice = createSlice({
  name: 'eval',
  initialState: {
    projects: [],
    activeProject: null,
    datasets: [],
    activeDataset: null,
    experiments: [],
    activeExperiment: null,
    runs: [],
    selectedRun: null,
    selectedRunRecords: [],
    comparisonData: null,
    activeTab: 'dashboard', // 'dashboard', 'runs', 'compare', 'datasets', 'inspector'
    isLoading: false,
    isRunningEval: false,
    error: null,
  },
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    setActiveProject: (state, action) => {
      state.activeProject = action.payload;
    },
    setActiveDataset: (state, action) => {
      state.activeDataset = action.payload;
    },
    setActiveExperiment: (state, action) => {
      state.activeExperiment = action.payload;
    },
    setSelectedRun: (state, action) => {
      state.selectedRun = action.payload;
    },
    setSelectedRunRecords: (state, action) => {
      state.selectedRunRecords = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Initial Data
      .addCase(fetchInitialData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchInitialData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.payload.projects;
        state.activeProject = action.payload.activeProject;
        state.datasets = action.payload.datasets;
        state.experiments = action.payload.experiments;
        state.runs = action.payload.runs;
        if (state.datasets.length > 0) state.activeDataset = state.datasets[0];
        if (state.experiments.length > 0) state.activeExperiment = state.experiments[0];
        if (state.runs.length > 0) state.selectedRun = state.runs[0];
      })
      .addCase(fetchInitialData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Trigger Run
      .addCase(triggerEvaluationRun.pending, (state) => {
        state.isRunningEval = true;
        state.error = null;
      })
      .addCase(triggerEvaluationRun.fulfilled, (state, action) => {
        state.isRunningEval = false;
        state.runs = action.payload.runs;
        state.selectedRun = action.payload.newRun;
        state.activeTab = 'dashboard';
      })
      .addCase(triggerEvaluationRun.rejected, (state, action) => {
        state.isRunningEval = false;
        state.error = action.payload;
      })
      // Compare Runs
      .addCase(compareTwoRuns.fulfilled, (state, action) => {
        state.comparisonData = action.payload;
      });
  }
});

export const {
  setActiveTab,
  setActiveProject,
  setActiveDataset,
  setActiveExperiment,
  setSelectedRun,
  setSelectedRunRecords,
  clearError
} = evalSlice.actions;

export default evalSlice.reducer;
