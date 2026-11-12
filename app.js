
/* ==========================================
   WEATHER APP - COMPLETE JAVASCRIPT
========================================== */

// 1. API KEY
// Yahan apni valid OpenWeatherMap API key paste karo.
const API_KEY = "677fe170900763e1ab59fa407a07be48";

// 2. HTML ELEMENTS
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");

const cityName = document.getElementById("cityName");
const weatherIcon = document.getElementById("weatherIcon");
const temperature = document.getElementById("temperature");
const weatherDescription = document.getElementById("weatherDescription");

const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("windSpeed");
const feelsLike = document.getElementById("feelsLike");
const forecastContainer = document.getElementById("forecastContainer");

const searchBox = document.querySelector(".search-box");
const weatherCard = document.querySelector(".weather-card");
const effectsContainer = document.getElementById("weatherEffects");

// Zaroori HTML elements check karo
if (
    !cityInput ||
    !searchBtn ||
    !cityName ||
    !weatherIcon ||
    !temperature ||
    !weatherDescription ||
    !humidity ||
    !windSpeed ||
    !feelsLike ||
    !forecastContainer ||
    !searchBox ||
    !weatherCard
) {
    console.error(
        "Weather App: HTML elements nahi mile. Apne HTML IDs check karo."
    );
}

// 3. EXTRA UI ELEMENTS

const statusMessage = document.createElement("p");
statusMessage.id = "weatherStatus";
statusMessage.setAttribute("role", "status");
statusMessage.setAttribute("aria-live", "polite");

if (searchBox) {
    searchBox.insertAdjacentElement("afterend", statusMessage);
}

const weatherMessage = document.createElement("p");
weatherMessage.id = "weatherMessage";
weatherMessage.setAttribute("aria-live", "polite");

if (weatherCard) {
    weatherCard.appendChild(weatherMessage);
}

// Celsius / Fahrenheit button
const unitToggle = document.createElement("button");
unitToggle.className = "unit-toggle";
unitToggle.type = "button";
unitToggle.textContent = "Switch to °F";

if (temperature && temperature.parentElement) {
    temperature.parentElement.insertAdjacentElement(
        "afterend",
        unitToggle
    );
}

// Sunrise / sunset section
const sunDetails = document.createElement("div");
sunDetails.className = "weather-details";

sunDetails.innerHTML = `
    <div class="detail">
        <span>🌅</span>
        <p>Sunrise</p>
        <strong id="sunrise">--</strong>
    </div>

    <div class="detail">
        <span>🌇</span>
        <p>Sunset</p>
        <strong id="sunset">--</strong>
    </div>
`;

if (weatherCard) {
    weatherCard.appendChild(sunDetails);
}

// 4. APP STATE

let currentUnit = "C";
let currentWeatherData = null;
let currentForecastData = null;

// 5. HELPER FUNCTIONS

function showStatus(message) {
    statusMessage.textContent = message;
}

function formatTemperature(value) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return "--";
    }

    return Math.round(value);
}

function convertTemperature(celsius) {
    if (currentUnit === "F") {
        return (celsius * 9 / 5) + 32;
    }

    return celsius;
}

function getLocalTime(timestamp, timezoneOffset) {
    const date = new Date(
        (timestamp + timezoneOffset) * 1000
    );

    return date.toLocaleTimeString("en-IN", {
        timeZone: "UTC",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
}

function getLocalDate(timestamp, timezoneOffset) {
    return new Date(
        (timestamp + timezoneOffset) * 1000
    ).toISOString().slice(0, 10);
}

function getLocalHour(timestamp, timezoneOffset) {
    return new Date(
        (timestamp + timezoneOffset) * 1000
    ).getUTCHours();
}

// Temperature ke paas °C / °F update karo
function updateTemperatureUnit() {
    const nextNode = temperature.nextSibling;

    if (
        nextNode &&
        nextNode.nodeType === Node.TEXT_NODE
    ) {
        nextNode.textContent = `°${currentUnit}`;
    }
}

// 6. WEATHER EMOJI

function getWeatherEmoji(condition, isDay = true) {
    const weather = (condition || "").toLowerCase();

    if (weather.includes("thunder")) return "⛈️";
    if (weather.includes("drizzle")) return "🌦️";
    if (weather.includes("rain")) return "🌧️";
    if (weather.includes("snow")) return "❄️";

    if (
        weather.includes("mist") ||
        weather.includes("fog") ||
        weather.includes("haze") ||
        weather.includes("smoke")
    ) {
        return "🌫️";
    }

    if (weather.includes("cloud")) return "☁️";

    if (weather.includes("clear")) {
        return isDay ? "☀️" : "🌙";
    }

    return "🌤️";
}

// 7. HINDI WEATHER MESSAGE

function getHindiMessage(condition, tempCelsius) {
    const weather = (condition || "").toLowerCase();

    if (
        weather.includes("rain") ||
        weather.includes("drizzle") ||
        weather.includes("thunder")
    ) {
        return "☔ Baarish ho sakti hai. Bahar jaate waqt umbrella rakhna.";
    }

    if (weather.includes("snow")) {
        return "❄️ Thand se bachkar rehna aur garam kapde pehenna.";
    }

    if (weather.includes("mist") || weather.includes("fog")) {
        return "🌫️ Visibility kam ho sakti hai. Safar mein saavdhani rakho.";
    }

    if (tempCelsius >= 35) {
        return "☀️ Kaafi garmi hai. Paani peete rehna aur dhoop se bachna.";
    }

    if (tempCelsius <= 10) {
        return "🧥 Mausam thanda hai. Garam kapde pehenna.";
    }

    if (weather.includes("cloud")) {
        return "☁️ Aaj aasman mein baadal hain. Mausam ka dhyan rakhna.";
    }

    if (weather.includes("clear")) {
        return "🌞 Mausam saaf hai. Apne din ka maza lo!";
    }

    return "🌤️ Mausam ki latest update dekhte raho!";
}

// 8. FETCH WEATHER DATA

async function fetchWeatherData(endpoint, city) {
    const url =
        `https://api.openweathermap.org/data/2.5/${endpoint}` +
        `?q=${encodeURIComponent(city)}` +
        `&appid=${API_KEY}&units=metric`;

    const response = await fetch(url);

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error(
                "API key invalid hai ya abhi activate nahi hui."
            );
        }

        if (response.status === 404) {
            throw new Error(
                "City nahi mili. City ki spelling check karo."
            );
        }

        if (response.status === 429) {
            throw new Error(
                "API request limit ho gayi. Thodi der baad try karo."
            );
        }

        throw new Error(
            "Weather data nahi mil saka. Dobara try karo."
        );
    }

    return await response.json();
}

// 9. GET WEATHER

async function getWeather(city) {
    const cleanCity = (city || "")
    .trim()
    .replace(/\s+/g, " ");

    if (!cleanCity) {
        showStatus("Bhai, pehle city ka naam enter karo.");
        cityInput.focus();
        return;
    }

    if (
        !API_KEY ||
        API_KEY === "PASTE_YOUR_NEW_API_KEY_HERE"
    ) {
        showStatus(
            "Pehle JavaScript mein apni OpenWeatherMap API key add karo."
        );
        return;
    }

    searchBtn.disabled = true;
    searchBtn.textContent = "Loading...";

    showStatus(`${cleanCity} ka weather load ho raha hai...`);

    try {
        const [weatherData, forecastData] = await Promise.all([
            fetchWeatherData("weather", cleanCity),
            fetchWeatherData("forecast", cleanCity)
        ]);

        currentWeatherData = weatherData;
        currentForecastData = forecastData;

        cityInput.value = weatherData.name;

        renderWeather();
        renderForecast();
        renderHourlyForecast();

        // AQI alag load hota hai; ismein error aaye
        // to bhi weather app chalta rahega.
        getAirQuality(
            weatherData.coord.lat,
            weatherData.coord.lon
        );

        showStatus(`Weather update mil gayi: ${weatherData.name}`);
    } catch (error) {
        showStatus(
            error.message || "Kuch problem hui. Dobara try karo."
        );
    } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = "Search";
    }
}

// 10. DISPLAY CURRENT WEATHER

function renderWeather() {
    if (!currentWeatherData) return;

    const data = currentWeatherData;
    const condition = data.weather[0].description;
    const mainCondition = data.weather[0].main;

    // Dynamic background aur rain/snow effects
    updateWeatherBackground(
        condition,
        data.weather[0].icon
    );

    createWeatherEffects(condition);

    cityName.textContent = `${data.name}, ${data.sys.country}`;

    const isDay =
        data.dt >= data.sys.sunrise &&
        data.dt < data.sys.sunset;

    weatherIcon.textContent = getWeatherEmoji(
        mainCondition,
        isDay
    );

    temperature.textContent = formatTemperature(
        convertTemperature(data.main.temp)
    );

    updateTemperatureUnit();

    weatherDescription.textContent = condition;
    humidity.textContent = `${data.main.humidity}%`;

    // Metres/second se km/h
    windSpeed.textContent =
        `${(data.wind.speed * 3.6).toFixed(1)} km/h`;

    feelsLike.textContent =
        `${formatTemperature(
            convertTemperature(data.main.feels_like)
        )}°${currentUnit}`;

    document.getElementById("sunrise").textContent =
        getLocalTime(data.sys.sunrise, data.timezone);

    document.getElementById("sunset").textContent =
        getLocalTime(data.sys.sunset, data.timezone);

    weatherMessage.textContent = getHindiMessage(
        condition,
        data.main.temp
    );

    unitToggle.textContent =
        currentUnit === "C" ? "Switch to °F" : "Switch to °C";
}

// 11. DISPLAY 5-DAY FORECAST

function renderForecast() {
    if (!currentForecastData) return;

    const entries = currentForecastData.list;
    const timezoneOffset = currentForecastData.city.timezone;
    const dailyGroups = {};

    entries.forEach(item => {
        const localDate = getLocalDate(
            item.dt,
            timezoneOffset
        );

        if (!dailyGroups[localDate]) {
            dailyGroups[localDate] = [];
        }

        dailyGroups[localDate].push(item);
    });

    const dates = Object.keys(dailyGroups)
        .sort()
        .slice(0, 5);

    forecastContainer.innerHTML = "";

    dates.forEach((date, index) => {
        const dayEntries = dailyGroups[date];

        // Dopahar 12 baje ke sabse kareeb forecast
        const middayEntry = dayEntries.reduce((best, item) => {
            const hour = getLocalHour(
                item.dt,
                timezoneOffset
            );

            const bestHour = getLocalHour(
                best.dt,
                timezoneOffset
            );

            return Math.abs(hour - 12) <
                Math.abs(bestHour - 12)
                ? item
                : best;
        }, dayEntries[0]);

        const dayName = index === 0
            ? "Today"
            : new Date(`${date}T12:00:00Z`)
                .toLocaleDateString("en-IN", {
                    timeZone: "UTC",
                    weekday: "short"
                });

        const icon = getWeatherEmoji(
            middayEntry.weather[0].main
        );

        const temp = formatTemperature(
            convertTemperature(middayEntry.main.temp)
        );

        const card = document.createElement("div");
        card.className = "forecast-card";

        const dayLabel = document.createElement("p");
        dayLabel.textContent = dayName;

        const iconLabel = document.createElement("span");
        iconLabel.textContent = icon;
        iconLabel.setAttribute(
            "aria-label",
            middayEntry.weather[0].description
        );

        const tempLabel = document.createElement("strong");
        tempLabel.textContent = `${temp}°${currentUnit}`;

        card.append(dayLabel, iconLabel, tempLabel);
        forecastContainer.appendChild(card);
    });
}

// 12. SEARCH BUTTON AND ENTER KEY

searchBtn.addEventListener("click", () => {
    getWeather(cityInput.value);
});

cityInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        getWeather(cityInput.value);
    }
});

// 13. HOURLY WEATHER FORECAST

function renderHourlyForecast() {
    const container = document.getElementById("hourlyContainer");

    if (!container || !currentForecastData?.list) {
        return;
    }

    const timezoneOffset = currentForecastData.city.timezone || 0;
    const now = Math.floor(Date.now() / 1000);

    const upcomingHours = currentForecastData.list
        .filter(item => item.dt > now)
        .slice(0, 6);

    if (upcomingHours.length === 0) {
        container.textContent = "Hourly forecast unavailable.";
        return;
    }

    container.innerHTML = "";

    upcomingHours.forEach((item, index) => {
        const localDate = new Date(
            (item.dt + timezoneOffset) * 1000
        );

        const hour = localDate.getUTCHours();

        let timeLabel;

        if (index === 0) {
            timeLabel = "Next";
        } else if (hour === 0) {
            timeLabel = "12 AM";
        } else if (hour < 12) {
            timeLabel = `${hour} AM`;
        } else if (hour === 12) {
            timeLabel = "12 PM";
        } else {
            timeLabel = `${hour - 12} PM`;
        }

        const icon = getWeatherEmoji(item.weather[0].main);

        const temp = formatTemperature(
            convertTemperature(item.main.temp)
        );

        const condition = item.weather[0].description;
        const wind = (item.wind.speed * 3.6).toFixed(1);

        const card = document.createElement("div");
        card.className = "hourly-card";

        const timeElement = document.createElement("p");
        timeElement.className = "hourly-time";
        timeElement.textContent = timeLabel;

        const iconElement = document.createElement("span");
        iconElement.className = "hourly-icon";
        iconElement.textContent = icon;

        const tempElement = document.createElement("strong");
        tempElement.className = "hourly-temperature";
        tempElement.textContent = `${temp}°${currentUnit}`;

        const conditionElement = document.createElement("p");
        conditionElement.className = "hourly-condition";
        conditionElement.textContent = condition;

        const windElement = document.createElement("p");
        windElement.className = "hourly-wind";
        windElement.textContent = `💨 ${wind} km/h`;

        card.append(
            timeElement,
            iconElement,
            tempElement,
            conditionElement,
            windElement
        );

        container.appendChild(card);
    });
}

// 14. CELSIUS / FAHRENHEIT TOGGLE

unitToggle.addEventListener("click", () => {
    currentUnit = currentUnit === "C" ? "F" : "C";

    renderWeather();
    renderForecast();
    renderHourlyForecast();
});

// 15. AIR QUALITY INDEX (AQI)

async function getAirQuality(lat, lon) {
    const aqiValue = document.getElementById("aqiValue");
    const aqiStatus = document.getElementById("aqiStatus");

    if (!aqiValue || !aqiStatus) return;

    aqiValue.textContent = "Loading...";
    aqiStatus.textContent = "";

    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/air_pollution` +
            `?lat=${lat}&lon=${lon}&appid=${API_KEY}`
        );

        if (!response.ok) {
            throw new Error("Air quality data unavailable");
        }

        const data = await response.json();

        if (!data.list || !data.list.length) {
            throw new Error("AQI data nahi mili");
        }

        const aqi = data.list[0].main.aqi;

        const aqiLabels = {
            1: "Good 🌿",
            2: "Fair 🙂",
            3: "Moderate 😐",
            4: "Poor 😷",
            5: "Very Poor ⚠️"
        };

        aqiValue.textContent = `${aqi} / 5`;
        aqiStatus.textContent = aqiLabels[aqi] || "Unknown";
    } catch (error) {
        aqiValue.textContent = "--";
        aqiStatus.textContent =
            "AQI unavailable - check API access";

        console.error("AQI Error:", error);
    }
}

// 16. DYNAMIC WEATHER BACKGROUNDS

function updateWeatherBackground(condition, iconCode) {
    const body = document.body;
    const weather = (condition || "").toLowerCase();

    body.classList.remove(
        "weather-sunny",
        "weather-cloudy",
        "weather-rainy",
        "weather-snowy",
        "weather-foggy",
        "weather-night"
    );

    // Rain/snow ko night se pehle check karo,
    // taaki raat mein bhi weather effects dikh sakein.
    if (
        weather.includes("thunder") ||
        weather.includes("drizzle") ||
        weather.includes("rain")
    ) {
        body.classList.add("weather-rainy");
    } else if (weather.includes("snow")) {
        body.classList.add("weather-snowy");
    } else if (
        weather.includes("mist") ||
        weather.includes("fog") ||
        weather.includes("haze") ||
        weather.includes("smoke")
    ) {
        body.classList.add("weather-foggy");
    } else if (iconCode && iconCode.endsWith("n")) {
        body.classList.add("weather-night");
    } else if (weather.includes("cloud")) {
        body.classList.add("weather-cloudy");
    } else if (weather.includes("clear")) {
        body.classList.add("weather-sunny");
    } else {
        body.classList.add("weather-cloudy");
    }
}

// 17. RAIN & SNOW PARTICLE EFFECTS

function createWeatherEffects(condition) {
    const container = effectsContainer;

    if (!container) return;

    container.innerHTML = "";

    const weather = (condition || "").toLowerCase();

    const isRain =
        weather.includes("rain") ||
        weather.includes("drizzle") ||
        weather.includes("thunder");

    const isSnow = weather.includes("snow");

    if (!isRain && !isSnow) {
        container.style.display = "none";
        return;
    }

    // Inline display se night weather mein bhi effects dikhenge.
    container.style.display = "block";

    const particleCount = isRain ? 55 : 30;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement("span");

        particle.style.setProperty(
            "--left",
            `${Math.random() * 100}%`
        );

        particle.style.setProperty(
            "--duration",
            `${isRain
                ? 0.6 + Math.random() * 0.8
                : 4 + Math.random() * 5}s`
        );

        particle.style.setProperty(
            "--delay",
            `${-Math.random() * 8}s`
        );

        if (isRain) {
            particle.className = "weather-drop";
        } else {
            particle.className = "weather-snowflake";
            particle.textContent = "❄";

            particle.style.setProperty(
                "--size",
                `${10 + Math.random() * 12}px`
            );

            particle.style.setProperty(
                "--drift",
                `${Math.random() * 100 - 50}px`
            );
        }

        container.appendChild(particle);
    }
}

// 18. START APP

getWeather("New Delhi");
