// Enhanced JavaScript with animations and interactivity
document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const elements = {
    textTab: document.getElementById("textTab"),
    imageTab: document.getElementById("imageTab"),
    textContent: document.getElementById("textContent"),
    imageContent: document.getElementById("imageContent"),
    uploadBtn: document.getElementById("uploadBtn"),
    foodImage: document.getElementById("foodImage"),
    analyzeTextBtn: document.getElementById("analyzeTextBtn"),
    analyzeImageBtn: document.getElementById("analyzeImageBtn"),
    preview: document.getElementById("preview"),
    imagePreview: document.getElementById("imagePreview"),
    loadingSpinner: document.getElementById("loadingSpinner"),
    resultsSection: document.getElementById("resultsSection"),
    dropZone: document.getElementById("dropZone"),
    retakeBtn: document.getElementById("retakeBtn"),
    saveMealBtn: document.getElementById("saveMealBtn"),
    historyBtn: document.getElementById("historyBtn"),
    historyModal: document.getElementById("historyModal"),
    closeHistory: document.getElementById("closeHistory"),
    mealHistoryList: document.getElementById("mealHistoryList"),
  };

  // State management
  let currentAnalysis = null;
  let mealHistory = [];

  // Initialize
  init();

  function init() {
    setupEventListeners();
    loadMealHistory();
    updateDashboardStats();
  }

  function setupEventListeners() {
    // Tab switching
    elements.textTab.addEventListener("click", () => switchTab("text"));
    elements.imageTab.addEventListener("click", () => switchTab("image"));

    // Image handling
    elements.uploadBtn.addEventListener("click", () =>
      elements.foodImage.click()
    );
    elements.foodImage.addEventListener("change", handleImageUpload);
    elements.retakeBtn.addEventListener("click", retakeImage);

    // Drag and drop
    setupDragAndDrop();

    // Analysis buttons
    elements.analyzeTextBtn.addEventListener("click", analyzeText);
    elements.analyzeImageBtn.addEventListener("click", analyzeImage);

    // Save meal
    elements.saveMealBtn.addEventListener("click", saveMeal);

    // History
    elements.historyBtn.addEventListener("click", showHistory);
    elements.closeHistory.addEventListener("click", hideHistory);

    // Keyboard shortcuts
    document.addEventListener("keydown", handleKeyboardShortcuts);
  }

  function switchTab(tab) {
    // Animate tab switching
    if (tab === "text") {
      animateTabSwitch(
        elements.textTab,
        elements.textContent,
        elements.imageTab,
        elements.imageContent,
        "green"
      );
    } else {
      animateTabSwitch(
        elements.imageTab,
        elements.imageContent,
        elements.textTab,
        elements.textContent,
        "blue"
      );
    }
  }

  function animateTabSwitch(
    activeTab,
    activeContent,
    inactiveTab,
    inactiveContent,
    color
  ) {
    // Reset tabs
    [elements.textTab, elements.imageTab].forEach((tab) => {
      tab.classList.remove(
        "text-green-600",
        "text-blue-600",
        "border-green-600",
        "border-blue-600",
        "bg-white"
      );
      tab.classList.add("text-gray-500");
    });

    // Activate current tab
    activeTab.classList.remove("text-gray-500");
    activeTab.classList.add(
      `text-${color}-600`,
      `border-${color}-600`,
      "bg-white"
    );

    // Animate content
    inactiveContent.style.transform = "translateX(-100%)";
    inactiveContent.style.opacity = "0";

    setTimeout(() => {
      inactiveContent.classList.add("hidden");
      activeContent.classList.remove("hidden");
      activeContent.style.transform = "translateX(0)";
      activeContent.style.opacity = "1";

      setTimeout(() => {
        activeContent.style.transform = "";
        activeContent.style.opacity = "";
      }, 300);
    }, 300);
  }

  function setupDragAndDrop() {
    // Drag over
    elements.dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      elements.dropZone.classList.add("border-green-400", "bg-green-50");
      elements.dropZone.querySelector("i").classList.add("text-green-400");
    });

    // Drag leave
    elements.dropZone.addEventListener("dragleave", (e) => {
      e.preventDefault();
      elements.dropZone.classList.remove("border-green-400", "bg-green-50");
      elements.dropZone.querySelector("i").classList.remove("text-green-400");
    });

    // Drop
    elements.dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      elements.dropZone.classList.remove("border-green-400", "bg-green-50");
      elements.dropZone.querySelector("i").classList.remove("text-green-400");

      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.startsWith("image/")) {
        elements.foodImage.files = files;
        handleImageUpload({ target: elements.foodImage });
      }
    });
  }

  function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        elements.preview.src = e.target.result;
        elements.imagePreview.classList.remove("hidden");
        elements.analyzeImageBtn.disabled = false;

        // Add loading animation to preview
        elements.preview.classList.add("transform", "scale-95");
        setTimeout(() => {
          elements.preview.classList.remove("scale-95");
        }, 300);
      };
      reader.readAsDataURL(file);
    }
  }

  function retakeImage() {
    elements.foodImage.value = "";
    elements.imagePreview.classList.add("hidden");
    elements.analyzeImageBtn.disabled = true;
  }

  async function analyzeText() {
    const foodText = document.getElementById("foodText").value.trim();
    if (!foodText) {
      showNotification("Please enter food items to analyze", "error");
      return;
    }

    await performAnalysis("/analyze-text", { food_text: foodText });
  }

  async function analyzeImage() {
    const file = elements.foodImage.files[0];
    if (!file) {
      showNotification("Please select an image first", "error");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    await performAnalysis("/analyze-image", formData);
  }

  async function performAnalysis(url, data) {
    showLoading();

    try {
      const options =
        data instanceof FormData
          ? { method: "POST", body: data }
          : {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            };

      const response = await fetch(url, options);
      const result = await response.json();

      hideLoading();

      if (result.success) {
        currentAnalysis = result;
        displayResults(result);
        showNotification("Analysis completed successfully!", "success");
      } else {
        showNotification("Error analyzing: " + result.error, "error");
      }
    } catch (error) {
      hideLoading();
      showNotification("Network error: " + error.message, "error");
    }
  }

  function displayResults(data) {
    // Store current analysis
    currentAnalysis = data;

    // Update health score card
    updateHealthScoreCard(data);

    // Show detected foods for image analysis
    if (data.detected_items) {
      showDetectedFoods(data.detected_items);
    }

    // Update results table
    updateResultsTable(data);

    // Create charts
    createCharts(data);

    // Show health tips
    showHealthTips(data.health_tips);

    // Animate results section into view
    animateResultsSection();
  }

  function updateHealthScoreCard(data) {
    const healthScoreCard = document.getElementById("healthScoreCard");
    const score = data.health_score;

    let scoreColor = "red";
    if (score >= 80) scoreColor = "green";
    else if (score >= 60) scoreColor = "yellow";

    healthScoreCard.innerHTML = `
            <div class="bg-white rounded-2xl shadow-lg p-6 text-center transform hover:scale-105 transition duration-300">
                <div class="text-4xl font-bold text-${scoreColor}-600 mb-2">${score}</div>
                <div class="text-lg font-semibold text-gray-700">Health Score</div>
                <div class="w-full bg-gray-200 rounded-full h-3 mt-4">
                    <div class="bg-${scoreColor}-500 h-3 rounded-full transition-all duration-1000" style="width: ${score}%"></div>
                </div>
            </div>
            <div class="bg-white rounded-2xl shadow-lg p-6">
                <div class="flex items-center justify-between mb-4">
                    <span class="text-gray-600">Total Calories</span>
                    <span class="text-2xl font-bold text-orange-600">${
                      data.total.calories
                    }</span>
                </div>
                <div class="flex items-center justify-between mb-4">
                    <span class="text-gray-600">Protein</span>
                    <span class="text-xl font-bold text-blue-600">${
                      data.total.protein
                    }g</span>
                </div>
                <div class="flex items-center justify-between">
                    <span class="text-gray-600">Carbs/Fat</span>
                    <span class="text-lg font-bold text-purple-600">${
                      data.total.carbs
                    }g / ${data.total.fat}g</span>
                </div>
            </div>
            <div class="bg-white rounded-2xl shadow-lg p-6">
                <h5 class="font-semibold text-gray-700 mb-3">Meal Summary</h5>
                <div class="text-sm text-gray-600 space-y-2">
                    <div>Food Items: ${data.results.length}</div>
                    <div>Total Sugar: ${data.total.sugar}g</div>
                    <div>Dietary Fiber: ${data.total.fiber}g</div>
                    <div class="text-xs text-gray-500">Analyzed: ${new Date().toLocaleTimeString()}</div>
                </div>
            </div>
        `;
  }

  function showDetectedFoods(detectedItems) {
    const detectedFoods = document.getElementById("detectedFoods");
    const foodItems = document.getElementById("foodItems");

    detectedFoods.classList.remove("hidden");
    foodItems.innerHTML = "";

    detectedItems.forEach((item) => {
      const foodCard = document.createElement("div");
      foodCard.className =
        "bg-white rounded-xl shadow-lg p-4 text-center transform hover:scale-105 transition duration-300";
      foodCard.innerHTML = `
                <div class="text-2xl mb-2">${getFoodEmoji(item.name)}</div>
                <div class="font-semibold text-gray-800 capitalize">${
                  item.name
                }</div>
                <div class="text-sm text-gray-600 capitalize">${
                  item.portion
                } portion</div>
                <div class="text-xs text-blue-600 mt-2">${(
                  item.confidence * 100
                ).toFixed(0)}% confidence</div>
            `;
      foodItems.appendChild(foodCard);
    });
  }

  function updateResultsTable(data) {
    const resultsTable = document.getElementById("resultsTable");
    const totalRow = document.getElementById("totalRow");

    resultsTable.innerHTML = "";
    totalRow.innerHTML = "";

    // Add individual food rows with animations
    data.results.forEach((item, index) => {
      setTimeout(() => {
        const row = document.createElement("tr");
        row.className =
          "bg-white/70 hover:bg-blue-50 transform transition duration-300 hover:scale-105";
        row.style.animation = `fadeInUp 0.5s ease-out ${index * 0.1}s both`;
        row.innerHTML = `
                    <td class="px-6 py-4 font-medium text-gray-900 capitalize">${
                      item.food
                    }</td>
                    <td class="px-6 py-4 capitalize">
                        <span class="bg-${getPortionColor(
                          item.portion
                        )}-100 text-${getPortionColor(
          item.portion
        )}-800 px-2 py-1 rounded-full text-xs">
                            ${item.portion}
                        </span>
                    </td>
                    <td class="px-6 py-4 font-semibold">${
                      item.nutrition.calories
                    }</td>
                    <td class="px-6 py-4">${item.nutrition.protein}</td>
                    <td class="px-6 py-4">${item.nutrition.carbs}</td>
                    <td class="px-6 py-4">${item.nutrition.fat}</td>
                    <td class="px-6 py-4 ${
                      item.nutrition.sugar > 10
                        ? "text-red-600 font-semibold"
                        : ""
                    }">${item.nutrition.sugar}</td>
                    <td class="px-6 py-4 ${
                      item.nutrition.fiber > 5
                        ? "text-green-600 font-semibold"
                        : ""
                    }">${item.nutrition.fiber}</td>
                `;
        resultsTable.appendChild(row);
      }, index * 100);
    });

    // Add total row
    setTimeout(() => {
      totalRow.classList.remove("hidden");
      totalRow.innerHTML = `
                <tr>
                    <td class="px-6 py-4 font-bold rounded-bl-2xl">TOTAL</td>
                    <td class="px-6 py-4">-</td>
                    <td class="px-6 py-4 font-bold text-orange-600">${
                      data.total.calories
                    }</td>
                    <td class="px-6 py-4 font-bold text-blue-600">${
                      data.total.protein
                    }</td>
                    <td class="px-6 py-4 font-bold text-purple-600">${
                      data.total.carbs
                    }</td>
                    <td class="px-6 py-4 font-bold text-yellow-600">${
                      data.total.fat
                    }</td>
                    <td class="px-6 py-4 font-bold ${
                      data.total.sugar > 25 ? "text-red-600" : "text-gray-700"
                    }">${data.total.sugar}</td>
                    <td class="px-6 py-4 font-bold ${
                      data.total.fiber > 10 ? "text-green-600" : "text-gray-700"
                    } rounded-br-2xl">${data.total.fiber}</td>
                </tr>
            `;
    }, data.results.length * 100);
  }

  function createCharts(data) {
    // Macronutrient Chart
    const macroCtx = document
      .getElementById("macronutrientChart")
      .getContext("2d");
    new Chart(macroCtx, {
      type: "doughnut",
      data: {
        labels: ["Protein", "Carbs", "Fat"],
        datasets: [
          {
            data: [data.total.protein, data.total.carbs, data.total.fat],
            backgroundColor: ["#3B82F6", "#10B981", "#F59E0B"],
            borderWidth: 2,
            borderColor: "#ffffff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    });

    // Category Chart
    if (data.category_breakdown) {
      const categoryCtx = document
        .getElementById("categoryChart")
        .getContext("2d");
      new Chart(categoryCtx, {
        type: "bar",
        data: {
          labels: Object.keys(data.category_breakdown).map(
            (cat) => cat.charAt(0).toUpperCase() + cat.slice(1)
          ),
          datasets: [
            {
              label: "Calories by Category",
              data: Object.values(data.category_breakdown),
              backgroundColor: [
                "#EF4444",
                "#10B981",
                "#3B82F6",
                "#F59E0B",
                "#8B5CF6",
              ],
              borderWidth: 0,
              borderRadius: 8,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
          },
        },
      });
    }
  }

  function showHealthTips(tips) {
    const tipsList = document.getElementById("tipsList");
    tipsList.innerHTML = "";

    tips.forEach((tip, index) => {
      setTimeout(() => {
        const tipElement = document.createElement("div");
        tipElement.className =
          "flex items-start space-x-3 p-3 bg-white/50 rounded-lg transform transition duration-300 hover:scale-105";
        tipElement.style.animation = `fadeInRight 0.5s ease-out ${
          index * 0.2
        }s both`;
        tipElement.innerHTML = `
                    <i class="fas fa-lightbulb text-yellow-500 mt-1"></i>
                    <span class="text-gray-700">${tip}</span>
                `;
        tipsList.appendChild(tipElement);
      }, index * 200);
    });
  }

  function animateResultsSection() {
    elements.resultsSection.classList.remove("hidden");
    elements.resultsSection.style.opacity = "0";
    elements.resultsSection.style.transform = "translateY(50px)";

    setTimeout(() => {
      elements.resultsSection.style.transition = "all 0.8s ease-out";
      elements.resultsSection.style.opacity = "1";
      elements.resultsSection.style.transform = "translateY(0)";

      // Scroll to results
      setTimeout(() => {
        elements.resultsSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 500);
    }, 100);
  }

  async function saveMeal() {
    if (!currentAnalysis) {
      showNotification("No analysis to save", "error");
      return;
    }

    const mealName = prompt(
      "Enter a name for this meal:",
      `Meal ${new Date().toLocaleTimeString()}`
    );
    if (!mealName) return;

    try {
      const response = await fetch("/save-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meal_name: mealName,
          nutrition: currentAnalysis.total,
          health_score: currentAnalysis.health_score,
        }),
      });

      const result = await response.json();
      if (result.success) {
        showNotification("Meal saved successfully!", "success");
        loadMealHistory();
        updateDashboardStats();
      }
    } catch (error) {
      showNotification("Error saving meal", "error");
    }
  }

  async function loadMealHistory() {
    try {
      const response = await fetch("/get-meal-history");
      const data = await response.json();
      mealHistory = data.meals || [];
      updateMealHistoryDisplay();
    } catch (error) {
      console.error("Error loading meal history:", error);
    }
  }

  function updateMealHistoryDisplay() {
    const mealHistoryList = document.getElementById("mealHistoryList");
    mealHistoryList.innerHTML = "";

    if (mealHistory.length === 0) {
      mealHistoryList.innerHTML =
        '<p class="text-gray-500 text-center py-8">No meals saved yet</p>';
      return;
    }

    mealHistory.reverse().forEach((meal) => {
      const mealElement = document.createElement("div");
      mealElement.className =
        "bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition duration-300";
      mealElement.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-semibold text-gray-800">${
                          meal.name
                        }</h4>
                        <p class="text-sm text-gray-600">${new Date(
                          meal.timestamp
                        ).toLocaleString()}</p>
                    </div>
                    <div class="text-right">
                        <span class="text-2xl font-bold text-green-600">${
                          meal.health_score
                        }</span>
                        <div class="text-xs text-gray-500">Health Score</div>
                    </div>
                </div>
                <div class="grid grid-cols-4 gap-2 mt-3 text-xs">
                    <div class="text-center">
                        <div class="font-semibold">${
                          meal.nutrition.calories
                        }</div>
                        <div class="text-gray-500">Cal</div>
                    </div>
                    <div class="text-center">
                        <div class="font-semibold">${
                          meal.nutrition.protein
                        }g</div>
                        <div class="text-gray-500">Prot</div>
                    </div>
                    <div class="text-center">
                        <div class="font-semibold">${
                          meal.nutrition.carbs
                        }g</div>
                        <div class="text-gray-500">Carbs</div>
                    </div>
                    <div class="text-center">
                        <div class="font-semibold">${meal.nutrition.fat}g</div>
                        <div class="text-gray-500">Fat</div>
                    </div>
                </div>
            `;
      mealHistoryList.appendChild(mealElement);
    });
  }

  function showHistory() {
    elements.historyModal.classList.remove("hidden");
    elements.historyModal.style.opacity = "0";

    setTimeout(() => {
      elements.historyModal.style.transition = "opacity 0.3s ease";
      elements.historyModal.style.opacity = "1";
    }, 10);
  }

  function hideHistory() {
    elements.historyModal.style.opacity = "0";
    setTimeout(() => {
      elements.historyModal.classList.add("hidden");
    }, 300);
  }

  function updateDashboardStats() {
    // Calculate today's stats from meal history
    const today = new Date().toDateString();
    const todayMeals = mealHistory.filter(
      (meal) => new Date(meal.timestamp).toDateString() === today
    );

    document.getElementById("todayMeals").textContent = todayMeals.length;
    document.getElementById("todayCalories").textContent = todayMeals.reduce(
      (sum, meal) => sum + meal.nutrition.calories,
      0
    );
    document.getElementById("todayProtein").textContent =
      todayMeals.reduce((sum, meal) => sum + meal.nutrition.protein, 0) + "g";

    const avgScore =
      todayMeals.length > 0
        ? Math.round(
            todayMeals.reduce((sum, meal) => sum + meal.health_score, 0) /
              todayMeals.length
          )
        : "-";
    document.getElementById("avgScore").textContent = avgScore;
  }

  // Utility functions
  function getFoodEmoji(food) {
    const emojiMap = {
      apple: "🍎",
      banana: "🍌",
      orange: "🍊",
      bread: "🍞",
      rice: "🍚",
      chicken: "🍗",
      salad: "🥗",
      pasta: "🍝",
      beef: "🥩",
      fish: "🐟",
      eggs: "🥚",
      milk: "🥛",
      cheese: "🧀",
      carrot: "🥕",
      broccoli: "🥦",
      tomato: "🍅",
      potato: "🥔",
      yogurt: "🥛",
      avocado: "🥑",
      spinach: "🍃",
    };
    return emojiMap[food] || "🍽️";
  }

  function getPortionColor(portion) {
    const colorMap = {
      small: "green",
      medium: "yellow",
      large: "red",
    };
    return colorMap[portion] || "gray";
  }

  function showLoading() {
    elements.loadingSpinner.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function hideLoading() {
    elements.loadingSpinner.classList.add("hidden");
    document.body.style.overflow = "";
  }

  function showNotification(message, type) {
    // Remove existing notifications
    const existingNotification = document.querySelector(".notification");
    if (existingNotification) {
      existingNotification.remove();
    }

    const notification = document.createElement("div");
    notification.className = `notification fixed top-4 right-4 px-6 py-3 rounded-xl shadow-lg text-white font-semibold transform transition duration-300 z-50 ${
      type === "success" ? "bg-green-500" : "bg-red-500"
    }`;
    notification.textContent = message;
    notification.style.transform = "translateX(400px)";

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = "translateX(0)";
    }, 10);

    // Animate out and remove
    setTimeout(() => {
      notification.style.transform = "translateX(400px)";
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }

  function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + Enter to analyze
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      if (!elements.textContent.classList.contains("hidden")) {
        analyzeText();
      } else if (!elements.imageContent.classList.contains("hidden")) {
        analyzeImage();
      }
    }

    // Escape to close modals
    if (e.key === "Escape") {
      hideHistory();
    }
  }
});

// Add CSS animations
const style = document.createElement("style");
style.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes fadeInRight {
        from {
            opacity: 0;
            transform: translateX(30px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    .notification {
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .hover-scale:hover {
        transform: scale(1.05);
    }
`;
document.head.appendChild(style);
