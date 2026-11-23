// Each controller chooses a Pug template from public/views.

exports.home = (req, res) => {
  res.render("home");
};

exports.about = (req, res) => {
  res.render("about");
};

exports.faq = (req, res) => {
  res.render("faq");
};

exports.cart = (req, res) => {
  res.render("cart");
};

exports.profile = (req, res) => {
  res.render("profile");
};

exports.checkout = (req, res) => {
  res.render("checkout");
};

exports.shop = (req, res) => {
  res.render("item-catelog");
};