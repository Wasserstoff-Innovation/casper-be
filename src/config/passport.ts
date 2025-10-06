import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import passport from "passport";

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET as string, // make sure you have this in .env
};

passport.use(
  new JwtStrategy(opts, (jwt_payload, done) => {
    try {
      // Example: payload contains userId, email, etc.
      if (jwt_payload.userId) {
        return done(null, jwt_payload); // attach user object to req.user
      } else {
        return done(null, false);
      }
    } catch (err) {
      return done(err, false);
    }
  })
);

export default passport;
