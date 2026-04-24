const form = document.getElementById("weather-form");
const cityInput = document.getElementById("city-input");
const feedback = document.getElementById("feedback");
const result = document.getElementById("result");

const clearResult = () => {
  result.style.display = "none";
  result.innerHTML = "";
};

const renderWeather = (data) => {
  result.innerHTML = `
    <h2>${data.city}, ${data.country}</h2>
    <div class="weather-main">
      <span class="temperature">${Math.round(data.temperature)}°C</span>
      <img src="${data.iconUrl}" alt="${data.condition}" />
    </div>
    <div class="details">
      <p><strong>Sensação térmica:</strong> ${Math.round(data.feelsLike)}°C</p>
      <p><strong>Umidade:</strong> ${data.humidity}%</p>
      <p><strong>Condição:</strong> ${data.condition}</p>
    </div>
  `;
  result.style.display = "block";
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const city = cityInput.value.trim();
  feedback.textContent = "";
  clearResult();

  if (!city) {
    feedback.textContent = "Digite o nome de uma cidade.";
    return;
  }

  try {
    const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
    const payload = await response.json();

    if (!response.ok) {
      feedback.textContent = payload.error || "Não foi possível buscar o clima.";
      return;
    }

    renderWeather(payload);
  } catch (_error) {
    feedback.textContent = "Erro de conexão. Tente novamente.";
  }
});
