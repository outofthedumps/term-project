// Each controller chooses a Pug template from public/views.

exports.home = (req, res) => {
  // Temporary records for the layout. Replace these with database results later.
  const featuredItems = Array.from({ length: 3 }, (_, index) => ({
    id: index + 1,
    name: `Featured item ${index + 1}`,
    category: "Category",
    description: "An item description will appear here.",
    price: null,
    imageUrl: null,
    badge: "Featured"
  }));

  res.render("home", { featuredItems });
};

exports.about = (req, res) => {
  res.render("about");
};

exports.faq = (req, res) => {
  res.render("faq");
};


exports.cart = (req, res) => {
  // Eventually supplied by the user's cart session/database.
  const cartItems = res.locals.cartItems || [];

  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  });

  const items = cartItems.map(item => {
    const quantity = Number(item.quantity);
    const price = Number(item.price);

    return {
      ...item,
      lineTotal: quantity * price,
      lineTotalLabel: money.format(quantity * price)
    };
  });

  const cartCount = items.reduce(
    (total, item) => total + Number(item.quantity),
    0
  );

  const subtotal = items.reduce(
    (total, item) => total + item.lineTotal,
    0
  );

  res.render("cart", {
    cartItems: items,
    cartCount,
    subtotalLabel: money.format(subtotal)
  });
};


exports.profile = (req, res, next) => {
  const templates = {
    overview: "profile",
    privacy: "profile/privacy",
    security: "profile/security",
    settings: "profile/settings",
    "saved-cards": "profile/saved-cards"
  };

  const activeProfileSection = req.params.section || "overview";

  if (!Object.hasOwn(templates, activeProfileSection)) {
    return next();
  }

  // Later, authenticated server middleware supplies this user's records.
  const data = res.locals.profileData || {};
  const user = data.user || {};

  const records = value =>
    Array.isArray(value)
      ? value.filter(record => record && typeof record === "object")
      : [];

  const text = (value, fallback = "") =>
    typeof value === "string" && value.trim()
      ? value.trim()
      : fallback;

  const amount = value =>
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0
      ? value
      : null;

  const quantity = value =>
    Number.isSafeInteger(value) && value > 0
      ? value
      : null;

  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  });

  const money = value =>
    amount(value) === null
      ? "Unavailable"
      : currency.format(value);

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  });

  const date = value => {
    if (
      !(value instanceof Date) &&
      (typeof value !== "string" || !value.trim())
    ) {
      return null;
    }

    const parsed = new Date(value);

    return Number.isNaN(parsed.getTime())
      ? null
      : {
          iso: parsed.toISOString(),
          label: dateFormatter.format(parsed)
        };
  };

  // User identity and default avatar.
  const username = text(user.username);
  const avatarUrl = text(user.avatarUrl);

  const profileUser = {
    username,
    avatarUrl: avatarUrl || "/images/profile-placeholder.png",
    avatarAlt: avatarUrl
      ? `${username || "User"}'s profile picture.`
      : "Default avatar: a colonial figure hiding behind a paper bag.",
    joinedAt: date(user.joinedAt)
  };

  // Supply completed purchases, ordered newest first.
  const recentOrders = records(data.orders)
    .map(order => ({
      number: Number.isSafeInteger(order.number)
        ? String(order.number)
        : text(order.number, "Purchase"),

      placedAt: date(order.placedAt),

      items: records(order.items).map(item => ({
        name: text(item.name, "Item"),
        quantity: quantity(item.quantity)
      })),

      status: text(order.status) || null,
      totalLabel: money(order.total)
    }))
    .sort((a, b) => {
      const first = a.placedAt
        ? Date.parse(a.placedAt.iso)
        : -Infinity;

      const second = b.placedAt
        ? Date.parse(b.placedAt.iso)
        : -Infinity;

      return second - first;
    })
    .slice(0, 3);

  // Current cart lines and totals.
  const cart = records(data.cartItems).map(item => {
    const price = amount(item.price);
    const count = quantity(item.quantity);

    return {
      id:
        typeof item.id === "string" ||
        Number.isSafeInteger(item.id)
          ? item.id
          : null,

      name: text(item.name, "Item"),
      quantity: count,
      price,

      lineTotal:
        price !== null && count !== null
          ? Math.round(price * 100) * count / 100
          : null
    };
  });

  const cartSubtotal = cart.some(item => item.lineTotal === null)
    ? null
    : cart.reduce((sum, item) => sum + item.lineTotal, 0);

  const cartItems = cart.map(({ price, lineTotal, ...item }) => ({
    ...item,
    unitPriceLabel: money(price),
    lineTotalLabel: money(lineTotal)
  }));

  const cartCount = cart.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );

  // Display metadata only: brand, last four digits, and expiration.
  const savedCards = records(data.savedCards)
    .filter(card =>
      typeof card.last4 === "string" &&
      /^\d{4}$/.test(card.last4)
    )
    .map(card => {
      const validExpiry =
        Number.isInteger(card.expiryMonth) &&
        card.expiryMonth >= 1 &&
        card.expiryMonth <= 12 &&
        Number.isInteger(card.expiryYear) &&
        card.expiryYear >= 1000 &&
        card.expiryYear <= 9999;

      return {
        brand: text(card.brand, "Card"),
        last4: card.last4,

        expiryLabel: validExpiry
          ? `${String(card.expiryMonth).padStart(2, "0")}/${card.expiryYear}`
          : "Unavailable"
      };
    });

  res.render(templates[activeProfileSection], {
    activeProfileSection,
    profileUser,
    recentOrders,
    cartItems,
    cartSubtotalLabel: money(cartSubtotal),
    cartCount,
    savedCards
  });
};

exports.checkout = (req, res) => {
  res.render("checkout");
};

exports.shop = (req, res) => {
  // Temporary records for previewing the catalog layout.
  const items = Array.from({ length: 20 }, (_, index) => ({
    id: index + 1,
    name: `Item ${index + 1}`,
    category: "Category",
    description: "An item description will appear here.",
    price: null,
    imageUrl: null,
    badge: null
  }));

  // Supply the available filter values from your database later.
  const timePeriods = [];
  const categories = [];

  res.render("item-catelog", { items, timePeriods, categories });
};