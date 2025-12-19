// ============================================
// SNACKIFY - API CLIENT MODULE
// Handles all backend API calls
// ============================================

const API_BASE_URL = 'http://localhost:4000/api';

// Get auth token
const getAuthToken = () => {
  const session = localStorage.getItem('snackify_session');
  if (!session) return null;
  const sessionData = JSON.parse(session);
  return sessionData?.access_token || null;
};

// Fetch all snacks from backend
export const fetchSnacks = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/snacks`);
    if (!response.ok) {
      throw new Error('Failed to fetch snacks');
    }
    const data = await response.json();
    // Transform backend format to frontend format
    return data.map(snack => ({
      id: snack.id,
      name: snack.name,
      country: snack.country,
      description: snack.description,
      type: snack.type,
      imageUrl: snack.imageUrl || snack.image_url,
      photographer: snack.photographer,
      tags: snack.tags || [],
      ratings: snack.ratings || snack.ratingSummary || { taste: 0, spiciness: 0, uniqueness: 0, count: 0 },
      ratingSummary: snack.ratingSummary || snack.ratings
    }));
  } catch (error) {
    console.error('Error fetching snacks:', error);
    // Fallback to local data if backend fails
    const { snacks } = await import('./data.js');
    return snacks.map(snack => ({
      ...snack,
      ratingSummary: snack.ratings
    }));
  }
};

// Fetch single snack
export const fetchSnack = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/snacks/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch snack');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching snack:', error);
    return null;
  }
};

// Submit rating
export const submitRatingToAPI = async (snackId, rating) => {
  const token = getAuthToken();
  
  try {
    const response = await fetch(`${API_BASE_URL}/snacks/${snackId}/ratings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(rating)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to submit rating');
    }

    return data;
  } catch (error) {
    console.error('Error submitting rating:', error);
    throw error;
  }
};

// Add snack
export const addSnackToAPI = async (snackData) => {
  const token = getAuthToken();
  
  try {
    const response = await fetch(`${API_BASE_URL}/snacks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(snackData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to add snack');
    }

    return data;
  } catch (error) {
    console.error('Error adding snack:', error);
    throw error;
  }
};

