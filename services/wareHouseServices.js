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

const createWareHouse = async (wareHouse_code) => {
    return await WareHouse.create({wareHouseCode:wareHouse_code});
};

const deleteWareHouse = async (id) => {
    return await WareHouse.findByIdAndDelete(id);
};

const scanMultipleProducts = async (Product_Codes) => {
    console.log("Received Product Codes:", Product_Codes);
    
    const Products = await ProductService.getMultipleProductByCode(Product_Codes);
    console.log("p",Products)

    if (!Products.length) {
        return { success: false, message: "No products found for given codes." };
    }

    //extract products
    const exhaustedProducts = Products.filter((p) => p.productStatus === ProductEnum.EXHAUSTED);
    console.log("e",exhaustedProducts);

    const newProducts = Products.filter((p) => p.productStatus === ProductEnum.NEW);
    console.log("n",newProducts);

    const notProcedProduts = Products.filter((p) => p.productStatus !== ProductEnum.EXHAUSTED);
    console.log("Nop",notProcedProduts);

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


