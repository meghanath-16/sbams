// API service for communicating with the backend APIs
export const fetchBackendStatus = async () => {
  const response = await fetch('/api/status');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};
