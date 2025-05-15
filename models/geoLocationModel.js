const mongoose = require('mongoose');

const GeoLocationSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", unique: true }, 
    geoCoordinates: {
        type: { type: String, enum: ['Point']},
        coordinates: { type: [Number] },// [longitude, latitude]  
        default:{} 
      },
    MaingeoCoordinates: {
        type: { type: String, enum: ['Point']},
        coordinates: { type: [Number] },// [longitude, latitude]  
        default:{} 
      },
},
{ timestamps: true }
);

GeoLocationSchema.index({ geoCoordinates: "2dsphere" });
GeoLocationSchema.index({ MaingeoCoordinates: "2dsphere" });

module.exports = mongoose.model('geoLocation', GeoLocationSchema);