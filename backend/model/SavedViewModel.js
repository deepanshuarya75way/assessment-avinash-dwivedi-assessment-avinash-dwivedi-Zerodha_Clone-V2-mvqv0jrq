const{model} = require("mongoose");

const{SavedViewSchema} = require("../schema/SavedViewSchema");

const SavedViewModel = new model("savedview",SavedViewSchema);

module.exports={SavedViewModel};