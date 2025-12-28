// API Configuration
        const API_KEY = 'e973791d4de47d5ca25fdac49077a325'; // Replace with your OpenWeatherMap API key
        const BASE_URL = 'https://api.openweathermap.org/data/2.5';
        
        // App State
        let currentUnit = 'celsius';
        let currentWeatherData = null;
        let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
        
        // DOM Elements
        const cityInput = document.getElementById('cityInput');
        const searchBtn = document.getElementById('searchBtn');
        const currentLocationBtn = document.getElementById('currentLocationBtn');
        const celsiusBtn = document.getElementById('celsiusBtn');
        const fahrenheitBtn = document.getElementById('fahrenheitBtn');
        const recentSearchesDiv = document.getElementById('recentSearches');
        const noRecentSearchesDiv = document.getElementById('noRecentSearches');
        const temperatureAlert = document.getElementById('temperatureAlert');
        const alertMessage = document.getElementById('alertMessage');
        const closeAlert = document.getElementById('closeAlert');
        const errorMessage = document.getElementById('errorMessage');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const forecastError = document.getElementById('forecastError');
        const recentToggle = document.getElementById('recentToggle');

        
        // Weather Display Elements
        const currentWeatherDiv = document.getElementById('currentWeather');
        const cityName = document.getElementById('cityName');
        const currentDate = document.getElementById('currentDate');
        const temperature = document.getElementById('temperature');
        const humidity = document.getElementById('humidity');
        const windSpeed = document.getElementById('windSpeed');
        const weatherCondition = document.getElementById('weatherCondition');
        const weatherIcon = document.getElementById('weatherIcon');
        const forecastContainer = document.getElementById('forecastContainer');
        
        // Initialize the app
        document.addEventListener('DOMContentLoaded', function() {
            // Load recent searches
            updateRecentSearches();
            
            // Event Listeners
            searchBtn.addEventListener('click', handleCitySearch);
            cityInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    handleCitySearch();
                }
            });
            
            currentLocationBtn.addEventListener('click', handleCurrentLocation);
            celsiusBtn.addEventListener('click', () => switchTemperatureUnit('celsius'));
            fahrenheitBtn.addEventListener('click', () => switchTemperatureUnit('fahrenheit'));
            closeAlert.addEventListener('click', () => temperatureAlert.classList.add('hidden'));
            
            // Try to get weather for a default city on load
            getWeatherByCity('London');
        });
        
        // Handle city search
        function handleCitySearch() {
            const city = cityInput.value.trim();
            
            if (!city) {
                showError('Please enter a city name');
                return;
            }
            
            getWeatherByCity(city);
        }
        
        // Handle current location weather
        function handleCurrentLocation() {
            if (!navigator.geolocation) {
                showError('Geolocation is not supported by your browser');
                return;
            }
            
            loadingSpinner.classList.remove('hidden');
            forecastError.classList.add('hidden');
            
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        const weatherData = await fetchWeatherByCoords(latitude, longitude);
                        displayCurrentWeather(weatherData);
                        displayForecast(weatherData);
                        addToRecentSearches(weatherData.name, weatherData.sys.country);
                    } catch (error) {
                        console.error('Error fetching weather by coordinates:', error);
                        showError('Unable to fetch weather data for your location');
                    } finally {
                        loadingSpinner.classList.add('hidden');
                    }
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    showError('Unable to access your location. Please check permissions.');
                    loadingSpinner.classList.add('hidden');
                }
            );
        }
        
        // Get weather by city name
        async function getWeatherByCity(city) {
            loadingSpinner.classList.remove('hidden');
            forecastError.classList.add('hidden');
            errorMessage.classList.add('hidden');
            
            try {
                const weatherData = await fetchWeatherData(city);
                displayCurrentWeather(weatherData);
                displayForecast(weatherData);
                addToRecentSearches(weatherData.name, weatherData.sys.country);
                cityInput.value = '';
            } catch (error) {
                console.error('Error fetching weather data:', error);
                showError('City not found. Please try again.');
                forecastError.classList.remove('hidden');
            } finally {
                loadingSpinner.classList.add('hidden');
            }
        }
        
        // Fetch weather data from API
        async function fetchWeatherData(city) {
            const response = await fetch(
                `${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
            );
            
            if (!response.ok) {
                throw new Error('City not found');
            }
            
            const weatherData = await response.json();
            
            // Get forecast data
            const forecastResponse = await fetch(
                `${BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
            );
            
            if (forecastResponse.ok) {
                const forecastData = await forecastResponse.json();
                weatherData.forecast = forecastData;
            }
            
            return weatherData;
        }
        
        // Fetch weather by coordinates
        async function fetchWeatherByCoords(lat, lon) {
            const response = await fetch(
                `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
            );
            
            if (!response.ok) {
                throw new Error('Location not found');
            }
            
            const weatherData = await response.json();
            
            // Get forecast data
            const forecastResponse = await fetch(
                `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
            );
            
            if (forecastResponse.ok) {
                const forecastData = await forecastResponse.json();
                weatherData.forecast = forecastData;
            }
            
            return weatherData;
        }
        
        // Display current weather

  function displayCurrentWeather(data) {
    currentWeatherData = data; 

    cityName.textContent = `${data.name}, ${data.sys.country}`;
    currentDate.textContent = formatDate(new Date());

    updateCurrentTemperature(); // 🔹 new function

    // Update weather details
    humidity.textContent = `${data.main.humidity}%`;
    windSpeed.textContent = `${data.wind.speed.toFixed(1)} m/s`;
    weatherCondition.textContent = data.weather[0].description;

                // Update weather icon
    updateWeatherIcon(data.weather[0].main, data.weather[0].description);
                // Update background based on weather condition
    updateBackground(data.weather[0].main);
          // Check for extreme temperatures
    checkExtremeTemperature(data.main.temp);
}

        // Display 5-day forecast
        function displayForecast(data) {
            if (!data.forecast) {
                forecastContainer.innerHTML = `
                    <div class="col-span-full text-center">
                        <div class="text-gray-500">No forecast data available</div>
                    </div>
                `;
                return;
            }
            
            // Get unique days from forecast (5 days)
            const forecasts = data.forecast.list.filter((item, index) => index % 8 === 0).slice(0, 5);
            
            forecastContainer.innerHTML = '';
            
            forecasts.forEach((forecast, index) => {
                const date = new Date(forecast.dt * 1000);
                const day = formatDay(date);
                const dateStr = formatDate(date);
                
                // Convert temperature based on selected unit
                const temp = currentUnit === 'celsius' ? forecast.main.temp : celsiusToFahrenheit(forecast.main.temp);
                const minTemp = currentUnit === 'celsius' ? forecast.main.temp_min : celsiusToFahrenheit(forecast.main.temp_min);
                const maxTemp = currentUnit === 'celsius' ? forecast.main.temp_max : celsiusToFahrenheit(forecast.main.temp_max);
                
                const weatherCondition = forecast.weather[0].main.toLowerCase();
                const iconClass = getWeatherIconClass(weatherCondition);
                
                const forecastCard = document.createElement('div');
                forecastCard.className = 'bg-white rounded-xl shadow-md p-4 card-hover';
                forecastCard.innerHTML = `
                    <div class="text-center">
                        <div class="text-lg font-bold text-gray-800 mb-1">${day}</div>
                        <div class="text-gray-600 text-sm mb-3">${dateStr}</div>
                        <div class="text-5xl mb-3 text-blue-600">
                            <i class="${iconClass}"></i>
                        </div>
                        <div class="text-2xl font-bold text-gray-800 mb-1">${temp.toFixed(1)}°</div>
                        <div class="text-gray-600 text-sm mb-3">${forecast.weather[0].description}</div>
                        <div class="grid grid-cols-2 gap-2 mt-4">
                            <div class="bg-gray-50 rounded-lg p-2">
                                <div class="text-gray-600 text-xs mb-1">
                                    <i class="fas fa-temperature-low"></i> Min
                                </div>
                                <div class="font-bold text-gray-800">${minTemp.toFixed(1)}°</div>
                            </div>
                            <div class="bg-gray-50 rounded-lg p-2">
                                <div class="text-gray-600 text-xs mb-1">
                                    <i class="fas fa-temperature-high"></i> Max
                                </div>
                                <div class="font-bold text-gray-800">${maxTemp.toFixed(1)}°</div>
                            </div>
                            <div class="bg-gray-50 rounded-lg p-2">
                                <div class="text-gray-600 text-xs mb-1">
                                    <i class="fas fa-wind"></i> Wind
                                </div>
                                <div class="font-bold text-gray-800">${forecast.wind.speed.toFixed(1)} m/s</div>
                            </div>
                            <div class="bg-gray-50 rounded-lg p-2">
                                <div class="text-gray-600 text-xs mb-1">
                                    <i class="fas fa-tint"></i> Humidity
                                </div>
                                <div class="font-bold text-gray-800">${forecast.main.humidity}%</div>
                            </div>
                        </div>
                    </div>
                `;
                
                forecastContainer.appendChild(forecastCard);
            });
            
            // Add fade-in animation
            forecastContainer.classList.add('fade-in');
            setTimeout(() => forecastContainer.classList.remove('fade-in'), 500);
        }
        
        // Add city to recent searches
        function addToRecentSearches(city, country) {
            const cityCountry = `${city}, ${country}`;
            
            // Remove if already exists
            recentSearches = recentSearches.filter(item => item !== cityCountry);
            
            // Add to beginning
            recentSearches.unshift(cityCountry);
            
            // Keep only last 5 searches
            if (recentSearches.length > 5) {
                recentSearches.pop();
            }
            
            // Save to localStorage
            localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
            
            // Update UI
            updateRecentSearches();
        }
        
        // Update recent searches dropdown
     function updateRecentSearches() {
    recentSearchesDiv.innerHTML = '';

    if (recentSearches.length === 0) {
        noRecentSearchesDiv.classList.remove('hidden');
        recentSearchesDiv.classList.add('hidden');
        return;
    }

    noRecentSearchesDiv.classList.add('hidden');

    recentSearches.forEach(city => {
        const item = document.createElement('div');
        item.className =
            'px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b last:border-b-0';

        item.textContent = city;

        item.addEventListener('click', () => {
            getWeatherByCity(city.split(',')[0]);
            recentSearchesDiv.classList.add('hidden');
        });

        recentSearchesDiv.appendChild(item);
    });
}


        //Toggle recent searches dropdown
        recentToggle.addEventListener('click', (e) => {
    e.stopPropagation();

    if (recentSearches.length === 0) return;

    recentSearchesDiv.classList.toggle('hidden');
});

        
        // Switch temperature unit
        function switchTemperatureUnit(unit) {
    if (unit === currentUnit) return;

    currentUnit = unit;

    if (unit === 'celsius') {
        celsiusBtn.className =
            'unit-btn px-3 py-1.5 text-xs rounded-lg  bg-blue-600 text-white font-medium';
        fahrenheitBtn.className =
            'unit-btn px-3 py-1.5 text-xs rounded-lg bg-gray-200 text-gray-700 font-medium';
    } else {
        celsiusBtn.className =
            'unit-btn px-3 py-1.5 text-xs rounded-lg bg-gray-200 text-gray-700 font-medium';
        fahrenheitBtn.className =
            'unit-btn px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white font-medium';
    }

    updateCurrentTemperature(); // ONLY current weather updates
}

        // Check for extreme temperature and show alert
        function checkExtremeTemperature(tempCelsius) {
            // Extreme temperature thresholds
            const extremeHigh = 40; // Celsius
            const extremeLow = 0; // Celsius
            
            if (tempCelsius >= extremeHigh) {
                alertMessage.textContent = `Extreme Heat Warning: Temperature is ${tempCelsius.toFixed(1)}°C`;
                temperatureAlert.className = temperatureAlert.className.replace('hidden', '').trim();
                temperatureAlert.classList.add('alert-popup');
            } else if (tempCelsius <= extremeLow) {
                alertMessage.textContent = `Freezing Warning: Temperature is ${tempCelsius.toFixed(1)}°C`;
                temperatureAlert.className = temperatureAlert.className.replace('hidden', '').trim();
                temperatureAlert.classList.add('alert-popup');
            }
        }
        
        // Update background based on weather condition
        function updateBackground(condition) {
            const body = document.body;
            
            // Remove all weather background classes
            body.classList.remove(
                'sunny-bg', 'cloudy-bg', 'rainy-bg', 
                'snow-bg', 'storm-bg', 'clear-bg'
            );
            
            // Add appropriate class based on condition
            switch(condition.toLowerCase()) {
                case 'clear':
                    body.classList.add('sunny-bg');
                    break;
                case 'clouds':
                    body.classList.add('cloudy-bg');
                    break;
                case 'rain':
                case 'drizzle':
                    body.classList.add('rainy-bg');
                    break;
                case 'snow':
                    body.classList.add('snow-bg');
                    break;
                case 'thunderstorm':
                    body.classList.add('storm-bg');
                    break;
                default:
                    body.classList.add('clear-bg');
            }
        }
        
        // Update weather icon
        function updateWeatherIcon(condition, description) {
            let iconClass = 'fas fa-sun'; // Default
            
            switch(condition.toLowerCase()) {
                case 'clear':
                    iconClass = 'fas fa-sun';
                    break;
                case 'clouds':
                    if (description.includes('few') || description.includes('scattered')) {
                        iconClass = 'fas fa-cloud-sun';
                    } else {
                        iconClass = 'fas fa-cloud';
                    }
                    break;
                case 'rain':
                case 'drizzle':
                    iconClass = 'fas fa-cloud-rain';
                    break;
                case 'snow':
                    iconClass = 'fas fa-snowflake';
                    break;
                case 'thunderstorm':
                    iconClass = 'fas fa-bolt';
                    break;
                case 'mist':
                case 'fog':
                case 'haze':
                    iconClass = 'fas fa-smog';
                    break;
            }
            
            weatherIcon.innerHTML = `<i class="${iconClass}"></i>`;
        }
        
        // Get weather icon class for forecast
        function getWeatherIconClass(condition) {
            switch(condition) {
                case 'clear':
                    return 'fas fa-sun';
                case 'clouds':
                    return 'fas fa-cloud';
                case 'rain':
                    return 'fas fa-cloud-rain';
                case 'drizzle':
                    return 'fas fa-cloud-rain';
                case 'snow':
                    return 'fas fa-snowflake';
                case 'thunderstorm':
                    return 'fas fa-bolt';
                default:
                    return 'fas fa-cloud';
            }
        }
        
        // Show error message
        function showError(message) {
            errorMessage.textContent = message;
            errorMessage.classList.remove('hidden');
            
            // Hide error after 5 seconds
            setTimeout(() => {
                errorMessage.classList.add('hidden');
            }, 5000);
        }
        
        // Utility functions
        function celsiusToFahrenheit(celsius) {
            return (celsius * 9/5) + 32;
        }
        
        function formatDate(date) {
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        
        function formatDay(date) {
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        }
        
 //Close dropdown
        document.addEventListener('click', () => {
    recentSearchesDiv.classList.add('hidden');
});
function updateCurrentTemperature() {
    if (!currentWeatherData) return;

    let tempC = currentWeatherData.main.temp;

    if (currentUnit === 'fahrenheit') {
        temperature.textContent = `${celsiusToFahrenheit(tempC).toFixed(1)}°`;
    } else {
        temperature.textContent = `${tempC.toFixed(1)}°`;
    }
}
