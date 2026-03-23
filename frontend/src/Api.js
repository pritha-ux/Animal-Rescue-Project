import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// Auth
export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');

// Cases
export const reportCase = (data) => API.post('/cases/report', data);
export const trackCase = (caseId) => API.get(`/cases/track/${caseId}`);
export const getMyCases = () => API.get('/cases/my');
export const getAllCases = (params) => API.get('/cases', { params });
export const getCaseById = (id) => API.get(`/cases/${id}`);
export const assignVolunteer = (id, data) => API.put(`/cases/${id}/assign-volunteer`, data);
export const assignVet = (id, data) => API.put(`/cases/${id}/assign-vet`, data);
export const assignShelter = (id, data) => API.put(`/cases/${id}/assign-shelter`, data);

// Volunteer
export const getVolunteerCases = () => API.get('/volunteer/cases');
export const acceptCase = (id) => API.put(`/volunteer/cases/${id}/accept`);
export const declineCase = (id, data) => API.put(`/volunteer/cases/${id}/decline`, data);
export const markInTransit = (id) => API.put(`/volunteer/cases/${id}/transit`);
export const getVolunteerStaff = () => API.get('/volunteer/staff');
export const assignVetByVolunteer = (id, data) => API.put(`/volunteer/cases/${id}/assign-vet`, data);
export const assignShelterByVolunteer = (id, data) => API.put(`/volunteer/cases/${id}/assign-shelter`, data);

// Vet
export const getVetCases = () => API.get('/vet/cases');
export const markAtVet = (id) => API.put(`/vet/cases/${id}/arrived`);
export const addMedicalRecord = (id, data) => API.post(`/vet/cases/${id}/medical`, data);
export const markTreatmentDone = (id) => API.put(`/vet/cases/${id}/treatment-done`);
export const acceptVetCase = (id) => API.put(`/vet/cases/${id}/accept`);
export const declineVetCase = (id, data) => API.put(`/vet/cases/${id}/decline`, data);


// Shelter
export const getShelterCases = () => API.get('/shelter/cases');
export const markAtShelter = (id, data) => API.put(`/shelter/cases/${id}/admit`, data);
export const updateCareDetails = (id, data) => API.put(`/shelter/cases/${id}/care`, data);
export const markAdopted = (id, data) => API.put(`/shelter/cases/${id}/adopt`, data);
export const markReturnedToOwner = (id, data) => API.put(`/shelter/cases/${id}/return`, data);
export const acceptShelterCase = (id) => API.put(`/shelter/cases/${id}/accept`);
export const declineShelterCase = (id, data) => API.put(`/shelter/cases/${id}/decline`, data);

// Admin
export const getDashboardStats = () => API.get('/admin/dashboard');
export const getUsersByRole = (role) => API.get(`/admin/users/${role}`);
export const updateUserRole = (id, data) => API.put(`/admin/users/${id}/role`, data);
export const closeCase = (id, data) => API.put(`/admin/cases/${id}/close`, data);

// Notifications
export const getNotifications = () => API.get('/notifications');
export const markNotificationRead = (id) => API.put(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => API.put('/notifications/read-all');