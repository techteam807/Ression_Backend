const express = require("express");
const ProductController = require("../controllers/productController");

const router = express.Router();

router.get("/", ProductController.getProduct);
router.post("/", ProductController.AddProduct);
router.put("/:id", ProductController.EditProduct);
router.delete("/:id", ProductController.DeleteProduct);
router.post("/associate", ProductController.addProductToCustomer);
router.get("/:customerId/products", ProductController.getCustomerProducts);

module.exports = router;
