const { Schema } = require("mongoose");

const OrdersSchema = new Schema({
  name:{type:String,index:true},
  qty:Number,
  price: Number,
  mode: {type:String, enum: ["BUY","SELL"]},
  product:{type:String,enum:["CNC","MIS","NRML"],default:"CNC"},
  status:{
    type:String,
    enum:["COMPLETE","PENDING","CANCELLED","REJECTED"],
    default:"COMPLETE",
  },
  value:Number,
  executedAt:{type:Date,default:Date.now,index:true},
});

OrdersSchema.pre("save",function(){
  this.value = Number(this.qty)*Number(this.price);
});

module.exports = { OrdersSchema };