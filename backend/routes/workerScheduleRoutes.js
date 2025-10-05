const express = require('express');
const router = express.Router();
const {
  getWorkerSchedule,
  getAllWorkersSchedule,
  updateWorkerSchedule,
  addAvailableSlot,
  removeAvailableSlot,
  bookTimeSlot,
  updateStatusAfterCompletion,
  updateEstimatedCompletion,
  updateEstimatedTime,
  completeCurrentJob,
  getCurrentJob,
  generateScheduleForDays,
  updateAvailabilityAfterBooking,
  updateCustomAvailability,
  getDefaultTimeSlots,
  extendWorkTime
} = require('../controllers/workerScheduleController');
const auth = require('../middleware/auth');

// Routes công khai - khách hàng có thể xem lịch thợ
router.get('/workers', getAllWorkersSchedule); // Lấy danh sách tất cả thợ và lịch rãnh
router.get('/worker/:workerId', getWorkerSchedule); // Lấy lịch rãnh của một thợ cụ thể

// Routes cho khách hàng đã đăng nhập
router.post('/book/:workerId/:slotId', auth(['customer']), bookTimeSlot); // Đặt lịch

// Routes cho thợ
router.get('/my-schedule', auth(['worker']), (req, res, next) => {
  req.query.workerId = req.user.id;
  getWorkerSchedule(req, res, next);
}); // Xem lịch của mình

router.put('/my-schedule', auth(['worker']), updateWorkerSchedule); // Cập nhật lịch
router.post('/add-slot', auth(['worker']), addAvailableSlot); // Thêm khung giờ rãnh
router.delete('/remove-slot/:slotId', auth(['worker']), removeAvailableSlot); // Xóa khung giờ rãnh
router.post('/update-after-completion', auth(['worker']), updateStatusAfterCompletion); // Cập nhật sau hoàn thành
router.post('/generate-schedule', auth(['worker']), generateScheduleForDays); // Tự động tạo lịch

// Routes mới cho việc quản lý thời gian dự kiến
router.post('/start-job', auth(['worker']), updateEstimatedCompletion); // Bắt đầu công việc với thời gian dự kiến
router.put('/update-estimated-time', auth(['worker']), updateEstimatedTime); // Cập nhật thời gian dự kiến
router.post('/complete-job', auth(['worker']), completeCurrentJob); // Hoàn thành công việc hiện tại
router.get('/current-job', auth(['worker']), getCurrentJob); // Xem thông tin công việc hiện tại

// Routes mới cho lịch làm việc với khung giờ mặc định
router.post('/update-availability-after-booking', auth(['worker']), updateAvailabilityAfterBooking); // Thợ cập nhật lịch sau khi hoàn thành đơn
router.put('/custom-availability', auth(['worker']), updateCustomAvailability); // Thợ tự cập nhật khung giờ khả dụng
router.get('/default-time-slots', auth(['worker']), getDefaultTimeSlots); // Lấy khung giờ mặc định
router.post('/extend-work-time', auth(['worker']), extendWorkTime); // Gia hạn thời gian làm việc

// Routes cho admin
router.get('/admin/all-schedules', auth(['admin']), getAllWorkersSchedule); // Admin xem tất cả lịch

module.exports = router;