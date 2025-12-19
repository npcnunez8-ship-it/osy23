// ============================================
// SNACKIFY - RATING MODULE
// Handles rating system with backend API
// ============================================

import { getSnackById } from './data.js';

const API_BASE_URL = 'http://localhost:4000/api';

// Get auth token
const getAuthToken = () => {
    const session = localStorage.getItem('snackify_session');
    if (!session) return null;
    const sessionData = JSON.parse(session);
    return sessionData?.access_token || null;
};

// Get ratings for a snack from backend
export const getSnackRatings = async (snackId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/snacks/${snackId}/ratings`);
        if (!response.ok) return null;
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching ratings:', error);
        return null;
    }
};

// Calculate average ratings for a snack (from backend data)
export const calculateAverageRatings = (snack) => {
    // Use ratingSummary from backend if available
    if (snack.ratingSummary) {
        return snack.ratingSummary;
    }
    
    // Fallback to default ratings
    if (snack.ratings && snack.ratings.count > 0) {
        return snack.ratings;
    }
    
    return null;
};

// Submit a rating to backend
export const submitRating = async (snackId, taste, spiciness, uniqueness) => {
    const token = getAuthToken();
    
    try {
        const response = await fetch(`${API_BASE_URL}/snacks/${snackId}/ratings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: JSON.stringify({
                taste: parseInt(taste),
                spiciness: parseInt(spiciness),
                uniqueness: parseInt(uniqueness)
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || data.message || 'Failed to submit rating');
        }

        return data.summary || data;
    } catch (error) {
        console.error('Error submitting rating:', error);
        alert(error.message || 'Failed to submit rating. Please try again.');
        throw error;
    }
};

// Store current onSuccess callback
let currentOnSuccess = null;

// Initialize rating form
export const initRatingForm = (snackId, onSuccess) => {
    const form = document.getElementById('ratingForm');
    const snackIdInput = document.getElementById('ratingSnackId');
    const tasteInput = document.getElementById('tasteValue');
    const spicinessInput = document.getElementById('spicinessValue');
    const uniquenessInput = document.getElementById('uniquenessValue');
    
    if (!form) return;
    
    snackIdInput.value = snackId;
    currentOnSuccess = onSuccess;
    
    // Set initial values
    const snack = getSnackById(snackId);
    if (snack && snack.ratings) {
        const tasteVal = Math.round(snack.ratings.taste) || 3;
        const spicinessVal = Math.round(snack.ratings.spiciness) || 1;
        const uniquenessVal = Math.round(snack.ratings.uniqueness) || 3;
        
        tasteInput.value = tasteVal;
        spicinessInput.value = spicinessVal;
        uniquenessInput.value = uniquenessVal;
    } else {
        tasteInput.value = 3;
        spicinessInput.value = 1;
        uniquenessInput.value = 3;
    }
};

// Initialize form submit handler (called once)
export const initRatingFormSubmit = () => {
    const form = document.getElementById('ratingForm');
    if (!form) return;
    
    // Remove existing listener if any
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    // Add new listener
    document.getElementById('ratingForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const snackIdInput = document.getElementById('ratingSnackId');
        const tasteInput = document.getElementById('tasteValue');
        const spicinessInput = document.getElementById('spicinessValue');
        const uniquenessInput = document.getElementById('uniquenessValue');
        const submitBtn = form.querySelector('button[type="submit"]');
        
        const snackId = snackIdInput.value;
        const taste = tasteInput.value;
        const spiciness = spicinessInput.value;
        const uniqueness = uniquenessInput.value;
        
        if (!taste || !spiciness || !uniqueness) {
            alert('Please fill in all rating fields');
            return;
        }
        
        // Disable button and show loading
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
        }
        
        try {
            const newAverages = await submitRating(snackId, taste, spiciness, uniqueness);
            
            if (currentOnSuccess) {
                currentOnSuccess(newAverages);
            }
            
            // Close modal
            const modal = document.getElementById('ratingModal');
            if (modal) {
                modal.classList.remove('active');
                modal.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
            }
            
            // Show success message
            alert('Rating submitted successfully!');
            
            // Reload snacks to show updated ratings
            if (window.renderSnacks) {
                // Reload from backend
                try {
                    const { fetchSnacks } = await import('./api.js');
                    const snacks = await fetchSnacks();
                    if (window.getFilteredSnacks) {
                        // Re-apply filters
                        window.renderSnacks(window.getFilteredSnacks());
                    } else {
                        window.renderSnacks(snacks);
                    }
                } catch (error) {
                    console.error('Error reloading snacks:', error);
                    // Fallback to current filtered view
                    if (window.getFilteredSnacks) {
                        window.renderSnacks(window.getFilteredSnacks());
                    }
                }
            }
        } catch (error) {
            // Error already handled in submitRating
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Rating';
            }
        }
    });
};

// Get overall average rating (for display)
export const getOverallAverage = (snack) => {
    const averages = calculateAverageRatings(snack);
    
    if (averages) {
        return (averages.taste + averages.spiciness + averages.uniqueness) / 3;
    }
    
    return 0;
};

