/* eslint-disable prettier/prettier */
const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator')

const tourSchema = new mongoose.Schema({ // chỉ định 1 lược đồ dữ liệu (mô tả nó và thực hiện 1 số xác thực)
    name: {
      type : String,
      required : [true,'A tour must have a name'], // trình xác thực
      unique : true, // xác định dữ liệu là duy nhất(ko phải trình xác thực)
      trim : true,
      maxlength : [40,'A tour must have less or equal then 40 characters'],
      minlength : [10,'A tour must have more or equal then 10 characters'], // trình xác thực chỉ xác định trên String
      // validate : [validator.isAlpha, 'Tour name must only contain characters'] // isAlpha ko chấp nhận số và khoảng trắnng(space)
    },
    slug : String,
    duration : {
      type : Number,
      required : [true,'A tour must have a duration']
    },
    maxGroupSize : {
      type : Number,
      required : [true,'A tour must have a group size']
    },
    difficulty : {
      type : String,
      required : [true,'A tour must have a difficulty'], // đây là cách viết tắt cho object hoản chỉnh(-enum(object)-hoàn chỉnh-)
      enum : {
        values : ['easy','medium','difficult'], /* nếu thêm đối số đằng sau mảng thì sẽ không dành 
        -------------------------------cho thông báo lỗi bới đối số thêm vào sẽ là 1 giá trị khác*/
        message : 'Difficulty is either : easy , medium , difficult'
      } // ko dành cho Number
    },
    ratingsAverage: {
      type : Number,
      default : 4.5, // nếu k xét thông số cho dữ liệu này thì sẽ tự động đặt thành 4.5
      min : [1,'Rating must be above 1.0'],
      max : [5,'Raing must be below 5.0'], // ko chỉ dành cho Number mà còn dành cho Date
      set : val => Math.round(val * 10 ) / 10  // 4.666666 -> 46.666666 -> 47 -> 4.7
    },
    ratingsQuantity : {
      type : Number,
      default : 0
    },
    price: {
      type : Number,
      required : [true,'A tour must have a price']
    },
    priceDiscount : {
      type : Number,
      validate : { 

        validator : function(val){ //val là giá trị ng dùng nhập vào
          //this only points to current doc on NEW document creation
          return val < this.price // this -> trỏ đến tài liệu hiện tại khi chúng ta create chúng 
        },
        message : 'Discount price ({VALUE}) should be below regular price'
        //message cũng có quyền truy cập vào value(internal to moongose)
      }
    },
    summary : {
      type : String,
      trim : true, // sẽ cắt bỏ khoảng trống đầu và cuối của String
      required : [true,'A tour must have a description']
    },
    description : {
      type : String,
      trim : true
    },
    imageCover : {
      type : String,
      required : [true,'A tour must have a cover image']
    },
    images : [String],
    createdAt : {
      type : Date,
      default : Date.now(),
      select : false
    },
    startDates : [Date],
    secretTour : {
      type : Boolean,
      default : false
    },
    startLocation : { //Bài 4 - phần 11 Modelling Location
      // GeoJSON
      type : {
        type : String,
        default : 'Point',
        enum : ['Point']
      },
      coordinates : [Number], // điểm tọa độ (kinh độ đầu tiên và vĩ độ thứ hai)
      address : String,
      description : String
    },
    locations : [
      {
        type : {
          type : String,
          default : 'Point',
          enum : ['Point']
        },
        coordinates : [Number],
        address : String,
        description : String,
        day : Number
      }
    ],
    guides : [
      {
        type : mongoose.Schema.ObjectId,
        ref : 'User' // tham chiếu
      }
    ]
},
    {
      toJSON : {virtuals : true},
      toObject : {virtuals : true}
    }
)

//Bài 21 - Phần 11 :Improving read peformance with indexes
tourSchema.index({price : 1, ratingsAverage : -1});
tourSchema.index({slug : 1});
tourSchema.index({startLocation : '2dsphere'})

//-)Virtual property (thuộc tính ảo) --Bài 23 phần 8
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7; // từ this sẽ trỏ thẳng đến tài liệu hiện tại (this thường dùng cho function() ko có callback)
}) //virtual property sẽ đc tạo mỗi lần ta get data ra khỏi databases
//Chú ý : Ta ko thể sử dụng virtual property ở đây trong 1 query vì chúng ko phải là 1 phần của cơ sở dữ liệu

//Virtual populate
tourSchema.virtual('reviews', {
  ref : 'Review',
  foreignField : 'tour',
  localField : '_id'
})

//DOCUMENT MIDDLEWAREe : run before .save() and .create()
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, {lower : true})
  next()
})

/*tourSchema.post('save', function(doc,next) => { //doc là tài liệu vừa mới save vào databases
  console.log(doc)
  next()
}) ----------Tài liệu tham khảo*/

//QUERY MIDDLEWARE
//tourSchema.pre('find', function(next){
tourSchema.pre(/^find/, function(next){ 
  //---> /^find/ là biểu thức chính quy ko chỉ chỉ định 'find' mà còn là tât cả các lệnh bắt đầu = 'find...'
  //this là query object nên ta có thể xâu chuỗi tất cả các phương thức mà ta có
  this.find({secretTour : {$ne : true}})
  this.start = Date.now()
  next()
})

tourSchema.pre(/^find/, function(next){
  this.populate({
    path: 'guides',
    select : '-__v -passwordChangedAt' 
  })
  //populate in query not in databases --- populate chỉ là bước thay thế id bằng dữ liệu thực tế
  next()
})

tourSchema.post(/^find/, function(docs,next){
  console.log(`Query look ${Date.now()-this.start} milliseconds`)
  // console.log(docs)
  next()
})

/*
//AGGRERATION MIDDLEWARE
//pre : xảy ra trc khi aggregation được thực thi
tourSchema.pre('aggregate', function(next){
  // this -> trỏ đến aggregation object hiện tại
  this.pipeline().unshift({$match : {secretTour : {$ne : true}}}) // unshift là thêm vào đầu mảng >< shift là thêm vào cuối mảng
  console.log(this.pipeline())
  next()
})
*/
const Tour = mongoose.model('Tour',tourSchema);

module.exports = Tour;