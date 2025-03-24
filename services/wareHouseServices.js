const { ProductEnum } = require("../config/global");
const WareHouse = require("../models/wareHouseModel");
const Product = require("../models/productModel");
const ProductService = require("../services/productService")

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

const getwareHousesById = async(id) => {
    return await WareHouse.findById(id);
};

const createWareHouse = async (wareHouse_code) => {
    return await WareHouse.create({wareHouseCode:wareHouse_code});
};

const deleteWareHouse = async (id) => {
    const WareHouse = await getwareHousesById(id);

    if(!WareHouse)
    {
        return { success: false, message: "WareHouse not found"};
    }
    const wareHouse = await WareHouse.findByIdAndDelete(id);

    return {
        success: true,
        message: "WareHouse deleted successfully",
        data: wareHouse,
      };
};

const scanMultipleProducts = async (Product_Codes,wareHouse_code) => {
    const warehouse = await getwareHousesByCode(wareHouse_code);

    if(!warehouse)
    {
        return { success: false, message: `No WareHouse found for given code: ${wareHouse_code}`};
    }
    
    const Products = await ProductService.getMultipleProductByCode(Product_Codes);

    if (!Products.length) {
        return { success: false, message: "No products found for given codes." };
    }

    //extract products
    const exhaustedProducts = Products.filter((p) => p.productStatus === ProductEnum.EXHAUSTED);

    const newProducts = Products.filter((p) => p.productStatus === ProductEnum.NEW);

    const notProcedProduts = Products.filter((p) => p.productStatus !== ProductEnum.EXHAUSTED);

    //extract productcodes
    const exhaustedCodes = exhaustedProducts.map((ep) => ep.productCode).join(", ");
    const newCodes = newProducts.map((np) => np.productCode).join(", ");
    const notProcessedCodes = notProcedProduts.map((notp) => notp.productCode).join(", ");

    let messages = [];

    if(newProducts.length > 0)
    {
        messages.push(`Product status already NEW for: ${newCodes}`);
    }

    if(notProcedProduts)
    {
        messages.push(`Product status not updated for: ${notProcessedCodes}`);
    }    

    if (exhaustedProducts.length > 0)
    {
        const exhaustedProductIds = exhaustedProducts.map((product) => product._id);

        await Product.updateMany(
            {_id: {$in:exhaustedProductIds} },
            {$set:{productStatus:ProductEnum.NEW}}
        )

        messages.push(`Product status updated to NEW for: ${exhaustedCodes}`);
    }

    return {
        success:exhaustedProducts.length > 0,
        message: messages.join(" & "),
        data: exhaustedProducts, 
    };
};

module.exports = { getWareHouses, getwareHousesByCode, createWareHouse, deleteWareHouse, scanMultipleProducts };


