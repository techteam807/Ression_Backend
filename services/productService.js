
const ProductS = require("../models/productModel");
const Customer = require("../models/customerModel");
const WareHouse = require("../models/wareHouseModel.js");
const Log = require("../services/logManagementService.js");
const { ProductEnum } = require("../config/global");

const getPro = async (filter) => {
  try {
    return await ProductS.find(filter)
    .select("_id productCode").lean();
    
  } catch (error) {
    throw new Error("Error fetching products: ", error.message);
  }
};

const formatAdapterSize = (size) => {
  if (!size) return size;

  let formattedSize = size.replace(/"/g, " inch"); // Replace all occurrences of `"`
  formattedSize = formattedSize.replace(/\((.*?)\)/g, (match, p1) => ` | ${p1} mm`);

  return formattedSize.includes("|") ? formattedSize : formattedSize.replace(" | ", "");
};

const formatProduct = (product) => ({
  ...product.toObject(),
  adapterSize: formatAdapterSize(product.adapterSize),
});

const getAllProductsold = async (filter = {}, search, page, limit) => {
  if(search) {
    filter.$or = [
      // { productName: new RegExp(search, 'i') },
      { productCode:new RegExp(search, 'i')},
      { resinType:new RegExp(search, 'i')}
    ];
  }

  const options = {
    skip:(page -1) * limit,
    limit:parseInt(limit)
  }

  const products = await Product.find(filter).skip(options.skip).limit(options.limit);
  const totalRecords = await Product.countDocuments(filter);

  return {
    totalData:totalRecords,
    currentPage:parseInt(page),
    totalPages:Math.ceil(totalRecords/ limit),
    products,
  };
};

const getAllProducts = async (filter = {}, search,productStatus) => {

  if(search) {
    filter.$or = [
      { productCode: new RegExp(search, "i")},
      { resinType: new RegExp(search, "i") },
      {  productStatus: new RegExp(search, "i") },
    ];
  }
  if(productStatus){
    filter.productStatus = productStatus
  }
  // const products = await Product.find(filter);//default order
  const products = await ProductS.find(filter).sort({ updatedAt: -1 });//desc order
  
  // const newProducts = products.filter((p) => p.productStatus === ProductEnum.NEW).map(formatProduct);
  const exhaustedProducts = products.filter((p) => p.productStatus === ProductEnum.EXHAUSTED).map(formatProduct);

  //relevent fields
   let inuseProducts = products.filter((p) => p.productStatus === ProductEnum.IN_USE).map(formatProduct);
   let newProducts = products.filter((p) => p.productStatus === ProductEnum.NEW).map(formatProduct);
  

   const Customers = await Customer.find(
     { products: { $in: inuseProducts.map((p) => p._id) } },
     "contact_number first_name last_name mobile email display_name products" // Ensure 'products' is included
   );

   const ware_house = await WareHouse.find(
    { products : {$in: newProducts.map((p) => p._id) } },
    "wareHouseCode products"
   )

   newProducts = newProducts.map((product) => {
    const warehouseForProduct = ware_house.filter(
      (wareh) => Array.isArray(wareh.products) && wareh.products.includes(product._id.toString()) 
    );

    return {
      ...product,
      WareHouse: warehouseForProduct.length > 0 ? warehouseForProduct[0] :null,
    }
   })
 
   inuseProducts = inuseProducts.map((product) => {
     const customersForProduct = Customers.filter(
       (cust) => Array.isArray(cust.products) && cust.products.includes(product._id.toString()) // Safe check
     );
 
     return {
      ...product,
       Customer: customersForProduct.length > 0 ? customersForProduct[0] : null,
     };
   });
 
  return {
    newProducts,
    exhaustedProducts,
    inuseProducts
  };

};

const getProductById = async (id) => {
  return await ProductS.findById(id);
};

const createProduct = async (data) => {
  return await ProductS.create(data);
};

const updateProduct = async (id, data) => {
  const Product = await getProductById(id);

  if(!Product)
    {
      return { success: false, message: "Product not found"};
    }
    
  const product =await ProductS.findByIdAndUpdate(id, data, { new: true, runValidators: true });

  return {
    success: true,
    message: "Product Updated successfully",
    data: product,
  };
};

const deleteProduct = async (id, productNotes) => {
  const Product = await getProductById(id);

  if(!Product)
  {
    return { success: false, message: "Product not found"};
  }

  const product = await ProductS.findByIdAndUpdate(id,{isActive:false,productStatus:ProductEnum.EXHAUSTED, productNotes:productNotes},{new:true});

  const DeleteProductsLog = {
    products:id,
    isActive:false,
    status:ProductEnum.EXHAUSTED,
    productNotes:productNotes,
  }

  await Log.createLog(DeleteProductsLog)

  await Customer.updateMany(
    {products:id},
    {$pull: {products:id} }
  );

  return {
    success: true,
    message: "Product deleted successfully",
    data: product,
  };
};

const restoreProduct = async (id) => {
  const Product = await getProductById(id);

  if(!Product)
  {
      return { success: false, message: "Product not found"};
  }

  const product =await ProductS.findByIdAndUpdate(id,{isActive:true,productNotes:""},{new:true});

  const restoreProductsLog = {
    products:id,
    status:ProductEnum.EXHAUSTED,
  }

  await Log.createLog(restoreProductsLog)

  return {
    success: true,
    message: "Product Restored successfully",
    data: product,
  };
};

const associateProductWithCustomer = async (customerId, productId) => {
    const customer = await Customer.findById(customerId);
    if (!customer) throw new Error("Customer not found");
  
    const product = await ProductS.findById(productId);
    if (!product) throw new Error("Product not found");
  
    if (customer.products.includes(productId)) {
      throw new Error("Product is already associated with this customer");
    }
  
    customer.products.push(productId);
    await customer.save();
    
    return customer;
  };

  const getCustomerWithProducts = async (customerId) => {
    return await Customer.findById(customerId).populate("products");
  };

  const getProductBycode = async (product_code) => {
    return await ProductS.findOne({productCode:product_code});
  };

  const getMultipleProductByCode = async (product_codes) => {
    return await ProductS.find({productCode: {$in:product_codes}});
  };

  const uploadProducts = async(products) => {
    const insertedProducts = [];
    const duplicateProductCodes = [];
    const addedProducts = [];

    for (const product of products) {
      const ExisProduct = await getProductBycode(product.productCode);

      if(ExisProduct)
      {
        duplicateProductCodes.push(product.productCode);
      }
      else
      {
        insertedProducts.push(product);
      }
    }

    if (insertedProducts.length > 0) {
      const AddedProducts = await ProductS.insertMany(insertedProducts);
      addedProducts.push(AddedProducts);
    }

    const insertedProductCodes = insertedProducts.map((p) => p.productCode) 

    return {
      message:{
        insertedCount: insertedProducts.length,
        duplicateCount: duplicateProductCodes.length,
        duplicateProductCodes,
        insertedProductCodes,
      }
    };
  };

module.exports = { getPro, getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, associateProductWithCustomer, getCustomerWithProducts, getProductBycode, restoreProduct, getMultipleProductByCode, uploadProducts };
