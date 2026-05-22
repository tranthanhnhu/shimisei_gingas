/**
 * Shopify — "Shop now" pill popup (Japanese UI) → checkout
 * Custom picker UI; sends variant + quantity via Storefront API (not Buy Button dropdowns).
 */
(function () {
  var SCRIPT_URL =
    "https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js";

  var SHOPIFY_DOMAIN = "qnkbbb-ns.myshopify.com";
  var STOREFRONT_ACCESS_TOKEN = "ce079be6850e4ce232f2ed2b6d7b4a9f";
  var GRAPHQL_URL =
    "https://" + SHOPIFY_DOMAIN + "/api/2024-01/graphql.json";

  var PRODUCTS = {
    p60: "7698298863693",
    p180: "7698344149069",
    pZip: "7698773966925",
  };

  /** Hidden options — use default value when matching variant */
  var HIDDEN_OPTIONS = ["Supplement health focus", "Title"];
  var HIDDEN_OPTION_DEFAULTS = {
    "Supplement health focus": "Bone and joint support",
    "Title": "Default Title",
  };

  var OPTION_NAME_JA = {
    "Age group": "年齢層",
    "Food supplement form": "内容量",
  };

  var OPTION_VALUE_JA = {
    Adults: "成人",
    Teens: "10代",
    "60 capsules for 2 weeks": "60粒（2週間分）",
    "180 capsules for 6 weeks": "180粒（6週間分）",
  };

  var client = null;
  var productsCache = {};
  var pickerModal = null;
  var checkoutModal = null;
  var pickerSelected = null;
  var checkoutState = {
    productKey: null,
    selections: {},
    quantity: 1,
  };

  function gid(productId) {
    return "gid://shopify/Product/" + productId;
  }

  function graphql(query, variables) {
    return fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query: query, variables: variables || {} }),
    }).then(function (res) {
      return res.json();
    });
  }

  function fetchProduct(key) {
    var id = PRODUCTS[key];
    var query =
      "query Product($id: ID!) { product(id: $id) { id title options { name values } variants(first: 50) { edges { node { id availableForSale selectedOptions { name value } } } } } }";

    return graphql(query, { id: gid(id) }).then(function (json) {
      if (json.errors) throw new Error(json.errors[0].message);
      var p = json.data.product;
      var variants = p.variants.edges.map(function (e) {
        return e.node;
      });
      productsCache[key] = {
        key: key,
        id: id,
        title: p.title,
        options: p.options,
        variants: variants,
      };
      return productsCache[key];
    });
  }

  function loadAllProducts() {
    return Promise.all(
      Object.keys(PRODUCTS).map(function (key) {
        return fetchProduct(key);
      })
    );
  }

  function labelOptionName(name) {
    return OPTION_NAME_JA[name] || name;
  }

  function labelOptionValue(value) {
    return OPTION_VALUE_JA[value] || value;
  }

  function visibleOptions(product) {
    return product.options.filter(function (opt) {
      return HIDDEN_OPTIONS.indexOf(opt.name) === -1;
    });
  }

  function isQuantityOnly(product) {
    return visibleOptions(product).length === 0;
  }

  function buildDefaultSelections(product) {
    var sel = {};
    product.options.forEach(function (opt) {
      if (HIDDEN_OPTIONS.indexOf(opt.name) !== -1) {
        sel[opt.name] =
          HIDDEN_OPTION_DEFAULTS[opt.name] || opt.values[0];
      } else if (opt.values.length === 1) {
        sel[opt.name] = opt.values[0];
      } else {
        sel[opt.name] = opt.values[0];
      }
    });
    return sel;
  }

  function findVariant(product, selections) {
    return product.variants.find(function (variant) {
      if (!variant.availableForSale) return false;
      return variant.selectedOptions.every(function (opt) {
        return selections[opt.name] === opt.value;
      });
    });
  }

  function ensureProduct(productKey) {
    if (productsCache[productKey]) {
      return Promise.resolve(productsCache[productKey]);
    }
    return fetchProduct(productKey);
  }

  function showCheckoutLoading() {
    var body = checkoutModal.querySelector(".shop-checkout-modal__body");
    var buyBtn = checkoutModal.querySelector(".shop-checkout-modal__buy");
    if (body) {
      body.innerHTML =
        '<p class="shop-checkout-loading">読み込み中…</p>';
    }
    if (buyBtn) buyBtn.disabled = true;
  }

  function openCheckoutModal(productKey) {
    if (!checkoutModal || !productKey) return;

    checkoutModal.hidden = false;
    checkoutModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("shop-modal-open");
    showCheckoutLoading();

    ensureProduct(productKey)
      .then(function (product) {
        if (!product) {
          closeCheckoutModal();
          alert("商品情報の読み込みに失敗しました。");
          return;
        }
        checkoutState.productKey = productKey;
        checkoutState.selections = buildDefaultSelections(product);
        checkoutState.quantity = 1;
        renderCheckoutBody(product);
      })
      .catch(function (err) {
        console.error(err);
        closeCheckoutModal();
        alert("商品情報の読み込みに失敗しました。");
      });
  }

  function closeCheckoutModal() {
    if (!checkoutModal) return;
    checkoutModal.hidden = true;
    checkoutModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("shop-modal-open");
    checkoutState.productKey = null;
  }

  function updateBuyButtonState(product) {
    var buyBtn = checkoutModal.querySelector(".shop-checkout-modal__buy");
    if (!buyBtn) return;

    var variant = findVariant(product, checkoutState.selections);
    var ready =
      !!variant &&
      checkoutState.quantity >= 1 &&
      visibleOptions(product).every(function (opt) {
        return !!checkoutState.selections[opt.name];
      });

    buyBtn.disabled = !ready;
  }

  function renderCheckoutBody(product) {
    var body = checkoutModal.querySelector(".shop-checkout-modal__body");
    if (!body) return;

    body.innerHTML = "";
    var opts = visibleOptions(product);

    opts.forEach(function (opt) {
      var group = document.createElement("div");
      group.className = "shop-checkout-option";
      group.setAttribute("data-option-name", opt.name);

      var label = document.createElement("p");
      label.className = "shop-checkout-option__label";
      label.textContent = labelOptionName(opt.name) + "：";
      group.appendChild(label);

      var pills = document.createElement("div");
      pills.className = "shop-checkout-option__pills";
      if (opt.values.length > 1) {
        pills.classList.add("shop-checkout-option__pills--row");
      }
      pills.setAttribute("role", "group");

      opt.values.forEach(function (value) {
        var pill = document.createElement("button");
        pill.type = "button";
        pill.className = "shop-checkout-pill";
        if (opt.values.length === 1) {
          pill.classList.add("shop-checkout-pill--wide");
        }
        pill.setAttribute("data-option-name", opt.name);
        pill.setAttribute("data-option-value", value);
        pill.textContent = labelOptionValue(value);
        pill.setAttribute("aria-pressed", "false");

        if (checkoutState.selections[opt.name] === value) {
          pill.classList.add("is-selected");
          pill.setAttribute("aria-pressed", "true");
        }

        pill.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          checkoutState.selections[opt.name] = value;
          pills.querySelectorAll(".shop-checkout-pill").forEach(function (p) {
            var on = p.getAttribute("data-option-value") === value;
            p.classList.toggle("is-selected", on);
            p.setAttribute("aria-pressed", on ? "true" : "false");
          });
          updateBuyButtonState(product);
        });

        pills.appendChild(pill);
      });

      group.appendChild(pills);
      body.appendChild(group);
    });

    var qtyGroup = document.createElement("div");
    qtyGroup.className = "shop-checkout-option shop-checkout-option--qty";

    var qtyLabel = document.createElement("p");
    qtyLabel.className = "shop-checkout-option__label";
    qtyLabel.textContent = "数量：";
    qtyGroup.appendChild(qtyLabel);

    var qtyBar = document.createElement("div");
    qtyBar.className = "shop-checkout-qty";

    var minus = document.createElement("button");
    minus.type = "button";
    minus.className = "shop-checkout-qty__btn";
    minus.textContent = "−";
    minus.setAttribute("aria-label", "数量を減らす");

    var qtyVal = document.createElement("span");
    qtyVal.className = "shop-checkout-qty__value";
    qtyVal.textContent = String(checkoutState.quantity);

    var plus = document.createElement("button");
    plus.type = "button";
    plus.className = "shop-checkout-qty__btn";
    plus.textContent = "+";
    plus.setAttribute("aria-label", "数量を増やす");

    function setQty(n) {
      checkoutState.quantity = Math.max(1, Math.min(99, n));
      qtyVal.textContent = String(checkoutState.quantity);
      updateBuyButtonState(product);
    }

    minus.addEventListener("click", function () {
      setQty(checkoutState.quantity - 1);
    });
    plus.addEventListener("click", function () {
      setQty(checkoutState.quantity + 1);
    });

    qtyBar.appendChild(minus);
    qtyBar.appendChild(qtyVal);
    qtyBar.appendChild(plus);
    qtyGroup.appendChild(qtyBar);
    body.appendChild(qtyGroup);

    updateBuyButtonState(product);
  }

  function checkoutViaCart(variantId, quantity) {
    var mutation =
      "mutation cartCreate($lines: [CartLineInput!]!) { cartCreate(input: { lines: $lines }) { cart { checkoutUrl } userErrors { message field } } }";
    return graphql(mutation, {
      lines: [{ merchandiseId: variantId, quantity: quantity }],
    }).then(function (json) {
      if (json.errors) throw new Error(json.errors[0].message);
      var payload = json.data.cartCreate;
      if (payload.userErrors && payload.userErrors.length) {
        throw new Error(payload.userErrors[0].message);
      }
      var url = payload.cart && payload.cart.checkoutUrl;
      if (!url) throw new Error("Checkout URL not found");
      window.location.href = url;
    });
  }

  function checkoutViaBuySdk(variantId, quantity) {
    return client.checkout
      .create({
        lineItems: [{ variantId: variantId, quantity: quantity }],
      })
      .then(function (checkout) {
        var url =
          checkout.webUrl ||
          checkout.checkoutUrl ||
          (checkout.id
            ? "https://" + SHOPIFY_DOMAIN + "/cart/c/" + checkout.id
            : null);
        if (!url) throw new Error("Checkout URL not found");
        window.location.href = url;
      });
  }

  function goToCheckout() {
    var product = productsCache[checkoutState.productKey];
    if (!product || !client) return;

    var variant = findVariant(product, checkoutState.selections);
    if (!variant) return;

    var buyBtn = checkoutModal.querySelector(".shop-checkout-modal__buy");
    if (buyBtn) {
      buyBtn.disabled = true;
      buyBtn.textContent = "処理中…";
    }

    checkoutViaBuySdk(variant.id, checkoutState.quantity)
      .catch(function () {
        return checkoutViaCart(variant.id, checkoutState.quantity);
      })
      .catch(function (err) {
        console.error("Shopify checkout error:", err);
        alert(
          "申し訳ございません。購入処理に失敗しました。しばらくしてから再度お試しください。"
        );
        if (buyBtn) {
          buyBtn.disabled = false;
          buyBtn.textContent = "購入する";
        }
      });
  }

  function openPickerModal() {
    if (!pickerModal) return;
    pickerSelected = null;
    pickerModal.querySelectorAll(".shop-picker-modal__pill").forEach(function (pill) {
      pill.classList.remove("is-selected");
      pill.setAttribute("aria-pressed", "false");
    });
    var nextBtn = pickerModal.querySelector(".shop-picker-modal__next");
    if (nextBtn) nextBtn.disabled = true;
    pickerModal.hidden = false;
    pickerModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("shop-modal-open");
  }

  function closePickerModal() {
    if (!pickerModal) return;
    pickerModal.hidden = true;
    pickerModal.setAttribute("aria-hidden", "true");
    if (!checkoutModal || checkoutModal.hidden) {
      document.body.classList.remove("shop-modal-open");
    }
    pickerSelected = null;
  }

  function initPickerModal() {
    pickerModal = document.getElementById("shop-picker-modal");
    if (!pickerModal) return;

    var pills = pickerModal.querySelectorAll(".shop-picker-modal__pill");
    var nextBtn = pickerModal.querySelector(".shop-picker-modal__next");
    var closeBtns = pickerModal.querySelectorAll(
      "[data-shop-picker-close], .shop-picker-modal__overlay"
    );

    pills.forEach(function (pill) {
      pill.addEventListener("click", function () {
        pickerSelected = pill.getAttribute("data-product");
        pills.forEach(function (p) {
          var sel = p === pill;
          p.classList.toggle("is-selected", sel);
          p.setAttribute("aria-pressed", sel ? "true" : "false");
        });
        if (nextBtn) nextBtn.disabled = !pickerSelected;
      });
    });

    if (nextBtn) {
      nextBtn.addEventListener("click", function (e) {
        e.preventDefault();
        if (!pickerSelected) return;
        var key = pickerSelected;
        closePickerModal();
        window.requestAnimationFrame(function () {
          openCheckoutModal(key);
        });
      });
    }

    closeBtns.forEach(function (btn) {
      btn.addEventListener("click", closePickerModal);
    });
  }

  function initCheckoutModal() {
    checkoutModal = document.getElementById("shop-checkout-modal");
    if (!checkoutModal) return;

    var buyBtn = checkoutModal.querySelector(".shop-checkout-modal__buy");
    var closeBtns = checkoutModal.querySelectorAll(
      "[data-shop-checkout-close], .shop-checkout-modal__overlay"
    );

    if (buyBtn) {
      buyBtn.addEventListener("click", goToCheckout);
    }

    closeBtns.forEach(function (btn) {
      btn.addEventListener("click", closeCheckoutModal);
    });
  }

  function initTriggers() {
    document.querySelectorAll("[data-shop-trigger='shared']").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        openPickerModal();
      });
    });

    document.querySelectorAll("[data-shop-product]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var key = btn.getAttribute("data-shop-product");
        if (key) openCheckoutModal(key);
      });
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (checkoutModal && !checkoutModal.hidden) closeCheckoutModal();
    else if (pickerModal && !pickerModal.hidden) closePickerModal();
  });

  var modalsInitialized = false;

  function initShopModals() {
    if (modalsInitialized) return;
    modalsInitialized = true;
    initPickerModal();
    initCheckoutModal();
    initTriggers();
  }

  function initShopifyClient() {
    if (client) return;
    client = ShopifyBuy.buildClient({
      domain: SHOPIFY_DOMAIN,
      storefrontAccessToken: STOREFRONT_ACCESS_TOKEN,
    });
    loadAllProducts().catch(function (err) {
      console.error("Failed to preload Shopify products:", err);
    });
  }

  function loadScript() {
    var script = document.createElement("script");
    script.async = true;
    script.src = SCRIPT_URL;
    script.onload = initShopifyClient;
    (document.getElementsByTagName("head")[0] ||
      document.getElementsByTagName("body")[0]).appendChild(script);
  }

  function bootstrap() {
    function start() {
      initShopModals();
      if (window.ShopifyBuy) {
        initShopifyClient();
      } else {
        loadScript();
      }
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start);
    } else {
      start();
    }
  }

  bootstrap();
})();
