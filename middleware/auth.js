// importing the required modules
const { Users } = require("../models/users");
const jwt = require("jsonwebtoken");
require('dotenv').config();

const tokenRequired = async (req, res, next) => {
     // Check for token in different possible header names
     const token = req.headers.elentisaccesstoken || 
                   req.headers.authorization?.replace('Bearer ', '') ||
                   req.headers['x-access-token'] ||
                   req.headers['x-auth-token'];

     if (!token) {
          return res.status(401).json({
               status: false,
               message: "Access token is required",
               error: "TOKEN_ERROR"
          });
     }

     try {
          const decodedToken = jwt.verify(token, process.env.SECRET_KEY, {
               algorithms: "HS256"
          });

          const user = await Users.findOne({
               _id: decodedToken._id,
          });
          if (!user) {
               return res.status(401).json({
                    status: false,
                    message: "Invalid token",
                    error: "INVALID_TOKEN_ERROR"
               });
          }

          const { password, ...userData } = user._doc;
          req.user = userData;

          next();
     } catch (error) {
          console.error('Token validation failed', { error: error.message });
          return res.status(401).json({
               status: false,
               message: "Invalid token",
               error: "INVALID_TOKEN_ERROR"
          });
     }
};

module.exports = { tokenRequired };