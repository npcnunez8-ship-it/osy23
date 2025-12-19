const { supabase } = require('../supabase');

if (!supabase) {
  throw new Error('Supabase client not initialized. Check your .env file for SUPABASE_URL and SUPABASE_ANON_KEY');
}

// Authentication operations
const authDb = {
  // Register a new user
  async register(email, password) {
    // First, sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('Failed to create user');
    }

    // Then create profile entry (trigger should handle this, but we'll try to insert anyway)
    // The trigger will create it automatically, so we just fetch it
    let profileData;
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (!existingProfile) {
      // If trigger didn't work, create manually
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: email,
          username: email.split('@')[0] || 'user'
        })
        .select()
        .single();
      
      if (profileError) {
        throw new Error(`Account created but profile setup failed: ${profileError.message}`);
      }
      profileData = newProfile;
    } else {
      profileData = existingProfile;
    }

    if (profileError) {
      // If profile creation fails, try to clean up auth user
      // Note: Supabase doesn't allow deleting users via anon key, so this is just a note
      throw new Error(`Account created but profile setup failed: ${profileError.message}`);
    }

    return {
      user: authData.user,
      profile: profileData,
      session: authData.session
    };
  },

  // Login user
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user || !data.session) {
      throw new Error('Login failed');
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.warn('Profile fetch error:', profileError.message);
    }

    return {
      user: data.user,
      profile: profile || { id: data.user.id, email: data.user.email },
      session: data.session
    };
  },

  // Get current user session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      throw new Error(error.message);
    }

    return session;
  },

  // Get user by session token
  async getUserByToken(accessToken) {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error) {
      throw new Error(error.message);
    }

    return user;
  },

  // Logout (client-side operation, but included for completeness)
  async logout() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  },

  // Get user profile
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  },

  // Update user profile
  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update password
  // Note: Supabase requires an active session to update password
  // We need to get the user's session first, then update
  async updatePassword(accessToken, newPassword) {
    // Get user from token to find their email
    const user = await this.getUserByToken(accessToken);
    
    // We need to get the full session (access + refresh token)
    // For now, we'll use the existing supabase client and set session
    // Note: This is a limitation - we need the refresh token for full session
    // The client should handle password updates directly, but for backend:
    
    // Create a new client instance
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    
    const userClient = createClient(supabaseUrl, supabaseAnonKey);
    
    // Set the session using the access token
    // Note: We need refresh token too, but for password update, access token might be enough
    // Try to get session first
    const { data: { session }, error: sessionError } = await userClient.auth.getSession();
    
    if (sessionError || !session) {
      // If no session, we need to set it manually
      // This is a workaround - ideally the client should handle this
      const { data: sessionData, error: setError } = await userClient.auth.setSession({
        access_token: accessToken,
        refresh_token: '' // We don't have refresh token in backend context
      });
      
      if (setError) {
        throw new Error(`Failed to set session: ${setError.message}`);
      }
    }
    
    // Now update password
    const { data, error } = await userClient.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
    return data;
  }
};

module.exports = { authDb };

