const express = require("express");
const ProductController = require("../controllers/productController");
const { validateRequest } = require("../config/validation");
const { createProduct,updateProduct } = require("../validations/productValidation");

const router = express.Router();

router.get("/", ProductController.getProduct);
router.post("/", validateRequest(createProduct),ProductController.AddProduct);
router.put("/:id", validateRequest(updateProduct),ProductController.EditProduct);
router.put("/delete/:id", ProductController.DeleteProduct);
router.put("/restore/:id", ProductController.RestoreProduct);
router.post("/associate", ProductController.addProductToCustomer);
router.get("/:customerId/products", ProductController.getCustomerProducts);
router.get("/code",ProductController.getProductByCode)

module.exports = router;
