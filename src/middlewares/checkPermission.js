const permissions = require('../config/permissions');

const checkPermission = (page, action) => {
  return (req, res, next) => {
    const userRole = req.user.role; 
    const rolePerm = permissions[userRole];

    if (!rolePerm) return res.status(403).json({ message: 'Role not found' });

    // Full access
    if (rolePerm.accessAll) return next();

    const pagePerms = rolePerm.pages?.[page] || [];

    if (!pagePerms.includes(action)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    next();
  };
};

module.exports = checkPermission;
