import { Router } from "express";
import CalendarController from "../controller/calendar";
import { authenticateUser } from "../middleware";

const router = Router();

// ============================================
// INDIVIDUAL POST OPERATIONS
// ============================================

// GET - Get specific post
router.get('/:post_id', authenticateUser, CalendarController.getPost);

// PUT - Update post
router.put('/:post_id', authenticateUser, CalendarController.updatePost);

// PUT - Update post status
router.put('/:post_id/status', authenticateUser, CalendarController.updatePostStatus);

// DELETE - Delete post
router.delete('/:post_id', authenticateUser, CalendarController.deletePost);

// ============================================
// BULK OPERATIONS
// ============================================

// POST - Bulk update post statuses
router.post('/bulk-status-update', authenticateUser, CalendarController.bulkUpdatePostStatus);

export default router;
