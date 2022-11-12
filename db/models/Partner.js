import mongoose from "mongoose";

const partnerSchema = mongoose.Schema({
    token : String,
    name: String,
    email: String,
    password: String,
    address: String,
    country: String, 
    inscriptionDate: Date,
    trips: [{type : mongoose.Schema.Types.ObjectId, ref: 'trips'}]
});

const Partner = mongoose.model('partners', partnerSchema)

export default Partner;