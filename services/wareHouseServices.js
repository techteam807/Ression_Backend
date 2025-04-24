const { ProductEnum } = require("../config/global");
const WareHouseS = require("../models/wareHouseModel");
const Product = require("../models/productModel");
const ProductService = require("../services/productService");
const Log = require("../services/logManagementService");
const User = require('../models/userModel');

const getWareHouses = async(filter = {}, search) => {
    if(search) {
        filter.$or = [
          { wareHouseCode: new RegExp(search, "i")},
        ];
      }

      const wareHouse = await WareHouseS.find(filter).populate({
        path: "products",
        select: "productId productCode"
      });
    
      return { wareHouse};
};

const getWareHousesDropDown = async() => {
    return await WareHouseS.find().select("_id, wareHouseCode");
    
};

const getwareHousesByCode = async(wareHouse_code) => {
    return await WareHouseS.findOne({wareHouseCode:wareHouse_code});
};

const getwareHousesById = async(id) => {
    return await WareHouseS.findById(id);
};

const createWareHouse = async (wareHouse_code) => {
    return await WareHouseS.create({wareHouseCode:wareHouse_code});
};

const deleteWareHouse = async (id) => {
    const WareHouse = await getwareHousesById(id);

    if(!WareHouse)
    {
        return { success: false, message: "WareHouse not found"};
    }
    const wareHouse = await WareHouseS.findByIdAndDelete(id);

    return {
        success: true,
        message: "WareHouse deleted successfully",
        data: wareHouse,
      };
};

const scanMultipleProducts = async (Product_Codes, wareHouse_code,userId) => {
    let messages = [];
    let errorMessages = [];
    let success = false;

    //validate WareHose
    const ware_house = await getwareHousesByCode(wareHouse_code);
    const Users  = await User.findById(userId);

    // if(!ware_house)
    // {
    //     return { success: false, message: `No Warehouse found for the given code: ${wareHouse_code}` };
    // }

    // if (!Users) {
    //     return { success: false, message: `User not found with id:${userId}`};
    // }

    if (!ware_house) {
        errorMessages.push(`No Warehouse found for the given code: ${wareHouse_code}`);
      }
      
      if (!Users) {
        errorMessages.push(`User not found with id:${userId}`);
      }
      
      if (errorMessages.length > 0) {
        return {
          success: false,
          errorMessage:{errorMessages},
        };
      }

    //Fetch Products
    const Products = await ProductService.getMultipleProductByCode(Product_Codes);

    //validate Products
    const foundProductCodes = Products.map(p => p.productCode);
    const missingProductCodes = Product_Codes.filter(code => !foundProductCodes.includes(code));

    if (missingProductCodes.length > 0) {
        messages.push(`No products found for given codes: ${missingProductCodes.join(", ")}`);
    }

    //Extracts Products
    const ExhaustedProducts = [];
    const NewProducts = [];
    const InUseProducts = [];
    const DeletedProducts = [];

    //push products to thier array
    Products.forEach(product => {
        if(product.isActive)
        {
            if(product.productStatus === ProductEnum.EXHAUSTED)
            {
                ExhaustedProducts.push(product);
            }
            else if(product.productStatus === ProductEnum.NEW)
            {
                NewProducts.push(product);
            }
            else if(product.productStatus === ProductEnum.IN_USE)
            {
                InUseProducts.push(product);
            }     
        }
        else
        {
            DeletedProducts.push(product);
        }
    });

    //extract Productcodes
    const ExhaustedProductCodes = ExhaustedProducts.map(p => p.productCode).join(", ");
    const NewProductCodes = NewProducts.map(p => p.productCode).join(", ");
    const InUseProductCodes = InUseProducts.map(p => p.productCode).join(", ");
    const DeletedProductCodes = DeletedProducts.map(p => p.productCode).join(", ");
    const NotFoundProductCodes = missingProductCodes.join(", ");

    //push messeges
    if(NewProducts.length > 0)
    {
        messages.push(`Product status already NEW for: ${NewProductCodes}`);
    }
    else if(InUseProducts.length > 0)
    {
        messages.push(`Product status IN USE for: ${InUseProductCodes}`);
    }
    else if(DeletedProducts.length > 0)
    {
        messages.push(`Product is not active for: ${DeletedProductCodes}`);
    }

    //process for update product status exhausted to new
    if(ExhaustedProducts.length > 0 && !NewProductCodes && !InUseProductCodes && !DeletedProductCodes && !NotFoundProductCodes)
    {
        const ExhaustedProductIds = ExhaustedProducts.map(p => p._id);

        const wareHouseProducts = ware_house.products || [];
        const newwareHouseProducts =  ExhaustedProductIds.filter(id => !wareHouseProducts.includes(id));


        ware_house.products = [...wareHouseProducts, ...newwareHouseProducts];;
        await ware_house.save();

        await Product.updateMany(
            { _id: { $in: ExhaustedProductIds } },
            { $set: { productStatus: ProductEnum.NEW, isActive: true } }
        );

        const genrateLogForNew = {
              WareHouseId:ware_house._id,
              products:ExhaustedProducts.map((p) => p.id),
              userId:userId,
              status:ProductEnum.NEW,
            }
        
        await Log.createLog(genrateLogForNew);

        messages.push(`Product status updated to NEW for: ${ExhaustedProductCodes}`);
        success = true;
    }

    return {
        success,
        message: messages,
        ProductCodes: {
            notFound: NotFoundProductCodes,
            alreadyNew: NewProductCodes,
            inUse: InUseProductCodes,
            deleted: DeletedProductCodes
        },
        data: ExhaustedProducts
    };
};

module.exports = { getWareHouses, getWareHousesDropDown, getwareHousesByCode, createWareHouse, deleteWareHouse, scanMultipleProducts };


