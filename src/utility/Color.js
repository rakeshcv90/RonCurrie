export const STOCK_COLOR_HEX = {
  green: '#c6efce',
  amber: '#fcd5a0',
  red: '#ffc7ce',
  blue: '#bdd7ee',
};

export const getStockColorHex = color => STOCK_COLOR_HEX[color] || undefined;

// Black text — easier to read than white on these light fills.
const STOCK_COLOR_TEXT = {
  green: '#000',
  amber: '#000',
  red: '#000',
  blue: '#000',
};

export const getStockColorTextHex = color =>
  STOCK_COLOR_TEXT[color] || undefined;
