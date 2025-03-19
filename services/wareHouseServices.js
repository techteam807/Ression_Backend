const WareHouse = require("../models/wareHouseModel");

const getWareHouses = async(filter = {}, search) => {
    if(search) {
        filter.$or = [
          { wareHouseCode: new RegExp(search, "i")},
        ];
      }

      const wareHouse = await WareHouse.find(filter);
    
      return { wareHouse};
};

const getwareHousesByCode = async(wareHouse_code) => {
    return await WareHouse.findOne({wareHouseCode:wareHouse_code});
};

const createWareHouse = async (wareHouse_code) => {
    return await WareHouse.create({wareHouseCode:wareHouse_code});
};

const deleteWareHouse = async (id) => {
    return await WareHouse.findByIdAndDelete(id);
}

module.exports = { getWareHouses, getwareHousesByCode, createWareHouse, deleteWareHouse };