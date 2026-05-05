const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const asyncHandler = require('../lib/async-handler');

/**
 * GET /api/staff/me
 * Returns the profile of the currently logged-in staff member.
 */
router.get('/me', asyncHandler(async (req, res) => {
  // req.user is populated by authMiddleware
  const { staffId } = req.user;
  
  if (!staffId) {
    return res.status(403).json({ error: 'Access denied. Not a staff account.' });
  }

  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    include: {
      doctor: {
        select: {
          id: true,
          name: true,
          hospital: true
        }
      }
    }
  });

  if (!staff) {
    return res.status(404).json({ error: 'Staff profile not found.' });
  }

  res.json(staff);
}));

module.exports = router;
