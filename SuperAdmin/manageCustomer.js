const Customer = require("../models/customerModel");
const Product = require("../models/productModel");
const AdminOtp = require("../models/adminOTPModel");
const Log =  require('../services/logManagementService');
const { successResponse, errorResponse } = require("../config/response");
const { ProductEnum } = require("../config/global");
const { deleteProduct } = require("../services/productService");
const { sendWhatsAppOtp } = require("../services/userServices");
const { sendWhatsAppMsg } = require("../services/whatsappMsgServices");

module.exports.clearProducts = async (req, res) => {
  try {
    await Customer.updateMany({}, { $set: { products: [] } });
    return successResponse(
      res,
      "All customers' products cleared successfully",
      null,
      null
    );
  } catch (error) {
    return errorResponse(
      res,
      "Error Customers' products clearing!",
      500,
      error
    );
  }
};

module.exports.manageProductStatus = async (req, res) => {
  try {
    const { productId, productStatus, customerId } = req.body;

    if (!productId || !productStatus) {
      return errorResponse(
        res,
        "Product ID and Product Status is required",
        400
      );
    }

    if (!Object.values(ProductEnum).includes(productStatus)) {
      return errorResponse(res, "Invalid Product Status", 400);
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      { productStatus, isActive: true },
      { new: true }
    );

    if (!product) {
      return errorResponse(res, "Product not found", 404);
    }

    if (
      productStatus === ProductEnum.NEW ||
      productStatus === ProductEnum.EXHAUSTED
    ) {
      await Customer.updateMany(
        { products: productId },
        { $pull: { products: productId } }
      );

      const genrateLogForProducts = 
      {
        products:productId,
        status:productStatus,
        productNotes:'Managed By Admin'
      };
      await Log.createLog(genrateLogForProducts);

      
      return successResponse(res, "Product updated successfully", null, null);
    }

    if (productStatus === ProductEnum.IN_USE) {
      if (!customerId) {
        return errorResponse(
          res,
          "Customer ID is required for 'inuse' status",
          400
        );
      }

      await Customer.updateMany(
        { products: productId },
        { $pull: { products: productId } }
      );

      const customer = await Customer.findById(customerId);
      if (!customer) {
        return errorResponse(res, "Customer not found", 404);
      }

      if (!customer.products.includes(productId)) {
        customer.products.push(productId);
        await customer.save();
      }

      const customerName = customer.display_name;
      const rawMobile = customer.mobile;
      const cutomerMobileNumber = rawMobile.replace(/\D/g, '').slice(-10);
      const genrateLogForIN_USE = 
      {
        customerId:customerId,
        products:productId,
        status:ProductEnum.IN_USE,
        productNotes:'Managed By Admin'
      };
      await sendWhatsAppMsg(cutomerMobileNumber,customerName);
      await Log.createLog(genrateLogForIN_USE);

      return successResponse(res, "Product updated successfully", null, null);
    }
  } catch (error) {
    return errorResponse(res, "Error updating product status", 500, error);
  }
};

module.exports.sendOtpForDeleteProduct = async (req, res) => {
  try {
    const mobile_number = process.env.USER_MOBILE_NUMBER;

    const result = await generateOtpForProductDelete(mobile_number);

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    console.error("Error sending OTP for delete product:", error); // <== Already here
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong. Please try again later.",
    });
  }
};

module.exports.deleteProductProcess = async (req, res) => {
  try {
    const { id, otp } = req.body;

    if (!id || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "ID and OTP are required" });
    }

    const validOtp = await AdminOtp.findOne({
      otp,
      CreatedAt: { $gt: new Date() },
    });

    if (!validOtp) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }

    const deletionResult = await deleteProduct(id);

    await AdminOtp.deleteOne({ _id: validOtp._id });

    return res.status(200).json(deletionResult);
  } catch (error) {
    console.error("Error in deleteProductProcess:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports.manageProductCode = async (req, res) => {
  try
  {
    const {productId , NewproductCode } = req.body;

    if (!productId || !NewproductCode) {
      return errorResponse(
        res,
        "Product ID and New Product Code is required",
        400
      );
    }

    const oldProduct = await Product.findById(productId);
    if (!oldProduct) {
      return errorResponse(res, "Product not found", 404);
    }

    const updateProduct = await Product.findByIdAndUpdate(
      productId,
      { productCode:NewproductCode},
      { new: true }
    );

    const genrateLogForProductsUpdate = {
      products:productId,
      status:oldProduct.productStatus,
      productNotes:`Product Code Update: ${oldProduct.productCode} to ${NewproductCode} `
    }
    await Log.createLog(genrateLogForProductsUpdate)
  return successResponse(res, "Product Code updated successfully", null, null);
  }
  catch (error)
  {
    return errorResponse(
      res,
      error.message.includes("E11000")
        ? "Product code must be unique"
        : error.message,
      400
    );
  }
};

const generateOtpForProductDelete = async (mobile_number) => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  const CreatedAt = new Date(Date.now() + 2 * 60 * 1000);

  await sendWhatsAppOtp(mobile_number, otp);
  const otpRecord = await AdminOtp.create({ otp: otp.toString(), CreatedAt });

  setTimeout(async () => {
    await AdminOtp.deleteOne({ _id: otpRecord._id });
    console.log("OTP expired and removed from database");
  }, 2 * 60 * 1000);

  return {
    success: true,
    message: "OTP has been sent to your mobile number.",
    statusCode: 200,
  };
};
