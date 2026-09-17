import jwt from 'jsonwebtoken';

const getCookie = (req, name) => {
  const cookieHeader = req.headers.cookie;

  if (!cookieHeader) {
    return null;
  }

  const cookie = cookieHeader
    .split(';')
    .map(cookie => cookie.trim())
    .find(cookie => cookie.startsWith(`${name}=`));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(name.length + 1));
};

// Check if JWT is valid
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  let token = null;

  // Extract token after "Bearer "
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  if (!token) {
    token = getCookie(req, 'token');
  }

  // Check if Authorization header exists
  if (!token) {
    return res.status(401).json({
      error: true,
      message: "Authentication token missing"
    });
  }

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
    if ((!req.user || !allowedRoles.includes(req.user.role)) && req.user.role !== "owner") {
      return res.status(403).json({
        error: true,
        message: "Forbidden: You do not have permission to access this resource"
      });
    }
    next();
  };
};

export const requireMatchAccess = (requiredAccess) => {
  return async (req, res, next) => {
    try {
      // Owner always has full match access
      if (req.user?.role === "owner") {
        return next();
      }

      const permission = await req.db("role_permissions")
        .where({ role: req.user.role })
        .first();

      if (!permission || permission.match_access === "none") {
        return res.status(403).json({
          error: true,
          message: "Forbidden: You do not have access to matches"
        });
      }

      if (requiredAccess === "edit" && permission.match_access !== "edit") {
        return res.status(403).json({
          error: true,
          message: "Forbidden: You do not have permission to edit matches"
        });
      }

      next();
    } catch (err) {
      console.error("Match access check error:", err);

      return res.status(500).json({
        error: true,
        message: "Unable to check match permissions"
      });
    }
  };
};