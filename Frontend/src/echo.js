import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const isHttps = window.location.protocol === 'https:';

const echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY || 'voxmankey',
    wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? (isHttps ? 443 : 8080),
    wssPort: import.meta.env.VITE_REVERB_PORT ?? (isHttps ? 443 : 8080),
    forceTLS: isHttps || (import.meta.env.VITE_REVERB_SCHEME === 'https'),
    enabledTransports: ['ws', 'wss'],
});

export default echo;
