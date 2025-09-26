import { Router } from "express";
import { VisitedUserController } from "../controller/visited";

const router = Router();

router.post("/user",VisitedUserController.create);

export default router;
