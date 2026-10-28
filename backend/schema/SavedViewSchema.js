const {Schema} = require("mongoose");

const SavedViewSchema = new Schema(
  {
    owner: {type: String,required: true,trim: true,lowercase: true,index: true},
    name: {type: String,required: true,trim: true, maxlength: 40},
    query:{type:Object, default:{}},
  },
  {timestamps: true, minimize:false}

);


SavedViewSchema.index(
  {owner: 1, name:1},
  {unique:true,collation:{locale:"en",strength: 2}}
);

module.exports = {SavedViewSchema};