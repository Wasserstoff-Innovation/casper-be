import { Router } from 'express';
import { textGenerationController } from '../controller/textGeneration';
import { authenticateUser } from '../middleware';

const router = Router();

router.post("/twitter/generate",authenticateUser, textGenerationController.generateTweet);
router.post("/twitter/interact",authenticateUser, textGenerationController.interactTweet);
router.post("/threads/generate", authenticateUser,textGenerationController.generateThreads);
router.post("/linkedin/generate",authenticateUser, textGenerationController.generateLinkedIn);
router.post("/medium/generate", authenticateUser, textGenerationController.generateMedium);
router.post("/blogger/generate", authenticateUser, textGenerationController.generateBlogger);

export default router;