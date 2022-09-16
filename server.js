/* eslint-disable prettier/prettier */
// eslint-disable-next-line prettier/prettier
const mongoose = require('mongoose');
const dotenv = require('dotenv');


process.on('uncaughtException' , err => {
  console.log(err.name,err.message)
  console.log('UNCAUGHTEXCEPTION ! SHUTTING DOWN....')
  process.exit(1)
})

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASES.replace('<PASSWORD>',process.env.DATABASES_PASSWORD);  
mongoose.connect(DB, {
  useNewUrlParser: true,
  useCreateIndex : true,
  useFindAndModify: false,
  useUnifiedTopology: true
}).then(() => {
  console.log('DB connection succesful!')
})

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log(err.name,err.message)
  console.log('UNHANDLEREJECTION ! SHUTTING DOWN....')
  server.close(() =>{
    process.exit(1)
  })
})
