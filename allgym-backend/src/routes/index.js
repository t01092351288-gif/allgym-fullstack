const router = require('express').Router();

router.use('/auth', require('./auth'));
router.use('/branches', require('./branches'));
router.use('/slots', require('./slots'));
router.use('/reservations', require('./reservations'));
router.use('/trainer', require('./trainer'));
router.use('/admin', require('./admin'));
router.use('/documents', require('./documents'));

module.exports = router;
