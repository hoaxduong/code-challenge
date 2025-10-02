# Currency Swap Form

A fully interactive currency swap form built with Vite, allowing users to swap between different cryptocurrency tokens.

## Features

- **Real-time Exchange Rate Calculation**: Automatically calculates exchange rates using live price data from Switcheo API
- **Bidirectional Conversion**: Enter amount in either field (send or receive) and the other updates automatically
- **Token Selection**: Dropdown menus to select from available tokens with prices
- **Swap Direction Button**: Quickly swap the from/to currencies with an animated button
- **Input Validation**:
  - Validates positive amounts
  - Ensures both currencies are selected
  - Prevents swapping to the same token
  - Displays clear error messages
- **Loading State**: Submit button shows a loading spinner during the simulated transaction (2-second delay)
- **Success Feedback**: Displays a success message after swap completion
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Gradient background, smooth animations, and polished styling

## Getting Started

### Installation

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

The app will open automatically at `http://localhost:3000`

### Build

Build for production:

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## How It Works

1. The app fetches token prices from `https://interview.switcheo.com/prices.json`
2. Only tokens with available prices are displayed in the dropdowns
3. Exchange rates are calculated based on USD prices:
   - `Exchange Rate = From Token Price / To Token Price`
4. Users can enter amounts in either field, and the app calculates the corresponding value
5. The swap button swaps the currencies and amounts
6. Upon submission, a 2-second loading state simulates backend processing
7. Swap details are logged to the console

## Token Icons

Token icons are referenced from the Switcheo token icons repository but are not critical for functionality. The form works perfectly without the icons loading.

## Technologies Used

- **Vite**: Build tool and dev server
- **Vanilla JavaScript**: No framework dependencies
- **CSS3**: Modern styling with gradients and animations
- **Fetch API**: For retrieving token price data

## File Structure

```
src/problem2/
├── index.html      # Main HTML structure
├── script.js       # JavaScript logic and API integration
├── style.css       # Styling and animations
└── README.md       # This file
```
