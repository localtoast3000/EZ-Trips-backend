import mongoose from 'mongoose';

const programSchema = mongoose.Schema({
    nbDay: Number,
    detailedProgram: [{day: Number, activities: String}],
    price: Number,
   });

const travelPeriodSchema = mongoose.Schema({
    start: Number, 
    end: Number
})

   const tripSchema = mongoose.Schema({
    name: String, 
    country: String,
    partnerID: [{ type: mongoose.Schema.Types.ObjectId, ref: "partners"}],
    addressDeparture: String,
    minDurationDay: Number,
    maxDurationDay: Number,
    travelPeriod: [travelPeriodSchema],
    description: String,
    included: [String],
    nonIncluded: [String],
    photos: [String],
    background: String,
    tags: [String],
    program: [programSchema],
   });
   
   const Trip = mongoose.model('trips', tripSchema);
   
   export default Trip;