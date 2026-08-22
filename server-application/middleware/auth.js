import jwt from 'jsonwebtoken';

// Check if JWT is valid
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  // Check if Authorization header exists and follows "Bearer <token>" format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: true, message: "Authorization header missing or malformed" });
  }

  // Extract token after "Bearer "
  const token = authHeader.split(' ')[1]; 

  try {
    // Verify signature and expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    
    // Attach decoded user payload to request object for route handlers to use
    req.user = decoded; 
    
    // Pass control to the next handler
    next();
  } catch (err) {
    return res.status(401).json({ error: true, message: "Invalid or expired token" });
  }
};

// Check if user has required role to access API endpoint
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: true, 
        message: "Forbidden: You do not have permission to access this resource" 
      });
    }
    next();
  };
};