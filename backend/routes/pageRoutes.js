const express = require("express");
const pages = require("../controllers/pageController");

const router = express.Router();

router.get("/", pages.home);
router.get("/home", pages.home);
router.get("/about", pages.about);
router.get("/faq", pages.faq);
router.get("/cart", pages.cart);
router.get("/profile", pages.profile);
router.get("/profile/:section", pages.profile);
router.get("/checkout", pages.checkout);
router.get("/shop", pages.shop);

module.exports = router;