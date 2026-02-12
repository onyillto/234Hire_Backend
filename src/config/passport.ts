// src/config/passport.ts
import passport from "passport";
import {
  Strategy as JwtStrategy,
  ExtractJwt,
  StrategyOptions,
} from "passport-jwt";
import { User } from "../models/user";
import env from "./env";

const options: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: env.JWT_SECRET!,
};

passport.use(
  new JwtStrategy(options, async (jwt_payload, done) => {
    try {
      const user = await User.findById(jwt_payload.id) as InstanceType<typeof User> | null;

      if (user) {
        return done(null, {
          id: user._id.toString(),
          
          username: user.username,
          role: user.role || "user",
          email: user.email,
        });
      }

      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  })
);

export default passport;
