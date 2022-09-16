/* eslint-disable prettier/prettier */
/* eslint-disable prefer-arrow-callback */
const mongoose = require('mongoose');
const Tour = require('./tourModel')

const reviewSchema = new mongoose.Schema({
    review : {
        type : String,
        required : [true,'Review can not be empty']
    },
    rating : {
        type : Number,
        min : 1,
        max : 5
    },
    createdAt : {
        type : Date,
        default : Date.now()
    },
    tour : {
        type : mongoose.Schema.ObjectId, // viết -> Id not 'ID',"id"
        ref : 'Tour',
        required : [true,'Review must belong to a tour']
    },
    user : {
        type : mongoose.Schema.ObjectId,
        ref : 'User',
        required : [true,'Review must belong to a user']
    }
},
    {
        toJSON : {virtuals : true},
        toObject : {virtuals : true}
    }
)

reviewSchema.index({tour : 1,user : 1}, {unique : true})

reviewSchema.pre(/^find/, function(next){
    // this.populate({
    //     // path: 'tour user',
    //     path : 'tour',
    //     select : 'name' 
    // }).populate({
    //     path : 'user',
    //     select : 'name photo'
    // })

//populate in query not in databases --- populate chỉ là bước thay thế id bằng dữ liệu thực tế
    this.populate({
        path : 'user',
        select : 'name photo'
    });
    next();
})

//Bài 22 phần 11 :Calculating Average Rating on Tours P1
reviewSchema.statics.calcAverageRatings = async function(tourId){
    //Need aggregate on the model directly --> đó là lí do sử dụng static methods
    const stats = await this.aggregate([
        {
            $match : {tour :tourId}
        },
        {
            $group : {
                _id: '$tour',
                nRating:{$sum : 1},
                avgRating: {$avg : '$rating'},
            }
        }
    ])
    console.log(stats)

    if(stats.length > 0){
        await Tour.findByIdAndUpdate(tourId,{
            ratingsQuantity :stats[0].nRating,
            ratingsAverage : stats[0].avgRating
        })
    } else { // trường hợp mảng ko có phần tử   
        await Tour.findByIdAndUpdate(tourId,{
            ratingsQuantity : 0,
            ratingsAverage : 4.5
        })
    }
    
};

reviewSchema.post('save', function(){
    //this point to current review
    //constructor là model create ra document
    this.constructor.calcAverageRatings(this.tour);
});

//findByIdAndUpdate
//findByIdAndDelete
//Bài 22 - Phần 11: Calculating Average Rating on Tours P2
reviewSchema.pre(/^findOneAnd/,async function(next){
    //this ở đây là current query -> thực hiện query sau đó sẽ cung cấp cho ta tài liệu hiện đang đc xử lý
    this.r = await this.findOne() // r --> review
    // console.log(this.r)
    next()
})

reviewSchema.post(/^findOneAnd/, async function(){
    // await this.findOne(); does NOT work here, query has already executed
    await this.r.constructor.calcAverageRatings(this.r.tour)
})

const Review = mongoose.model('Review',reviewSchema);

module.exports = Review;