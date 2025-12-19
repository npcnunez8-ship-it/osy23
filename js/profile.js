// ============================================
// SNACKIFY - PROFILE MANAGEMENT MODULE
// Handles profile updates, password changes, and profile picture
// ============================================

const API_BASE_URL = 'http://localhost:4000/api';

// Get auth token
const getAuthToken = () => {
  const session = localStorage.getItem('snackify_session');
  if (!session) return null;
  const sessionData = JSON.parse(session);
  return sessionData?.access_token || null;
};

// Get current profile
const getProfile = async () => {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    const data = await response.json();
    return data.profile;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
};

// Update profile
const updateProfile = async (updates) => {
  const token = getAuthToken();
  if (!token) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to update profile');
    }

    return {
      success: true,
      profile: data.profile,
      message: data.message || 'Profile updated successfully!'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to update profile'
    };
  }
};

// Change password
const changePassword = async (currentPassword, newPassword, confirmPassword) => {
  const token = getAuthToken();
  if (!token) {
    return { success: false, error: 'Not authenticated' };
  }

  // Validate passwords match
  if (newPassword !== confirmPassword) {
    return { success: false, error: 'Passwords do not match' };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/profile/change-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to change password');
    }

    return {
      success: true,
      message: data.message || 'Password changed successfully!'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to change password'
    };
  }
};

// Load profile data into form
const loadProfileData = async () => {
  const profile = await getProfile();
  if (!profile) return;

  // Set email (readonly)
  const emailInput = document.getElementById('profileEmail');
  if (emailInput) {
    emailInput.value = profile.email || '';
  }

  // Set username
  const usernameInput = document.getElementById('profileUsername');
  if (usernameInput) {
    usernameInput.value = profile.username || '';
  }

  // Set profile picture
  const pictureUrlInput = document.getElementById('profilePictureUrl');
  const picturePreview = document.getElementById('profilePicturePreview');
  const picturePlaceholder = document.getElementById('profilePicturePlaceholder');
  
  if (pictureUrlInput) {
    pictureUrlInput.value = profile.profile_picture_url || '';
  }

  if (profile.profile_picture_url) {
    if (picturePreview) {
      picturePreview.src = profile.profile_picture_url;
      picturePreview.style.display = 'block';
    }
    if (picturePlaceholder) {
      picturePlaceholder.style.display = 'none';
    }
  } else {
    if (picturePreview) {
      picturePreview.style.display = 'none';
    }
    if (picturePlaceholder) {
      picturePlaceholder.style.display = 'block';
    }
  }
};

// Show profile modal
const showProfileModal = async () => {
  const modal = document.getElementById('profileModal');
  if (modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    // Load profile data
    await loadProfileData();
    
    // Switch to profile info tab
    switchProfileTab('profile-info');
  }
};

// Hide profile modal
const hideProfileModal = () => {
  const modal = document.getElementById('profileModal');
  if (modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
};

// Switch profile tabs
const switchProfileTab = (tab) => {
  const tabs = document.querySelectorAll('.profile-tab');
  const contents = document.querySelectorAll('.profile-tab-content');
  
  tabs.forEach(t => {
    if (t.dataset.tab === tab) {
      t.classList.add('active');
    } else {
      t.classList.remove('active');
    }
  });
  
  contents.forEach(c => {
    if (c.id === `${tab}Tab`) {
      c.classList.add('active');
    } else {
      c.classList.remove('active');
    }
  });
};

// Initialize profile forms
const initProfileForms = () => {
  // Profile tab switchers
  document.querySelectorAll('.profile-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      switchProfileTab(tab.dataset.tab);
    });
  });

  // Update profile picture preview
  const pictureUrlInput = document.getElementById('profilePictureUrl');
  const picturePreview = document.getElementById('profilePicturePreview');
  const picturePlaceholder = document.getElementById('profilePicturePlaceholder');
  
  if (pictureUrlInput) {
    pictureUrlInput.addEventListener('input', (e) => {
      const url = e.target.value.trim();
      if (url) {
        if (picturePreview) {
          picturePreview.src = url;
          picturePreview.style.display = 'block';
          picturePreview.onerror = () => {
            picturePreview.style.display = 'none';
            if (picturePlaceholder) picturePlaceholder.style.display = 'block';
          };
        }
        if (picturePlaceholder) {
          picturePlaceholder.style.display = 'none';
        }
      } else {
        if (picturePreview) picturePreview.style.display = 'none';
        if (picturePlaceholder) picturePlaceholder.style.display = 'block';
      }
    });
  }

  // Update profile picture button
  const updatePictureBtn = document.getElementById('updateProfilePictureBtn');
  if (updatePictureBtn) {
    updatePictureBtn.addEventListener('click', async () => {
      const url = pictureUrlInput?.value.trim() || '';
      const errorMsg = document.getElementById('profileError');
      const successMsg = document.getElementById('profileSuccess');
      
      // Clear messages
      if (errorMsg) {
        errorMsg.style.display = 'none';
        errorMsg.textContent = '';
      }
      if (successMsg) {
        successMsg.style.display = 'none';
        successMsg.textContent = '';
      }
      
      const result = await updateProfile({ profile_picture_url: url });
      
      if (result.success) {
        if (successMsg) {
          successMsg.textContent = 'Profile picture updated!';
          successMsg.style.display = 'block';
        }
        // Update preview
        await loadProfileData();
      } else {
        if (errorMsg) {
          errorMsg.textContent = result.error;
          errorMsg.style.display = 'block';
        }
      }
    });
  }

  // Update profile button
  const updateProfileBtn = document.getElementById('updateProfileBtn');
  if (updateProfileBtn) {
    updateProfileBtn.addEventListener('click', async () => {
      const username = document.getElementById('profileUsername')?.value.trim() || '';
      const errorMsg = document.getElementById('profileError');
      const successMsg = document.getElementById('profileSuccess');
      
      // Clear messages
      if (errorMsg) {
        errorMsg.style.display = 'none';
        errorMsg.textContent = '';
      }
      if (successMsg) {
        successMsg.style.display = 'none';
        successMsg.textContent = '';
      }
      
      updateProfileBtn.disabled = true;
      updateProfileBtn.textContent = 'Updating...';
      
      const result = await updateProfile({ username });
      
      if (result.success) {
        if (successMsg) {
          successMsg.textContent = result.message;
          successMsg.style.display = 'block';
        }
        // Reload profile data
        await loadProfileData();
        // Update UI
        const { updateAuthUI } = await import('./auth.js');
        updateAuthUI();
      } else {
        if (errorMsg) {
          errorMsg.textContent = result.error;
          errorMsg.style.display = 'block';
        }
      }
      
      updateProfileBtn.disabled = false;
      updateProfileBtn.textContent = 'Update Profile';
    });
  }

  // Change password form
  const changePasswordForm = document.getElementById('changePasswordForm');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const currentPassword = document.getElementById('currentPassword')?.value;
      const newPassword = document.getElementById('newPassword')?.value;
      const confirmPassword = document.getElementById('confirmNewPassword')?.value;
      const errorMsg = document.getElementById('passwordError');
      const successMsg = document.getElementById('passwordSuccess');
      const submitBtn = changePasswordForm.querySelector('button[type="submit"]');
      
      // Clear messages
      if (errorMsg) {
        errorMsg.style.display = 'none';
        errorMsg.textContent = '';
      }
      if (successMsg) {
        successMsg.style.display = 'none';
        successMsg.textContent = '';
      }
      
      submitBtn.disabled = true;
      submitBtn.textContent = 'Changing Password...';
      
      const result = await changePassword(currentPassword, newPassword, confirmPassword);
      
      if (result.success) {
        if (successMsg) {
          successMsg.textContent = result.message;
          successMsg.style.display = 'block';
        }
        // Clear form
        changePasswordForm.reset();
        // Show message that user needs to login again
        setTimeout(async () => {
          alert('Password changed successfully! Please login again with your new password.');
          const authModule = await import('./auth.js');
          authModule.logout();
        }, 2000);
      } else {
        if (errorMsg) {
          errorMsg.textContent = result.error;
          errorMsg.style.display = 'block';
        }
      }
      
      submitBtn.disabled = false;
      submitBtn.textContent = 'Change Password';
    });
  }

  // Close profile modal
  document.getElementById('closeProfileModal')?.addEventListener('click', hideProfileModal);
  
  // Close on background click
  document.getElementById('profileModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'profileModal') {
      hideProfileModal();
    }
  });
};

export {
  getProfile,
  updateProfile,
  changePassword,
  loadProfileData,
  showProfileModal,
  hideProfileModal,
  initProfileForms
};

