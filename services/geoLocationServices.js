const GeoLocation =  require("../models/geoLocationModel");
const Customers =  require("../models/customerModel");
const Products =  require("../models/productModel");

const storeGeoLocation = async (customerId, geoCoordinates) => {

    const customer = await Customers.findById(customerId);

    if (!customer) {
      return {
        status: false,
        message: `Customer Not Found With Id ${customerId}`
      };
    }

    const existingLocation = await GeoLocation.findOne({ customerId });

    const newCoordinates = (
      geoCoordinates &&
      geoCoordinates.longitude &&
      geoCoordinates.latitude
    ) ? {
      type: 'Point',
      coordinates: [
        parseFloat(geoCoordinates.longitude),
        parseFloat(geoCoordinates.latitude)
      ]
    } : null;

    if(existingLocation)
    {
        if( geoCoordinates &&
            geoCoordinates.longitude &&
            geoCoordinates.latitude){
                existingLocation.geoCoordinates = newCoordinates;
                await existingLocation.save();
            }
        return {
          status: true,
          message: 'GeoLocation updated successfully',
          data: existingLocation
        };
    }
    else
    {
    const newGeo = await GeoLocation.create({
      customerId,
      geoCoordinates: newCoordinates
    });
    return {
        status: true,
        message: 'GeoLocation created successfully',
        data: newGeo
      };
    }
};

// const storeGeoLocation = async (customerId, geoCoordinates) => {
//   const customer = await Customers.findById(customerId);

//   if (!customer) {
//     return {
//       status: false,
//       message: `Customer Not Found With Id ${customerId}`
//     };
//   }

//   const existingLocation = await GeoLocation.findOne({ customerId });

//   const newCoordinates = (
//     geoCoordinates &&
//     geoCoordinates.longitude &&
//     geoCoordinates.latitude
//   ) ? {
//     type: 'Point',
//     coordinates: [
//       parseFloat(geoCoordinates.longitude),
//       parseFloat(geoCoordinates.latitude)
//     ]
//   } : null;

//   if (existingLocation) {
//     // Update only geoCoordinates, do not change mainGeoCoordinates
//     if (newCoordinates) {
//       existingLocation.geoCoordinates = newCoordinates;
//       await existingLocation.save();
//     }
//     return {
//       status: true,
//       message: 'GeoLocation updated successfully',
//       data: existingLocation
//     };
//   } else {
//     // First time insert, populate both geoCoordinates and mainGeoCoordinates
//     const newGeo = await GeoLocation.create({
//       customerId,
//       geoCoordinates: newCoordinates,
//       MaingeoCoordinates: newCoordinates  // Set the same value as geoCoordinates initially
//     });
//     return {
//       status: true,
//       message: 'GeoLocation created successfully',
//       data: newGeo
//     };
//   }
// };

const getGeoLocations = async () => {
    const geoLocations = await GeoLocation.find();

    const results= [];

    for (const location of geoLocations) {
        const customer = await Customers.findById(location.customerId);

        if (!customer) continue;
  
        const products = await Products.find({
          _id: { $in: customer.products }
        }).select("_id productCode status");

        results.push({
            customer: {
              id: customer._id,
              name: customer.display_name,
              products
            },
            geoCoordinates: location.geoCoordinates
          });
    }

    return {
        status: true,
        message:"get all products locations",
        data: results
      };
}

module.exports = {storeGeoLocation, getGeoLocations};
