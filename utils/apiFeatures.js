/* eslint-disable prettier/prettier */
class APIFeatures {
    constructor(query,queryString){
      this.query = query
      this.queryString = queryString
    }
  
    filter(){
      //1A) Fitering
      // eslint-disable-next-line node/no-unsupported-features/es-syntax
      const queryObj = {...this.queryString} // ... => sẽ lấy tất cả các trường ra khỏi object và {} => tạo thành 1 đối tượng mới(copy lại bản cũ)
      const excludeFields = ['page','sort','limit','fields']
  
      excludeFields.forEach(el => delete queryObj[el])
  
      //1B)Advanced Filtering
      let queryStr = JSON.stringify(queryObj)
      queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`) /* --Chú ý : \b-\b dùng để lấy chính xác các từ mà ko lấy các chuỗi chứa các từ đó
      ----------------------------------------------------- /g thêm vào là để thay thế tất cả các toán tử (xuất hiện nh lần) */
      
      this.query =  this.query.find(JSON.parse(queryStr))
      // let query = Tour.find(JSON.parse(queryStr)) // trả về toàn bộ dữ liệu trong databases (Tour.find()) -- Bài 14 Phần 8(chú ý xem lại)
      return this;// trả lại toàn bộ đối tượng
    }
  
    sort(){
      if(this.queryString.sort){
        const sortBy = this.queryString.sort.split(',').join(' ')
        console.log(sortBy)
        this.query = this.query.sort(sortBy)
        // sort (price ratingsAverage)
      } else {
        this.query = this.query.sort('-createdAt')
      }
  
      return this;
    }
  
    limitFields(){
      if(this.queryString.fields){
        const fields = this.queryString.fields.split(',').join(' ')
        this.query = this.query.select(fields)
      } else {
        this.query = this.query.select('-__v')
      }
  
      return this;
    }
  
    paginate(){
      const page = this.queryString.page * 1 || 1
      const limit = this.queryString.limit * 1 || 100
      const skip = (page-1)*limit
  
      this.query = this.query.skip(skip).limit(limit)
      return this;
    }
    
}
module.exports = APIFeatures;
  