// ============================================
// SNACKIFY - AUTHENTICATION MODULE
// Handles user login, registration, and session management
// ============================================

const API_BASE_URL = 'http://localhost:4000/api';

// Get stored session
const getStoredSession = () => {
  const session = localStorage.getItem('snackify_session');
  return session ? JSON.parse(session) : null;
};

// Store session
const storeSession = (sessionData) => {
  localStorage.setItem('snackify_session', JSON.stringify(sessionData));
};

// Clear session
const clearSession = () => {
  localStorage.removeItem('snackify_session');
};

// Get auth token
const getAuthToken = () => {
  const session = getStoredSession();
  return session?.access_token || null;
};

// Check if user is authenticated
const isAuthenticated = () => {
  const session = getStoredSession();
  if (!session || !session.access_token) return false;
  
  // Check if token is expired
  if (session.expires_at && Date.now() >= session.expires_at * 1000) {
    clearSession();
    return false;
  }
  
  return true;
};

// Register new user
const register = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Registration failed');
    }

    // Store session
    if (data.session) {
      storeSession(data.session);
    }
    
    // Show buttons and update UI
    await updateAuthUI();
    const profileBtn = document.getElementById('profileBtn');
    const addSnackBtn = document.getElementById('addSnackBtn');
    if (profileBtn) profileBtn.style.display = 'block';
    if (addSnackBtn) addSnackBtn.style.display = 'block';

    return {
      success: true,
      user: data.user,
      message: data.message || 'Account created successfully!'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Registration failed'
    };
  }
};

// Login user
const login = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Login failed');
    }

    // Store session
    if (data.session) {
      storeSession(data.session);
    }
    
    // Show buttons and update UI
    await updateAuthUI();
    const profileBtn = document.getElementById('profileBtn');
    const addSnackBtn = document.getElementById('addSnackBtn');
    if (profileBtn) profileBtn.style.display = 'block';
    if (addSnackBtn) addSnackBtn.style.display = 'block';

    return {
      success: true,
      user: data.user,
      message: data.message || 'Login successful!'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Login failed'
    };
  }
};

// Logout user
const logout = () => {
  clearSession();
  updateAuthUI();
  // Redirect to login if needed
  if (window.location.pathname !== '/') {
    window.location.href = '/';
  }
};

// Get current user
const getCurrentUser = async () => {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      clearSession();
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    clearSession();
    return null;
  }
};

// Update authentication UI
const updateAuthUI = async () => {
  const userIcon = document.querySelector('.nav-user .user-icon');
  const userMenu = document.querySelector('.user-menu');
  
  if (isAuthenticated()) {
    const user = await getCurrentUser();
    
    // Get full profile with username and picture
    let profile = null;
    try {
      const profileModule = await import('./profile.js');
      profile = await profileModule.getProfile();
    } catch (error) {
      console.warn('Could not load profile:', error);
    }
    
    const displayName = profile?.username || user?.username || user?.email?.split('@')[0] || 'User';
    
    if (userIcon) {
      if (profile?.profile_picture_url) {
        userIcon.innerHTML = `<img src="${profile.profile_picture_url}" alt="${displayName}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 2px solid var(--orange);">`;
      } else {
        userIcon.innerHTML = `👤 ${displayName}`;
      }
      userIcon.setAttribute('title', user ? (user.email || 'User') : 'User');
    }
    
    // Create/update user menu
    if (!userMenu) {
      const menu = document.createElement('div');
      menu.className = 'user-menu';
      menu.innerHTML = `
        <div class="user-menu-item" id="userEmail">${user?.email || 'User'}</div>
        <div class="user-menu-item" id="logoutBtn">Logout</div>
      `;
      const navUser = document.querySelector('.nav-user');
      if (navUser) {
        navUser.appendChild(menu);
        
        // Add logout handler
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
          logoutBtn.addEventListener('click', logout);
        }
      }
    } else {
      const emailEl = userMenu.querySelector('#userEmail');
      if (emailEl && user) {
        emailEl.textContent = user.email;
      }
    }
  } else {
    if (userIcon) {
      userIcon.innerHTML = '👤';
      userIcon.setAttribute('title', 'Login');
    }
    if (userMenu) {
      userMenu.remove();
    }
  }
};

// Initialize authentication check on page load
const initAuth = async () => {
  // Check if user is authenticated
  if (isAuthenticated()) {
    await updateAuthUI();
    // Show profile and add snack buttons when authenticated
    const profileBtn = document.getElementById('profileBtn');
    const addSnackBtn = document.getElementById('addSnackBtn');
    if (profileBtn) profileBtn.style.display = 'block';
    if (addSnackBtn) addSnackBtn.style.display = 'block';
  } else {
    // Show login modal if not authenticated
    showLoginModal();
    // Hide profile and add snack buttons when not authenticated
    const profileBtn = document.getElementById('profileBtn');
    const addSnackBtn = document.getElementById('addSnackBtn');
    if (profileBtn) profileBtn.style.display = 'none';
    if (addSnackBtn) addSnackBtn.style.display = 'none';
  }
};

// Show login modal
const showLoginModal = () => {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // Switch to login tab
    switchAuthTab('login');
  }
};

// Hide auth modal
const hideAuthModal = () => {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
};

// Switch between login and register tabs
const switchAuthTab = (tab) => {
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  
  if (tab === 'login') {
    loginTab?.classList.add('active');
    registerTab?.classList.remove('active');
    loginForm?.classList.add('active');
    registerForm?.classList.remove('active');
  } else {
    registerTab?.classList.add('active');
    loginTab?.classList.remove('active');
    registerForm?.classList.add('active');
    loginForm?.classList.remove('active');
  }
};

// Initialize auth forms
const initAuthForms = () => {
  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      const errorMsg = document.getElementById('loginError');
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      
      // Clear previous errors
      if (errorMsg) errorMsg.textContent = '';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Logging in...';
      
      const result = await login(email, password);
      
      if (result.success) {
        await updateAuthUI();
        hideAuthModal();
        alert(result.message);
      } else {
        if (errorMsg) {
          errorMsg.textContent = result.error;
          errorMsg.style.display = 'block';
        }
      }
      
      submitBtn.disabled = false;
      submitBtn.textContent = 'Login';
    });
  }
  
  // Register form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('registerEmail').value;
      const password = document.getElementById('registerPassword').value;
      const confirmPassword = document.getElementById('registerConfirmPassword').value;
      const errorMsg = document.getElementById('registerError');
      const submitBtn = registerForm.querySelector('button[type="submit"]');
      
      // Clear previous errors
      if (errorMsg) errorMsg.textContent = '';
      
      // Validate passwords match
      if (password !== confirmPassword) {
        if (errorMsg) {
          errorMsg.textContent = 'Passwords do not match';
          errorMsg.style.display = 'block';
        }
        return;
      }
      
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating account...';
      
      const result = await register(email, password);
      
      if (result.success) {
        await updateAuthUI();
        hideAuthModal();
        alert(result.message);
      } else {
        if (errorMsg) {
          errorMsg.textContent = result.error;
          errorMsg.style.display = 'block';
        }
      }
      
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';
    });
  }
  
  // Tab switchers
  document.getElementById('loginTab')?.addEventListener('click', () => switchAuthTab('login'));
  document.getElementById('registerTab')?.addEventListener('click', () => switchAuthTab('register'));
  
  // User icon click handler
  document.querySelector('.nav-user .user-icon')?.addEventListener('click', () => {
    if (isAuthenticated()) {
      // Toggle user menu
      const menu = document.querySelector('.user-menu');
      if (menu) {
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
      }
    } else {
      showLoginModal();
    }
  });
};

export {
  initAuth,
  initAuthForms,
  isAuthenticated,
  getAuthToken,
  getCurrentUser,
  logout,
  updateAuthUI,
  showLoginModal,
  hideAuthModal
};

