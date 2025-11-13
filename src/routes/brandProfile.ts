import express from 'express';
import multer from 'multer';
import BrandProfileController from '../controller/brandProfile';
import { authenticateUser } from '../middleware';


const router = express.Router();
export const upload = multer(); 
// POST /jobs - Create brand intelligence analysis job
// v2 API: Expects JSON body with { url, include_screenshots?, include_web_search?, max_pages? }
// Legacy: Also supports multipart/form-data with file upload (file upload not used in v2)
router.post('/jobs', authenticateUser, upload.single('file'), BrandProfileController.createJob);
// GET /jobs/:job_id - Check job status
router.get('/jobs/:job_id', authenticateUser, BrandProfileController.getJobStatus);
// GET /:profile_id - Get brand profile (returns from database for v2)
router.get('/:profile_id', authenticateUser, BrandProfileController.getProfile);

export default router;
