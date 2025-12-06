import auth from "./auth";
import express from "express";
import brandProfile from "./brandProfile";
import brandKit from "./brandKit";
import visit from "./visited";
import campaign from "./campaign";
import calendar from "./calendar";
import imageGeneration from "./imageGeneration";
import textGeneration from "./textGeneration";

const router = express.Router();

const defaultRoutes = [
  {
    path: "/auth",
    route: auth,
  },
  {
    path: "/brand-profiles",
    route: brandProfile
  },
  {
    path: "/brand-kits",
    route: brandKit
  },
  {
    path: "/visited",
    route: visit
  },
  {
    path: "/v1/brands",
    route: campaign
  },
  {
    path: "/v1/calendars",
    route: calendar
  },
  {
    path: "/image-generation",
    route: imageGeneration
  },
  {
    path: "/text-generation",
    route: textGeneration
  }
]

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

router.get("/", async (req:any, res:any) => {
  return res.send("Server is running");
});

export default router;