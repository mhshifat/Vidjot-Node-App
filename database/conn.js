const mongoose = require("mongoose")
const color = require("colors")

module.exports = mongoose.connect('mongodb://shifat:shifat1@ds121182.mlab.com:21182/vidjot', { useNewUrlParser: true } , () => {
  console.log(color.yellow(`==> A Database Connection Has Been Eshtablished`))
})