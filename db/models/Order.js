import mongoose from "mongoose";



const orderSchema = mongoose.Schema({
    user : {type: mongoose.Schema.Types.ObjectId, ref : 'users'},
    trip : {type: mongoose.Schema.Types.ObjectId, ref: 'trips'},
    start : Date,
    end : Date,
    bookingDate: Date,
    nbDays: Number,
    nbTravelers: Number,
    comments: String,
    status: String,
    totalPrice : Number,
})

const Order = mongoose.model('orders', orderSchema)

export default Order;