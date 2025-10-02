// Token data and state management
let tokenPrices = {};
let tokens = [];

// DOM elements
const inputAmount = document.getElementById('input-amount');
const outputAmount = document.getElementById('output-amount');
const inputCurrency = document.getElementById('input-currency');
const outputCurrency = document.getElementById('output-currency');
const swapDirectionBtn = document.getElementById('swap-direction');
const submitBtn = document.getElementById('submit-btn');
const swapForm = document.getElementById('swap-form');
const exchangeInfo = document.getElementById('exchange-info');
const inputError = document.getElementById('input-error');
const outputError = document.getElementById('output-error');
const successMessage = document.getElementById('success-message');

// Token icon URL template
const getTokenIconUrl = (symbol) => {
  return `https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/${symbol}.svg`;
};

// Fetch token prices
async function fetchTokenPrices() {
  try {
    const response = await fetch('https://interview.switcheo.com/prices.json');
    const data = await response.json();

    // Process the data to create a token prices map
    const pricesMap = {};
    data.forEach(item => {
      const currency = item.currency;
      // Take the latest price for each currency
      if (!pricesMap[currency] || item.date > pricesMap[currency].date) {
        pricesMap[currency] = {
          price: parseFloat(item.price),
          date: item.date
        };
      }
    });

    tokenPrices = pricesMap;

    // Get unique tokens that have prices
    tokens = Object.keys(pricesMap).sort();

    populateTokenSelects();
  } catch (error) {
    console.error('Error fetching token prices:', error);
    showError(inputError, 'Failed to load token prices. Please refresh the page.');
  }
}

// Populate token select dropdowns
function populateTokenSelects() {
  const createOption = (token) => {
    const option = document.createElement('option');
    option.value = token;
    option.textContent = `${token} ($${tokenPrices[token].price.toFixed(2)})`;
    option.dataset.icon = getTokenIconUrl(token);
    return option;
  };

  // Clear existing options except the first one
  inputCurrency.innerHTML = '<option value="">Select token</option>';
  outputCurrency.innerHTML = '<option value="">Select token</option>';

  tokens.forEach(token => {
    inputCurrency.appendChild(createOption(token));
    outputCurrency.appendChild(createOption(token));
  });
}

// Calculate exchange rate
function calculateExchangeRate(fromCurrency, toCurrency) {
  if (!fromCurrency || !toCurrency || !tokenPrices[fromCurrency] || !tokenPrices[toCurrency]) {
    return null;
  }

  const fromPrice = tokenPrices[fromCurrency].price;
  const toPrice = tokenPrices[toCurrency].price;

  // Exchange rate: how much of toCurrency you get for 1 unit of fromCurrency
  return fromPrice / toPrice;
}

// Calculate output amount based on input
function calculateOutputAmount() {
  const amount = parseFloat(inputAmount.value);
  const fromCurrency = inputCurrency.value;
  const toCurrency = outputCurrency.value;

  clearErrors();

  if (!amount || amount <= 0) {
    outputAmount.value = '';
    exchangeInfo.textContent = '';
    return;
  }

  if (!fromCurrency || !toCurrency) {
    exchangeInfo.textContent = '';
    return;
  }

  if (fromCurrency === toCurrency) {
    outputAmount.value = amount.toFixed(6);
    exchangeInfo.textContent = '1:1 exchange rate';
    return;
  }

  const exchangeRate = calculateExchangeRate(fromCurrency, toCurrency);

  if (exchangeRate) {
    const output = amount * exchangeRate;
    outputAmount.value = output.toFixed(6);

    // Display exchange rate info
    exchangeInfo.textContent = `1 ${fromCurrency} H ${exchangeRate.toFixed(6)} ${toCurrency}`;
  } else {
    outputAmount.value = '';
    exchangeInfo.textContent = '';
  }
}

// Calculate input amount based on output
function calculateInputAmount() {
  const amount = parseFloat(outputAmount.value);
  const fromCurrency = inputCurrency.value;
  const toCurrency = outputCurrency.value;

  clearErrors();

  if (!amount || amount <= 0) {
    inputAmount.value = '';
    exchangeInfo.textContent = '';
    return;
  }

  if (!fromCurrency || !toCurrency) {
    exchangeInfo.textContent = '';
    return;
  }

  if (fromCurrency === toCurrency) {
    inputAmount.value = amount.toFixed(6);
    exchangeInfo.textContent = '1:1 exchange rate';
    return;
  }

  const exchangeRate = calculateExchangeRate(fromCurrency, toCurrency);

  if (exchangeRate) {
    const input = amount / exchangeRate;
    inputAmount.value = input.toFixed(6);

    // Display exchange rate info
    exchangeInfo.textContent = `1 ${fromCurrency} H ${exchangeRate.toFixed(6)} ${toCurrency}`;
  } else {
    inputAmount.value = '';
    exchangeInfo.textContent = '';
  }
}

// Swap currencies
function swapCurrencies() {
  const tempCurrency = inputCurrency.value;
  const tempAmount = inputAmount.value;

  inputCurrency.value = outputCurrency.value;
  outputCurrency.value = tempCurrency;

  inputAmount.value = outputAmount.value;
  outputAmount.value = tempAmount;

  calculateOutputAmount();
}

// Validation
function validateForm() {
  clearErrors();
  let isValid = true;

  const amount = parseFloat(inputAmount.value);
  const fromCurrency = inputCurrency.value;
  const toCurrency = outputCurrency.value;

  if (!amount || amount <= 0) {
    showError(inputError, 'Please enter a valid amount');
    isValid = false;
  }

  if (!fromCurrency) {
    showError(inputError, 'Please select a token to send');
    isValid = false;
  }

  if (!toCurrency) {
    showError(outputError, 'Please select a token to receive');
    isValid = false;
  }

  if (fromCurrency && toCurrency && fromCurrency === toCurrency) {
    showError(outputError, 'Cannot swap to the same token');
    isValid = false;
  }

  return isValid;
}

// Show error message
function showError(element, message) {
  element.textContent = message;
  element.style.display = 'block';
}

// Clear all error messages
function clearErrors() {
  inputError.textContent = '';
  inputError.style.display = 'none';
  outputError.textContent = '';
  outputError.style.display = 'none';
  successMessage.style.display = 'none';
}

// Simulate backend swap request
async function submitSwap() {
  if (!validateForm()) {
    return;
  }

  // Show loading state
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoader = submitBtn.querySelector('.btn-loader');

  btnText.style.display = 'none';
  btnLoader.style.display = 'flex';
  submitBtn.disabled = true;

  // Simulate API call with 2 second delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Hide loading state
  btnText.style.display = 'inline';
  btnLoader.style.display = 'none';
  submitBtn.disabled = false;

  // Show success message
  successMessage.style.display = 'block';

  // Log the swap details
  console.log('Swap executed:', {
    from: {
      amount: inputAmount.value,
      currency: inputCurrency.value
    },
    to: {
      amount: outputAmount.value,
      currency: outputCurrency.value
    },
    exchangeRate: calculateExchangeRate(inputCurrency.value, outputCurrency.value)
  });

  // Hide success message after 3 seconds
  setTimeout(() => {
    successMessage.style.display = 'none';
  }, 3000);
}

// Event listeners
inputAmount.addEventListener('input', calculateOutputAmount);
inputCurrency.addEventListener('change', calculateOutputAmount);
outputCurrency.addEventListener('change', calculateOutputAmount);
outputAmount.addEventListener('input', calculateInputAmount);

swapDirectionBtn.addEventListener('click', swapCurrencies);

swapForm.addEventListener('submit', (e) => {
  e.preventDefault();
  submitSwap();
});

// Initialize
fetchTokenPrices();
