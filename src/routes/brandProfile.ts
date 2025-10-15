import express from 'express';
import multer from 'multer';
import BrandProfileController from '../controller/brandProfile';
import { authenticateUser } from '../middleware';


const router = express.Router();
export const upload = multer(); 
router.post('/jobs', authenticateUser,upload.single('file'), BrandProfileController.createJob);
router.get('/jobs/:job_id', authenticateUser,BrandProfileController.getJobStatus);
router.get('/:profile_id',authenticateUser, BrandProfileController.getProfile);

export default router;
