// API service for communicating with the backend APIs
export const fetchBackendStatus = async () => {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  const response = await fetch(`${baseUrl}/api/status`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};
