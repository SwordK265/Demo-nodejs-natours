/* eslint-disable prettier/prettier */
const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require("./reviewRoutes")

const router = express.Router();
/*Middleware chỉ chạy cho 1 tham số nhất định, vì vậy cơ bản khi chúng ta có 1 tham số nhất định trong url 
(ví dụ trong url hiện tại là id) vì vậy chúng ta k thể viết middleware chỉ chạy khi id này có trong url.
*/
// ở param middleware chúng ta thực sự có quyền truy cập vào đối số thứ tư và đối số đó là giá trị của tham số được đề cập(id)
//Chú ý : chức năng của middleware này chỉ được chỉ định trong bộ định tuyến tham gia

// router.param('id', tourController.checkId);// .param để xác định middleware tham số trong ứng dụng

//POST /tour/234nf4/reviews 
//GET /tour/234nf4/reviews
router.use('/:tourId/reviews',reviewRouter) // Bài 13 - phần 11:Nested Routes with Express

router.route('/top-5-cheap').get(tourController.aliasTopTours,tourController.getAllTours)
router.route('/tour-stats').get(tourController.getTourStats)
router
  .route('/monthly-plan/:year')
  .get(authController.protect,authController.restrictTo('admin','lead-guide','guide'),tourController.getMonthlyPlan)

router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourController.getToursWithin)
// /tours-within/233/center/-40,45/unit/mi

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances)

router
  .route('/')
  .get(tourController.getAllTours)
  .post(authController.protect,authController.restrictTo('admin','lead-guide'),tourController.createTour);
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(authController.protect,authController.restrictTo('admin','lead-guide'),tourController.updateTour)
  .delete(authController.protect,authController.restrictTo('admin','lead-guide'),tourController.deleteTour);

module.exports = router;
