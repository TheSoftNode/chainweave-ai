import { Router } from 'express';
import { userRoutes } from './userRoutes';
import { nftRequestRoutes } from './nftRequestRoutes';
import { collectionRoutes } from './collectionRoutes';
import { analyticsRoutes } from './analyticsRoutes';
import { aiRoutes } from './aiRoutes';
import { authRoutes } from './authRoutes';
import { activityRoutes } from './activityRoutes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'ChainWeave AI Backend API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API route groups
router.use('/auth', authRoutes);
router.use('/ai', aiRoutes);
router.use('/users', userRoutes);
router.use('/requests', nftRequestRoutes);
router.use('/collections', collectionRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/activity', activityRoutes);

export { router as apiRoutes };