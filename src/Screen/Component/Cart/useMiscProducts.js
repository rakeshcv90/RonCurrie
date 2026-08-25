import { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchMiscData, triggerMiscRefresh, triggerCartRefresh } from '../../../Redux/Slice/CartDataShowSlice';
import { postData } from '../../../utility/ApiCall';
import { Api } from '../../../utility/api';
import { MMKVStorage } from '../../../utility/MmkvStore';

export const useMiscProducts = (reduxMiscList, loading) => {
  const dispatch = useDispatch();
  const [miscList, setMiscList] = useState([
    { id: Date.now(), description: '', price: '', isNegative: false },
  ]);
  const debounceTimerRef = useRef(null);
  const hasSyncedMisc = useRef(false);

  useEffect(() => {
    if (
      reduxMiscList?.miscellaneous &&
      reduxMiscList.miscellaneous.length > 0 &&
      !hasSyncedMisc.current
    ) {
      const formattedMisc = reduxMiscList.miscellaneous.map(item => ({
        id: Date.now() + Math.random(),
        description: item.misc_name || '',
        price: Math.abs(Number(item.misc_value || 0)).toString(),
        isNegative: Number(item.misc_value || 0) < 0,
      }));

      setMiscList(formattedMisc);
      hasSyncedMisc.current = true;
    } else if (
      (!reduxMiscList?.miscellaneous ||
        reduxMiscList.miscellaneous.length === 0) &&
      !hasSyncedMisc.current &&
      !loading
    ) {
      hasSyncedMisc.current = true;
    }
  }, [reduxMiscList, loading]);

  const triggerDebouncedSync = newList => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      syncMiscellaneous(newList);
    }, 1000);
  };

  const syncMiscellaneous = async currentList => {
    const validItems = currentList
      .filter(
        item =>
          item.description.trim() !== '' &&
          item.price !== null &&
          item.price !== undefined &&
          item.price.toString().trim() !== '',
      )
      .map(item => {
        const amount = Math.abs(Number(item.price) || 0);
        return {
          misc_name: item.description.trim(),
          misc_value: item.isNegative ? -amount : amount,
        };
      });

    try {
      const userData = await MMKVStorage.getItem('User_Data');

      const payload = {
        customer_id: userData?.customer_id || 0,
        miscellaneous: validItems.length === 0 ? [] : validItems,
      };

      const response = await postData(Api.ADD_MISC, payload);

      if (response?.data?.success && response?.data?.responseCode === 200) {
        dispatch(fetchMiscData(userData?.customer_id));
        dispatch(triggerMiscRefresh());
        dispatch(triggerCartRefresh());
      }
    } catch (error) {
      console.error('Misc Sync Error:', error);
    }
  };

  const handleAddMisc = () => {
    setMiscList(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        description: '',
        price: '',
        isNegative: false,
      },
    ]);
  };

  const handleChange = (id, field, value) => {
    setMiscList(prev => {
      const newList = prev.map(item => {
        if (item.id !== id) return item;

        let updated = { ...item, [field]: value };

        if (field === 'price') {
          updated.isNegative = value.startsWith('-');
        }

        return updated;
      });

      triggerDebouncedSync(newList);
      return newList;
    });
  };

  const toggleSign = id => {
    setMiscList(prev => {
      const newList = prev.map(item => {
        if (item.id !== id) return item;

        let price = item.price || '';

        if (price.startsWith('-')) {
          price = price.slice(1);
        } else {
          price = '-' + price;
        }

        return {
          ...item,
          price,
          isNegative: price.startsWith('-'),
        };
      });

      triggerDebouncedSync(newList);
      return newList;
    });
  };

  const handleDeleteMisc = id => {
    setMiscList(prev => {
      const newList = prev.filter(item => item.id !== id);
      triggerDebouncedSync(newList);
      return newList;
    });
  };

  return {
    miscList,
    handleAddMisc,
    handleChange,
    toggleSign,
    handleDeleteMisc,
    syncMiscellaneous,
  };
};
