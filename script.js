const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const message = document.getElementById("message");
const weatherContainer = document.getElementById("weatherContainer");
const forecastContainer = document.getElementById("forecastContainer");
const themeBtn = document.getElementById("themeBtn");
const unitBtn = document.getElementById("unitBtn");

let weatherData = null;
let isCelsius = true;

// Weather codes and icons
function getWeatherInfo(code) {
    if (code === 0) return ["Clear Sky", "☀️"];
    if (code <= 3) return ["Partly Cloudy", "⛅"];
    if (code <= 48) return ["Foggy", "🌫️"];
    if (code <= 67) return ["Rainy", "🌧️"];
    if (code <= 77) return ["Snowy", "❄️"];
    if (code <= 82) return ["Rain Showers", "🌦️"];
    if (code <= 86) return ["Snow Showers", "🌨️"];
    return ["Thunderstorm", "⛈️"];
}

// Convert temperature
function convertTemperature(temp) {
    if (isCelsius) {
        return `${Math.round(temp)}°C`;
    }
    return `${Math.round((temp * 9 / 5) + 32)}°F`;
}

// Fetch weather data
async function fetchWeatherData(city) {
    const geoURL = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

    const geoResponse = await fetch(geoURL);

    if (!geoResponse.ok) {
        throw new Error("Unable to find city.");
    }

    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
        throw new Error("City not found. Please try another city.");
    }

    const place = geoData.results[0];

    const weatherURL = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=5&timezone=auto`;

    const weatherResponse = await fetch(weatherURL);

    if (!weatherResponse.ok) {
        throw new Error("Unable to fetch weather data.");
    }

    const weather = await weatherResponse.json();

    return {
        name: place.name,
        country: place.country,
        current: weather.current,
        daily: weather.daily
    };
}

// Display current weather
function displayWeather(data) {
    const current = data.current;
    const info = getWeatherInfo(current.weather_code);

    document.getElementById("cityName").textContent =
        `${data.name}, ${data.country}`;

    document.getElementById("weatherDate").textContent =
        new Date(current.time).toLocaleString();

    document.getElementById("weatherIcon").textContent = info[1];

    document.getElementById("temperature").textContent =
        convertTemperature(current.temperature_2m);

    document.getElementById("condition").textContent = info[0];

    document.getElementById("feelsLike").textContent =
        `Feels like: ${convertTemperature(current.apparent_temperature)}`;

    document.getElementById("windSpeed").textContent =
        `${current.wind_speed_10m} km/h`;

    document.getElementById("humidity").textContent =
        `${current.relative_humidity_2m}%`;

    document.getElementById("precipitation").textContent =
        `${current.precipitation} mm`;

    weatherContainer.classList.remove("hidden");
}

// Display 5-day forecast
function displayForecast(daily) {
    forecastContainer.innerHTML = "";

    daily.time.forEach((date, index) => {
        const info = getWeatherInfo(daily.weather_code[index]);

        const card = document.createElement("div");
        card.className = "forecast-card";

        const day = new Date(date + "T00:00:00")
            .toLocaleDateString("en-US", { weekday: "short" });

        card.innerHTML = `
            <h3>${day}</h3>
            <p class="forecast-icon">${info[1]}</p>
            <p>${info[0]}</p>
            <p>Max: ${convertTemperature(daily.temperature_2m_max[index])}</p>
            <p>Min: ${convertTemperature(daily.temperature_2m_min[index])}</p>
            <p>Rain: ${daily.precipitation_probability_max[index] ?? 0}%</p>
        `;

        forecastContainer.appendChild(card);
    });
}

// Search weather
async function searchWeather(city) {
    city = city.trim();

    if (!city) {
        message.textContent = "Please enter a city name.";
        return;
    }

    message.textContent = "Loading weather...";
    weatherContainer.classList.add("hidden");
    searchBtn.disabled = true;

    try {
        weatherData = await fetchWeatherData(city);

        displayWeather(weatherData);
        displayForecast(weatherData.daily);
        saveRecentSearch(city);

        message.textContent = "";
    } catch (error) {
        message.textContent = error.message;
    } finally {
        searchBtn.disabled = false;
    }
}

// Search form event
searchForm.addEventListener("submit", function(event) {
    event.preventDefault();
    searchWeather(cityInput.value);
});

// Celsius and Fahrenheit toggle
unitBtn.addEventListener("click", function() {
    if (!weatherData) return;

    isCelsius = !isCelsius;

    displayWeather(weatherData);
    displayForecast(weatherData.daily);
});

// Save recent searches
function saveRecentSearch(city) {
    let searches = JSON.parse(localStorage.getItem("recentSearches")) || [];

    searches = searches.filter(
        item => item.toLowerCase() !== city.toLowerCase()
    );

    searches.unshift(city);
    searches = searches.slice(0, 5);

    localStorage.setItem("recentSearches", JSON.stringify(searches));

    displayRecentSearches();
}

// Display recent searches
function displayRecentSearches() {
    const recentDiv = document.getElementById("recentSearches");
    const searches = JSON.parse(localStorage.getItem("recentSearches")) || [];

    recentDiv.innerHTML = "";

    searches.forEach(city => {
        const button = document.createElement("button");
        button.className = "recent-chip";
        button.textContent = city;

        button.addEventListener("click", function() {
            cityInput.value = city;
            searchWeather(city);
        });

        recentDiv.appendChild(button);
    });
}

// Dark and light mode
function updateThemeButton() {
    themeBtn.textContent = document.body.classList.contains("dark")
        ? "☀️ Light Mode"
        : "🌙 Dark Mode";
}

if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
}

updateThemeButton();

themeBtn.addEventListener("click", function() {
    document.body.classList.toggle("dark");

    const theme = document.body.classList.contains("dark")
        ? "dark"
        : "light";

    localStorage.setItem("theme", theme);
    updateThemeButton();
});

// Show saved searches when page loads
displayRecentSearches();