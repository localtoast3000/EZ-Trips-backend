import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
  token: String,
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  address: String,
  country: String,
  birthDate: Date,
  sexe: String,
  inscriptionDate: Date,
  preferences: [String],
  tripsLiked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'trips' }],
  tripsBooked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'orders' }],
  documents: [String],
});

const User = mongoose.model('users', userSchema);

export default User;
