import auth from "./auth";
import express from "express";
import brandProfile from "./brandProfile";
import brandKit from "./brandKit";
import path from "path";
import visit from "./visited";
import campaign from "./campaign";

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
    path: "/campaigns",
    route: campaign
  }
]

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

router.get("/", async (req:any, res:any) => {
  return res.send("Server is running");
});

export default router;