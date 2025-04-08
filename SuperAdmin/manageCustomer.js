const Customer = require('../models/customerModel');
const Product = require('../models/productModel')
const  {successResponse,errorResponse} = require('../config/response');
const { ProductEnum } = require('../config/global');

module.exports.clearProducts = async (req,res) => {
    try{
        await Customer.updateMany({}, { $set: { products: [] } });
        return successResponse(res,"All customers' products cleared successfully",null,null);
    }  catch (error) {
        return errorResponse(res, "Error Customers' products clearing!", 500, error);
    }
};

module.exports.manageProductStatus = async (req, res) => {
    try {
        const { productId, productStatus, customerId } = req.body;

        if (!productId || !productStatus) {
            return errorResponse(res, "Product ID and Product Status are required", 400);
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

        if (productStatus === ProductEnum.NEW || productStatus === ProductEnum.EXHAUSTED) {
            await Customer.updateMany(
                { products: productId },
                { $pull: { products: productId } }
            );

            return successResponse(res, "Product removed from customers and status updated", null, null);
        }

        if (productStatus === ProductEnum.IN_USE) {
            if (!customerId) {
                return errorResponse(res, "Customer ID is required for 'inuse' status", 400);
            }

            const customer = await Customer.findById(customerId);
            if (!customer) {
                return errorResponse(res, "Customer not found", 404);
            }

            if (!customer.products.includes(productId)) {
                customer.products.push(productId);
                await customer.save();
            }

            return successResponse(res, "Product assigned to customer and status updated", null, null);
        }

    } catch (error) {
        return errorResponse(res, "Error updating product status", 500, error);
    }
};

