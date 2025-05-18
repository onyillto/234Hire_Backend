// src/config/passport.ts
import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { User } from "../models/user";

// Configure the JWT strategy for the passport
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || "your_jwt_secret",
    },
    async (jwtPayload, done) => {
      try {
        // Find the user based on the JWT payload
        const user = await User.findById(jwtPayload.id).select("-password");

        // If user doesn't exist, handle it
        if (!user) {
          return done(null, false);
        }

        // Otherwise, return the user
        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

// Configure the Local strategy for login
passport.use(
  new LocalStrategy(
    { usernameField: "username" },
    async (username, password, done) => {
      try {
        // Find the user by username
        const user = await User.findOne({
          $or: [
            { username: username.toLowerCase() },
            { email: username.toLowerCase() },
          ],
        });

        // If no user is found, return false
        if (!user) {
          return done(null, false, { message: "Invalid credentials" });
        }

        // Check if the password is correct
        const isMatch = await bcrypt.compare(password, user.password);

        // If password doesn't match, return false
        if (!isMatch) {
          return done(null, false, { message: "Invalid credentials" });
        }

        // If everything is OK, return the user
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

export default passport;
