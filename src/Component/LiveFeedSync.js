import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import echo from '../utility/echo';
import * as Keychain from 'react-native-keychain';
import { setLiveFeedData } from '../Redux/Slice/LiveFeedSlice';

const ECHO_CHANNEL = 'cart-live-feed';
const ECHO_EVENT = '.cart.updated';

const LiveFeedSync = () => {
  const dispatch = useDispatch();
  const activeChannelRef = useRef(null);
  const lastTokenRef = useRef(null);

  useEffect(() => {
    const checkAndConnect = async () => {
      try {
        const credentials = await Keychain.getGenericPassword();
        const token = credentials ? credentials.password : '';

        if (token === lastTokenRef.current) return;
        lastTokenRef.current = token;

        if (activeChannelRef.current) {
          activeChannelRef.current.stopListening(ECHO_EVENT);
          activeChannelRef.current = null;
        }

        if (token) {
          const channel = echo.channel(ECHO_CHANNEL);
          activeChannelRef.current = channel;

          channel.listen(ECHO_EVENT, payload => {
            const data = payload?.data || payload;
            if (data) {
              dispatch(setLiveFeedData(data));
            }
          });
        }
      } catch (err) {
        console.error('[Global Sync] Connection check error:', err);
      }
    };

    checkAndConnect();
    const interval = setInterval(checkAndConnect, 4000);

    return () => {
      clearInterval(interval);
      if (activeChannelRef.current) {
        activeChannelRef.current.stopListening(ECHO_EVENT);
      }
    };
  }, [dispatch]);

  return null;
};

export default LiveFeedSync;
