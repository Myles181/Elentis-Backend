// importing the required modules
import { User } from "../models/users.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
// import speakeasy from 'speakeasy';
// import { sendPushNotification } from "../utils/ExpoNotify.js";

// Load environment variables
dotenv.config();

export const tokenRequired = async (req, res, next) => {
     if (!req.headers.fluxelaccesstoken) {
          return res.status(401).json({
               status: false,
               message: "You've got some errors.",
               error: "TOKEN_ERROR"
          });
     }

     try {
          const token = req.headers.elentisaccesstoken;
          const decodedToken = jwt.verify(token, process.env.SECRET_KEY, {
               algorithms: "HS256"
          });

          const user = await User.findOne({
               _id: decodedToken._id,
          });
          if (!user) {
               return res.status(401).json({
                    status: false,
                    message: "You've got some errors.",
                    error: "INVALID_TOKEN_ERROR"
               });
          }

          const { password, ...userData } = user._doc;
          req.user = userData;

          next();
     } catch (error) {
          logger.error('Token validation failed', { error: error.message });
          return res.status(401).json({
               status: false,
               message: "You've got some errors.",
               error: "INVALID_TOKEN_ERROR"
          });
     }
};