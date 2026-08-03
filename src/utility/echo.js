import Echo from 'laravel-echo';
import Pusher from 'pusher-js/react-native';
import { REVERB_KEY, REVERB_HOST, REVERB_PORT } from '@env';

const EchoClass = Echo.default ?? Echo;
const PusherClass = Pusher.Pusher ?? Pusher.default ?? Pusher;
const echo = new EchoClass({
  broadcaster: 'reverb',
  Pusher: PusherClass,
  key: REVERB_KEY,
  wsHost: REVERB_HOST,
  wsPort: Number(REVERB_PORT),
  wssPort: Number(REVERB_PORT),
  forceTLS: true,
  enabledTransports: ['ws', 'wss'],
});

export default echo;
