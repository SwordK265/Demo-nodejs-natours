/* eslint-disable prettier/prettier */
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const APIFeatures = require("../utils/apiFeatures")

//Bài 15 - phần 11 : Factory Function
exports.deleteOne = Model => catchAsync(async (req, res,next) => {
    const doc = await Model.findByIdAndDelete(req.params.id)

    if(!doc){
      return next(new AppError('No doc found with that ID'),404)
    }

    res.status(204).json({
      //204 : trạng thái có nghĩa là không có nội dung(no content)
      status: 'success',
      data: null,
    });
});

exports.updateOne = Model => catchAsync(async (req, res,next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id,req.body,{
      new : true, //trả về tài liệu đã sửa đổi (ko phải tài liệu ban đầu)
      runValidators : true //mỗi lần cập nhật 1 tài liệu nhất định thì trình xác thực(validators) trong schema sẽ chạy lại
    })

    if(!doc){
      return next(new AppError('No doc found with that ID'),404)
    }

    res.status(200).json({
      status: 'success',
      data: {
        data :doc,
      },
    });
});

exports.createOne = Model => catchAsync(async (req, res,next) => {
    const doc = await Model.create(req.body)

    res.status(201).json({
        status: 'success',
        data: {
          data : doc,
        },
    });
});

exports.getOne = (Model,popOptions) => catchAsync(async (req, res,next) => {
    /*console.log(req.params); //res.params tự động gán giá trị cho biến hoặc tham số mà chúng ta đã xác định (là id hoặc id/:x/:y hoặc id/:x/:y?)
  
    const id = req.params.id * 1; //thủ thuật của js :Khi chúng ta nhân một chuỗi với một số thì chúng sẽ tự chuyển đổi chuỗi thành 1sô
    const tour = tours.find((el) => el.id === id); // tìm vị trí phần tử có id = id của url*/
    //Tour.findOne({_id : req.params.id})

    let query = Model.findById(req.params.id)
    if(popOptions) query = query.populate(popOptions)

    const doc = await query
      
      if(!doc){
        return next(new AppError('No document found with that ID'),404)
      }
  
      res.status(200).json({
        status: 'sucess',
        data: {
          data: doc,
        },
      });
  });

exports.getAll = Model => catchAsync(async (req, res,next) => {
    
    // to allow for nested GET review on tour (hack)
    let filter = {};
    if(req.params.tourId) filter = {tour : req.params.tourId} // bài 14 phần 11 : Adding a nested end Point
    
    //----EXECUTE QUERY
    const features = new APIFeatures(Model.find(filter),req.query).filter().sort().limitFields().paginate();

    // const doc = await features.query.explain()
    const doc = await features.query
 
    // const query = Tour.find().where('duration').equals(5).where('difficulty').equals('easy')

    //----SEND RESPONSE
    res.status(200).json({
      status: 'sucess',
      results: doc.length,
      data: {
        data:doc,
      },
    });
});