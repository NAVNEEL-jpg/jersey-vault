import { supabase } from '../config/supabase.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      // Verify token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        console.log("AUTH FAIL: No user found for token");
        return res.status(401).json({ message: 'Not authorized, token failed' });
      }

      console.log("AUTH SUCCESS: User ID =", user.id);

      // Fetch user profile from database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        console.log("PROFILE NOT FOUND, using metadata");
        req.user = {
          id: user.id,
          email: user.email,
          role: user.app_metadata?.role || 'user'
        };
      } else {
        req.user = profile;
      }
      
      console.log("USER ROLE =", req.user.role);

      return next();
    } catch (error) {
      console.error('Auth Error:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  return res.status(401).json({ message: 'Not authorized, no token' });
};

export const adminOnly = (req, res, next) => {
  console.log("CHECKING ADMIN ACCESS for:", req.user?.email, "Role:", req.user?.role);
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    console.log("ADMIN ACCESS DENIED");
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};
