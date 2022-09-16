/* eslint-disable prettier/prettier */
const Tour = require("../models/tourModel")
const catchAsync = require("../utils/catchAsync")
const factory = require('./handleController')
const AppError = require("../utils/appError")

/* exports.checkId = (req, res, next, val) => {
  console.log(`Tour id is : ${val}`);

  if (req.params.id * 1 > tours.length) {
    // Nếu tour k tồn tại thì sẽ chạy lệnh ...
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }
  next();
  // chú ý phải có return trong param middleware để tránh send 2 lần response
};*/

//Cung cấp 1 route alias(tuyến đg bí danh) cho một request rất phổ biến để có thể request mọi lúc
exports.aliasTopTours = (req,res,next) => {
  req.query.limit = '5'
  req.query.sort = '-ratingsAverage,price'
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty'
  next()
} // tự động điền trc chuỗi truy vấn(query) cho ng dùng mà người dùng k cần phải tự thao tác

exports.getAllTours = factory.getAll(Tour)
exports.getTour = factory.getOne(Tour,{path : 'reviews'})
exports.createTour = factory.createOne(Tour)
exports.updateTour = factory.updateOne(Tour)
exports.deleteTour = factory.deleteOne(Tour)

exports.getTourStats = catchAsync(async (req,res,next) =>{
    const stats = await Tour.aggregate([
      {
        $match : {ratingsAverage : {$gte : 4.5}}
      },
      {
        $group : {
          _id : {$toUpper : '$difficulty'}, // in hoa
          numTours: {$sum : 1},
          numRatings : {$sum : '$ratingsQuantity'},
          avgRating : {$avg :'$ratingsAverage'},
          avgPrice : {$avg :'$price'},
          minPrice : {$min : '$price'},
          maxPrice : {$max : '$price'},
        }
      },
      {
        $sort : {avgPrice : 1} // tăng dần
      }
      // {
      //   $match : {_id: {$ne :'EASY'}} // chọn tất cả các documents ko phải EASY
      // }
    ])

    res.status(200).json({
      status: 'success',
      data: stats,
    });
});

exports.getMonthlyPlan = catchAsync(async (req, res,next) => {
    const year = req.params.year * 1; // 2021

    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates' //$unwind : reconstruct 1 mảng từ các dữ liệu đầu vào và xuất ra 1 tài liệu cho mỗi phần tử của mảng
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTourStarts: { $sum: 1 },
          tours: { $push: '$name' }
        }
      },
      {
        $addFields: { month: '$_id' }
      },
      {
        $project: {
          _id: 0
        }
      },
      {
        $sort: { numTourStarts: -1 }
      },
      {
        $limit: 12
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        plan
      }
    });
});

// /tours-within/233/center/34.111745,-118.113491/unit/mi
//Bài 25 - phần 11 : Queries Finding Tours
exports.getToursWithin = catchAsync(async (req,res,next) => {
  const {distance, latlng , unit} = req.params;
  
  const [lat,lng] =  latlng.split(',')
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1

  if(!lat || !lng){
    return next(new AppError('Please provide latitude and longtitude in the format'),400)
  }

  const tours = await Tour.find({
    startLocation : {
      $geoWithin : {$ce nterSphere: [[lng,lat],radius]}
    }
  })

  res.status(200).json({
    status : 'success',
    results : tours.length,
    data :{
      data : tours
    }
  })
})

//Bài 26 - Phần 11 :Calculating Distances - Tính khoảng cách từ 1 điểm cố định đến các tours
exports.getDistances = catchAsync(async (req,res,next) => {
  const {latlng , unit} = req.params;
  const [lat,lng] =  latlng.split(',')

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001 // tính = miles or kilometers

  if(!lat || !lng){
    return next(new AppError('Please provide latitude and longtitude in the format'),400)
  }

  const distances = await Tour.aggregate([
    {
      // geoNear bắt buộc phải ở giai đoạn đầu tiên trong quy trình
      $geoNear : {
        near : {
          type : 'Point',
          coordinates : [lng *1 ,lat *1] // convert to number (*1)
        },
        distanceField : 'distance',
        distanceMultiplier : multiplier 
      }
    },
    {
      $project : {
        distance : 1,
        name : 1
      }
    }
  ])

  res.status(200).json({
    status : 'success',
    data :{
      data : distances
    }
  })
})