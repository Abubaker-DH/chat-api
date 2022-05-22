module.exports = function (req, res, next) {
  // INFO: 401 Unauthorized 403 Forbidden
  if (!req.user.isAdmin) return res.status(403).send("Access denied.");

  next();
};
