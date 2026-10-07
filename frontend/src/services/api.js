import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = error.response?.data?.message || error.message || 'API request failed';
    if (error.response?.data?.details?.validation_errors) {
      message = error.response.data.details.validation_errors
        .map((e) => `${e.field}: ${e.message}`)
        .join(', ');
    }
    return Promise.reject(new Error(message));
  }
);

export const createJob = async (payload) => {
  return apiClient.post('/jobs', payload);
};

export const getJobs = async (params = {}) => {
  return apiClient.get('/jobs', { params });
};

export const getJob = async (jobId) => {
  return apiClient.get(`/jobs/${jobId}`);
};

export const getJobCertificates = async (jobId, params = {}) => {
  return apiClient.get(`/jobs/${jobId}/certificates`, { params });
};

export const getCertificates = async (params = {}) => {
  return apiClient.get('/certificates', { params });
};

export const getCertificate = async (certificateId) => {
  return apiClient.get(`/certificates/${certificateId}?format=json`);
};

export const getPdfUrl = (certificateId) => {
  return `${API_BASE_URL}/certificates/${certificateId}`;
};

export const getPdfViewUrl = getPdfUrl;

export const getDownloadUrl = (certificateId) => {
  return `${API_BASE_URL}/certificates/${certificateId}/download`;
};

export const downloadCertificate = async (certificateId, filename = null) => {
  const url = `${API_BASE_URL}/certificates/${certificateId}/download`;
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename || `certificate_${certificateId}.pdf`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const retryFailedCertificates = async (jobId) => {
  return apiClient.post(`/jobs/${jobId}/retry-failed`);
};

export const getZipDownloadUrl = (jobId) => {
  return `${API_BASE_URL}/jobs/${jobId}/download-zip`;
};

export const getStats = async () => {
  return apiClient.get('/stats');
};

export const deleteJob = async (jobId) => {
  return apiClient.delete(`/jobs/${jobId}`);
};

export const getHealth = async () => {
  return apiClient.get('/health');
};

export default {
  createJob,
  getJobs,
  getJob,
  deleteJob,
  getJobCertificates,
  getCertificates,
  getCertificate,
  downloadCertificate,
  getPdfUrl,
  retryFailedCertificates,
  getZipDownloadUrl,
  getStats,
  getHealth,
};

