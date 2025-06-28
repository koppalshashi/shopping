document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");
  const placeOrderBtn = document.getElementById("placeOrder");
  const vegetableList = document.getElementById("vegetableList");
  const selectedItemsList = document.getElementById("selectedItems");
  const addressInput = document.getElementById("address");
  const backBtn = document.getElementById("backBtn");

  const searchInput = document.getElementById("searchInput");
  const categorySelect = document.getElementById("categorySelect");

  const vegetables = [
    { name: "Tomato", price: 20, image: "https://img.etimg.com/thumb/msid-95423731,width-650,height-488,imgsize-56196,resizemode-75/tomatoes-canva.jpg", quantity: 0, category: "vegetables" },
    { name: "Apple", price: 15, image: "https://5.imimg.com/data5/AK/RA/MY-68428614/apple-1000x1000.jpg", quantity: 0, category: "vegetables" },
    { name: "Onion", price: 18, image: "https://produits.bienmanger.com/36700-0w470h470_Organic_Red_Onion_From_Italy.jpg", quantity: 0, category: "vegetables" },
    { name: "Mango", price: 25, image: "https://www.nutralion.com/wp-content/uploads/2024/05/Mango.jpg", quantity: 0, category: "fruits" },
    { name: "Paneer", price: 10, image: "https://instamart-media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,h_600/NI_CATALOG/IMAGES/CIW/2024/8/13/1cc9a724-0d4e-4b57-b054-6f12e351f892_804448_1.png", quantity: 0, category: "dairy" }
  ];

  const selectedItems = [];

  // Registration
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      try {
        const res = await fetch("/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        });

        const data = await res.json();
        if (res.ok) {
          alert("Registration successful!");
          window.location.href = "login.html";
        } else {
          alert(data.message || "Registration failed.");
        }
      } catch (err) {
        alert("Error: " + err.message);
      }
    });
  }

  // Login
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("loginUsername").value;
      const password = document.getElementById("loginPassword").value;

      try {
        const res = await fetch("/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        const data = await res.json();
        if (res.ok) {
          localStorage.setItem("username", username);
          window.location.href = "map.html";
        } else {
          alert(data.message || "Login failed.");
        }
      } catch (err) {
        alert("Error: " + err.message);
      }
    });
  }

  // Render Vegetable Items
  function renderVegetables(filter = "", category = "all") {
    if (!vegetableList) return;
    vegetableList.innerHTML = "";

    vegetables
      .filter((veg) =>
        veg.name.toLowerCase().includes(filter.toLowerCase()) &&
        (category === "all" || veg.category === category)
      )
      .forEach((veg) => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "vegetable-item";
        itemDiv.innerHTML = `
          <img src="${veg.image}" class="veg-image" alt="${veg.name}" style="width:100px; height:100px; object-fit:cover; border-radius:8px;" />
          <div class="veg-details">
            <span><strong>${veg.name}</strong> - ₹${veg.price}/kg</span>
            <input type="number" placeholder="Qty" min="1" value="1" class="qty-input"/>
            <button class="addBtn">Add</button>
          </div>
        `;

        const addBtn = itemDiv.querySelector(".addBtn");
        const qtyInput = itemDiv.querySelector(".qty-input");

        addBtn.addEventListener("click", () => {
          const quantity = parseInt(qtyInput.value);
          if (quantity > 0) {
            selectedItems.push({ name: veg.name, quantity, price: veg.price });
            renderSelectedItems();
          }
        });

        vegetableList.appendChild(itemDiv);
      });
  }

  renderVegetables(); // initial render

  // Search filter
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const keyword = searchInput.value.toLowerCase();
      const category = categorySelect ? categorySelect.value : "all";
      renderVegetables(keyword, category);
    });
  }

  // Category filter
  if (categorySelect) {
    categorySelect.addEventListener("change", () => {
      const keyword = searchInput ? searchInput.value.toLowerCase() : "";
      const category = categorySelect.value;
      renderVegetables(keyword, category);
    });
  }

  // Render selected items
  function renderSelectedItems() {
    selectedItemsList.innerHTML = "";
    selectedItems.forEach((item, index) => {
      const li = document.createElement("li");
      li.innerHTML = `
        ${item.name} - ${item.quantity}kg - ₹${item.quantity * item.price}
        <button data-index="${index}" class="deleteBtn">🗑️</button>
      `;
      selectedItemsList.appendChild(li);
    });

    // Handle delete
    document.querySelectorAll(".deleteBtn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = btn.getAttribute("data-index");
        selectedItems.splice(i, 1);
        renderSelectedItems();
      });
    });
  }

  // Place order
  if (placeOrderBtn) {
    placeOrderBtn.addEventListener("click", async () => {
      const username = localStorage.getItem("username");
      const address = addressInput.value;

      if (!username || selectedItems.length === 0 || !address) {
        alert("Please fill all fields and select items.");
        return;
      }

      const totalAmount = selectedItems.reduce((acc, item) => acc + item.quantity * item.price, 0);

      try {
        const res = await fetch("/place-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, address, items: selectedItems, totalAmount }),
        });

        const data = await res.json();
        if (res.ok) {
          alert("Order placed successfully!");
          selectedItems.length = 0;
          renderSelectedItems();
          addressInput.value = "";
          window.location.href = "thanks.html";
        } else {
          alert(data.message || "Order failed.");
        }
      } catch (err) {
        alert("Error placing order: " + err.message);
      }
    });
  }

  // Back button
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "map.html";
    });
  }
});
