import { supabase } from '../config/supabase.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      // Verify token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
      }

      // Fetch user profile from database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const adminEmail = (process.env.ADMIN_EMAIL || 'navneeldutta@gmail.com').toLowerCase();
      const isNavneel = user.email?.toLowerCase() === adminEmail;

      if (profileError || !profile) {
        req.user = {
          id: user.id,
          email: user.email,
          role: isNavneel ? 'admin' : 'customer',
          user_metadata: user.user_metadata || {}
        };
      } else {
        req.user = {
          ...profile,
          role: isNavneel ? 'admin' : (profile.role === 'admin' ? 'customer' : (profile.role || 'customer')),
          user_metadata: user.user_metadata || {}
        };
      }

      return next();
    } catch (error) {
      console.error('Auth Error:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  return res.status(401).json({ message: 'Not authorized, no token' });
};

export const adminOnly = (req, res, next) => {
  const adminEmail = (process.env.ADMIN_EMAIL || 'navneeldutta@gmail.com').toLowerCase();
  const userEmail = req.user?.email?.toLowerCase();

  if (userEmail === adminEmail && req.user?.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Not authorized as an admin' });
};
