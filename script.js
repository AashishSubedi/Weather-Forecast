// DOM Elements
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const cityInput = document.getElementById('city-input');
const unitToggleBtns = document.querySelectorAll('#unit-toggle-btn');
const currentWeather = document.getElementById('current-weather');
const forecastContainer = document.getElementById('forecast-container');
const forecastCards = document.getElementById('forecast-cards');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');

// Weather Data
let currentUnit = 'metric'; // Default to Celsius
const apiKey = '6c868b3e61544efcbd260932250104'; // Replace with your actual API key

// Event Listeners
searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (city) {
    fetchWeatherData(city);
  } else {
    showError('Please enter a city name');
  }
});

locationBtn.addEventListener('click', getLocationWeather);

cityInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const city = cityInput.value.trim();
    if (city) fetchWeatherData(city);
  }
});

unitToggleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    unitToggleBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentUnit = btn.dataset.unit;
    const currentCity = document.getElementById('city-name').textContent;
    if (currentCity !== '--') fetchWeatherData(currentCity);
  });
});

// Main Weather Function
async function fetchWeatherData(city) {
    try {
        showLoading();

        const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=5&aqi=no&alerts=no`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('City not found');
        }

        const data = await response.json();
        displayCurrentWeather(data);
        displayForecast(data);

    } catch (error) {
        showError(error.message);
        console.error('Error:', error);
    } finally {
        hideLoading();
    }
}

// Display Current Weather
function displayCurrentWeather(data) {
    if (!data || !data.current) {
      showError('Weather data not available');
      return;
    }
  
    const { location, current } = data;
    const { temp_c, temp_f, feelslike_c, feelslike_f, humidity, wind_kph, wind_mph, pressure_mb, condition } = current;
  
    // Display city name
    document.getElementById('city-name').textContent = location.name;
    
    // Date
    const date = new Date();
    document.getElementById('current-date').textContent = date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // Temperature
    const temp = currentUnit === 'metric' ? temp_c : temp_f;
    const feelsLike = currentUnit === 'metric' ? feelslike_c : feelslike_f;
    const windSpeed = currentUnit === 'metric' ? wind_kph : wind_mph;
    const tempUnit = currentUnit === 'metric' ? '°C' : '°F';
    const windUnit = currentUnit === 'metric' ? 'km/h' : 'mph';
    
    document.getElementById('temperature').textContent = `${Math.round(temp)}${tempUnit}`;
    document.getElementById('feels-like').textContent = `${Math.round(feelsLike)}${tempUnit}`;
    document.getElementById('humidity').textContent = humidity;
    document.getElementById('windspeed').textContent = `${windSpeed} ${windUnit}`;
    document.getElementById('pressure').textContent = pressure_mb;
    document.getElementById('weather-condition').textContent = condition.text;
  
    // Set weather icon
    const icon = document.getElementById('weather-icon');
    icon.innerHTML = getWeatherIcon(condition.text);
  
    // Update background based on weather condition
    updateWeatherBackground(condition.text);
}

// Display 5-Day Forecast
function displayForecast(data) {
    forecastCards.innerHTML = '';
  
    if (!data || !data.forecast || !Array.isArray(data.forecast.forecastday)) {
      showError('Forecast data not available');
      return;
    }
  
    const dailyForecasts = data.forecast.forecastday.slice(0, 5);
  
    dailyForecasts.forEach(day => {
      const date = new Date(day.date);
      const { maxtemp_c, maxtemp_f, mintemp_c, mintemp_f } = day.day;
      const { text } = day.day.condition;
  
      const maxTemp = currentUnit === 'metric' ? maxtemp_c : maxtemp_f;
      const minTemp = currentUnit === 'metric' ? mintemp_c : mintemp_f;
      const tempUnit = currentUnit === 'metric' ? '°C' : '°F';
  
      const forecastCard = document.createElement('div');
      forecastCard.className = 'forecast-card';
      forecastCard.innerHTML = `
        <div class="forecast-day">${date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
        <div class="forecast-icon">${getWeatherIcon(text)}</div>
        <div class="forecast-temp">
          <span class="forecast-high">${Math.round(maxTemp)}${tempUnit}</span>
          <span class="forecast-low">${Math.round(minTemp)}${tempUnit}</span>
        </div>
        <div class="forecast-desc">${text}</div>
      `;
      
      forecastCards.appendChild(forecastCard);
    });
}
// Get Weather by Geolocation (using WeatherAPI)
function getLocationWeather() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          fetchWeatherByCoords(latitude, longitude);
        },
        error => {
          showError('Geolocation error: ' + error.message);
        }
      );
    } else {
      showError('Geolocation is not supported by your browser');
    }
  }
  
  async function fetchWeatherByCoords(lat, lon) {
    try {
      showLoading();
      hideError();
      
      // Using WeatherAPI for geolocation weather
      const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error('Location not found');
      
      const data = await response.json();
      cityInput.value = data.location.name;
      fetchWeatherData(data.location.name);  // Fetch weather using city name
      
    } catch (error) {
      showError(error.message);
    } finally {
      hideLoading();
    }
  }
  

// Helper Functions
function getWeatherIcon(condition) {
  const icons = {
    Clear: '<i class="fas fa-sun"></i>',
    Clouds: '<i class="fas fa-cloud"></i>',
    Rain: '<i class="fas fa-cloud-rain"></i>',
    Thunderstorm: '<i class="fas fa-bolt"></i>',
    Snow: '<i class="fas fa-snowflake"></i>',
    Mist: '<i class="fas fa-smog"></i>',
    Drizzle: '<i class="fas fa-cloud-rain"></i>'
  };
  return icons[condition] || '<i class="fas fa-cloud-sun"></i>';
}

function updateWeatherBackground(condition) {
  const conditions = {
    Clear: 'clear-sky',
    Clouds: 'scattered-clouds',
    Rain: 'rain',
    Thunderstorm: 'thunderstorm',
    Snow: 'snow',
    Mist: 'mist',
    Drizzle: 'shower-rain'
  };
  
  // Remove all weather classes
  document.body.classList.remove(
    'clear-sky', 'few-clouds', 'scattered-clouds', 'broken-clouds',
    'shower-rain', 'rain', 'thunderstorm', 'snow', 'mist'
  );
  
  // Add the current weather class
  if (conditions[condition]) {
    document.body.classList.add(conditions[condition]);
  }
}

function showLoading() {
  loading.style.display = 'flex';
  currentWeather.style.visibility = 'hidden';
  forecastContainer.style.visibility = 'hidden';
}

function hideLoading() {
  loading.style.display = 'none';
  currentWeather.style.visibility = 'visible';
  forecastContainer.style.visibility = 'visible';
}

function showError(message) {
  errorMessage.classList.remove('hidden');
  errorText.textContent = message;
}

function hideError() {
  errorMessage.classList.add('hidden');
}

// Initializing with default city
fetchWeatherData('Lake Charles');
