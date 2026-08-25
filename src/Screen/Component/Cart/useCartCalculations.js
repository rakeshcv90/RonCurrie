import { useMemo, useCallback } from 'react';

export const useCartCalculations = (cartList, miscList) => {
  const calculateMatrixPrice = useCallback(item => {
    const { matrix, additional_option, cart_quantity } = item;
    const additionalOptionArray = JSON.parse(additional_option || '[]');

    if (!matrix || matrix?.length === 0) {
      let customOptionPrice = 0;
      let parsedOption;

      try {
        parsedOption = JSON.parse(additional_option || '[]');
      } catch {
        parsedOption = [];
      }

      if (
        parsedOption &&
        !Array.isArray(parsedOption) &&
        Object.keys(parsedOption).length > 0
      ) {
        const firstValue = Object.values(parsedOption)[0];
        if (typeof firstValue === 'string' && firstValue?.includes('#')) {
          const parts = firstValue?.split('#');

          const middleValue = firstValue.split('#')[2];
          const secondValue = firstValue.split('#')[1];
          const totalPriceNumber =
            (Number(secondValue) || 0) *
            (Number(item?.options?.[0]?.bespoke_factor_val) || 0) *
            (Number(item?.cart_quantity) || 0);

          customOptionPrice = totalPriceNumber || 0;
        } else {
          const price = item?.options?.[0]?.values?.[0]?.price;
          const basePrice = item?.price;
          const finalPrice = price > 0 ? price : basePrice;

          customOptionPrice = Number(finalPrice) * cart_quantity || 0;
        }
      }
      // Case 2: parsedOption is array (like [])
      else if (Array.isArray(parsedOption) && parsedOption?.length === 0) {
        customOptionPrice = Number(item?.price) * cart_quantity || 0;
      }

      return customOptionPrice;
    }

    let optionData = {};
    try {
      optionData = JSON.parse(additional_option);
    } catch (e) {
      optionData = {};
    }

    const values = Object.values(optionData)
      .map(Number)
      .filter(v => !isNaN(v));

    const [width, height] = values.map(v => Math.floor(parseFloat(v)));

    let matched = matrix.find(m => m.width === width && m.height === height);

    if (!matched) {
      const largerMatches = matrix.filter(
        m => m.width >= width && m.height >= height,
      );

      if (largerMatches.length > 0) {
        matched = largerMatches.sort(
          (a, b) =>
            a.width -
            width +
            (a.height - height) -
            (b.width - width + (b.height - height)),
        )[0];
      } else {
        matched = matrix.sort(
          (a, b) => b.width - a.width || b.height - a.height,
        )[0];
      }
    }

    const matrixPrice = Number(matched?.price || 0);

    return matrixPrice * (cart_quantity || 1);
  }, []);

  const totalPrice = useMemo(() => {
    const subTotal = (cartList || []).reduce((sum, item) => {
      const price = calculateMatrixPrice(item);
      return item.mode === 1 || item.mode === 2 ? sum - price : sum + price;
    }, 0);

    const miscTotal = (miscList || []).reduce((sum, misc) => {
      const amt = parseFloat(misc.price) || 0;
      return sum + amt;
    }, 0);

    return (subTotal + miscTotal).toFixed(2);
  }, [cartList, miscList, calculateMatrixPrice]);

  const hasInvalidQuantity = useMemo(() => {
    if (!cartList || cartList.length === 0) return false;
    return cartList.some(item => {
      const { matrix, additional_option, cart_quantity, mode } = item;
      if (mode === 1 || mode === 2) return false;
      let parsedOption;
      try {
        parsedOption = JSON.parse(additional_option || '[]');
      } catch {
        parsedOption = [];
      }
      
      let availableQty = 0;
      if (!matrix || matrix?.length === 0) {
        if (
          parsedOption &&
          !Array.isArray(parsedOption) &&
          Object.keys(parsedOption).length > 0
        ) {
          const firstValue = Object.values(parsedOption)[0];
          if (typeof firstValue === 'string' && firstValue.includes('#')) {
            availableQty = item?.quantity || 0;
          } else {
            availableQty = item?.options?.[0]?.values?.[0]?.quantity || 0;
          }
        } else {
          availableQty = item?.quantity || 0;
        }
      } else {
        availableQty = item?.quantity || 0;
      }
      return cart_quantity > availableQty;
    });
  }, [cartList]);

  return { calculateMatrixPrice, totalPrice, hasInvalidQuantity };
};
