const { ProductEnum } = require("../config/global");
const WareHouseS = require("../models/wareHouseModel");
const Product = require("../models/productModel");
const ProductService = require("../services/productService")

const getWareHouses = async(filter = {}, search) => {
    if(search) {
        filter.$or = [
          { wareHouseCode: new RegExp(search, "i")},
        ];
      }

      const wareHouse = await WareHouseS.find(filter);
    
      return { wareHouse};
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

const scanMultipleProductsOLd = async (Product_Codes,wareHouse_code) => {
    let messages = [];
    let success = false;
    const warehouse = await getwareHousesByCode(wareHouse_code);

    if(!warehouse)
    {
        return { success: false, message: `No WareHouse found for given code: ${wareHouse_code}`};
        // messages.push(`No WareHouse found for given code: ${wareHouse_code}`);
    }
    
    const Products = await ProductService.getMultipleProductByCode(Product_Codes);

    const foundProductCodes = Products.map((p) => p.productCode);

    const missingProductCodes = Product_Codes.filter(code => !foundProductCodes.includes(code));

    if (missingProductCodes.length > 0) {
        // return { success: false, message: `No products found for given code ${missingProductCodes.join(", ")}` };
        messages.push(`No products found for given codes : ${missingProductCodes.join(", ")}`);
    }

    //extract products
    const exhaustedProducts = Products.filter((p) => p.productStatus === ProductEnum.EXHAUSTED && p.isActive);
    console.log("ex:",exhaustedProducts);

    const newProducts = Products.filter((p) => p.productStatus === ProductEnum.NEW && p.isActive);
    console.log("N:",newProducts);

    const inUseProducts = Products.filter((p) => p.productStatus === ProductEnum.IN_USE && p.isActive);
    console.log("in:",inUseProducts);

    const deletedProducts = Products.filter((p) => !p.isActive);
    console.log("del:",deletedProducts);

    //extract productcodes
    const exhaustedCodes = exhaustedProducts.map((ep) => ep.productCode).join(", ");
    const newCodes = newProducts.map((np) => np.productCode).join(", ");
    const inUseCodes = inUseProducts.map((ip) => ip.productCode).join(", ");
    const deletedCode = deletedProducts.map((dp) => dp.productCode).join(", ");

    

    if(newProducts.length > 0)
    {
        messages.push(`Product status already NEW for: ${newCodes}`);
    }

    if(deletedProducts.length > 0)
    {
        messages.push(`Product Is Not Active for: ${deletedCode}`);
    }    

    if(inUseProducts.length > 0)
    {
        messages.push(`Product status InUse for: ${inUseCodes}`);
    }   

    if (exhaustedProducts.length > 0 && missingProductCodes.length === 0 && newCodes.length === 0 && inUseCodes.length === 0 && deletedCode.length === 0)
    {
        const exhaustedProductIds = exhaustedProducts.map((product) => product._id);

        await Product.updateMany(
            {_id: {$in:exhaustedProductIds} },
            {$set:{productStatus:ProductEnum.NEW,isActive:true}}
        )

        messages.push(`Product status updated to NEW for: ${exhaustedCodes}`);
        success=true;
    }

    return {
        success,
        message:messages,
        ProductCodes: {
            notFound: missingProductCodes,
            alreadyNew: newCodes, 
            inUse:inUseCodes,
            deleted: deletedCode, 
        },
        data: exhaustedProducts, 
    };
};

const scanMultipleProducts = async (Product_Codes,wareHouse_code) => {
    let messages = [];
    let success = false;

    //validate WareHose
    const ware_house = await getwareHousesByCode(wareHouse_code);

    if(!ware_house)
    {
        return { success: false, message: `No Warehouse found for the given code: ${wareHouse_code}` };
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
            // else
            // {
            //     messages.push("Product Filter Dose Not Processed");
            // }        
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
    const NotFoundProductCodes = missingProductCodes.join(", ");;

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
    // else
    // {
    //     messages.push(`Product Filter Dose Not Processed`);
    // }

    //process for update product status exhausted to new
    if(ExhaustedProducts.length > 0 && !NewProductCodes && !InUseProductCodes && !DeletedProductCodes && !NotFoundProductCodes)
    {
        const ExhaustedProductIds = ExhaustedProducts.map(p => p._id);

        await Product.updateMany(
            { _id: { $in: ExhaustedProductIds } },
            { $set: { productStatus: ProductEnum.NEW, isActive: true } }
        );

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

module.exports = { getWareHouses, getwareHousesByCode, createWareHouse, deleteWareHouse, scanMultipleProducts };


