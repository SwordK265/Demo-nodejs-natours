/* eslint-disable prettier/prettier */
const path = require('path')
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')

const app = express();
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRouter')

//Bài 3 - Phần 12 : Setting up pug in express
app.set('view engine','pug')
app.set('views',path.join(__dirname,'views'))

//------------------------) Global Middleware
//Serving static files
app.use(express.static(path.join(__dirname,'public'))); //serving static(tệp tĩnh) từ 1 thư mục (ko phải routes)

// Set security HTTP headers
app.use(helmet())

//Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Limiting requests from same API
const limiter = rateLimit({
  max : 100,
  windowMS : 60*60*1000,
  message : 'Too many request from this IP, please try again in an hour'
}) // tối đa request api 100 lần trong 1h
app.use('/api',limiter);

//Body parser, reading data from body into req.body
app.use(express.json({limit : '10kb'})); // để truy cập vào phần body(res.body)
app.use(cookieParser());

//Data sanitization against NoSQL query injection --Bài 22 Phần 10 : data sanitization
app.use(mongoSanitize());
//Data sanitization against XSS
app.use(xss());

//Prevent parameter pollution
app.use(hpp({
  whitelist : ['duration','ratingsQuantity','ratingsAverage','maxGroupSize','difficulty','price']
}))

//Test middleware
app.use((req, res, next) => {
  req.resquestTime = new Date().toISOString(); // toISOString() sẽ chuyển đổi thành một chuỗi dễ đọc hơn
  next();
});

//------------------------) Route
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter); // gắn bố định tuyến
app.use('/api/v1/reviews', reviewRouter);
app.use('/', viewRouter);

// Middleware này sẽ được truy cập nếu ko được xử lý bởi bất kỳ các route khác
/*----) all : sẽ chạy cho tất cả các phương thức http (get,post,update,delete) 
------) '*' : sẽ đại diện cho everything(tất cả các url chưa được xử lý) */
app.all('*', (req,res,next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`,404))
})


app.use(globalErrorHandler)

module.exports = app;
