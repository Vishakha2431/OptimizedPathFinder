// models/Station.js
import mongoose from "mongoose";

const coordinatesSchema = new mongoose.Schema(
  {
    lat: { type: Number, min: -90, max: 90 },
    lng: { type: Number, min: -180, max: 180 },
  },
  { _id: false }
);

const connectionSchema = new mongoose.Schema({
  station: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Station",
    required: true,
  },
  distance: { type: Number, required: true, min: 0 },
  cost: { type: Number, required: true, min: 0 },
});

const stationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 80,
    unique: true,
  },
  coordinates: { type: coordinatesSchema, default: null },
  connections: [connectionSchema],
});

const Station = mongoose.model("Station", stationSchema);

export default Station;
