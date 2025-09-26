import express from 'express';
import multer from 'multer';
import BrandProfileController from '../controller/brandProfile';


const router = express.Router();
const upload = multer(); 
router.post('/jobs', upload.single('file'), BrandProfileController.createJob);
router.get('/jobs/:job_id', BrandProfileController.getJobStatus);
router.get('/:profile_id', BrandProfileController.getProfile);

export default router;
