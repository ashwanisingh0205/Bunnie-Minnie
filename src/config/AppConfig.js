// Base URL Configuration
export const BASE_URL = 'https://bunnieandminnie.com';

// Route paths
export const ROUTES = {
  HOME: '/',
  CONTACT: '/pages/contact',
  TRACK_ORDER: '/pages/track-order',
};

// Full URLs
export const URLS = {
  HOME: `${BASE_URL}${ROUTES.HOME}`,
  CONTACT: `${BASE_URL}${ROUTES.CONTACT}`,
  LOGIN: 'https://shopify.com/authentication/97541226808/login?client_id=3b0feb47-f903-4b5d-b512-ca678508114a&locale=en&redirect_uri=%2Fauthentication%2F97541226808%2Foauth%2Fauthorize%3Fclient_id%3D3b0feb47-f903-4b5d-b512-ca678508114a%26consent_id%3D%26locale%3Den%26nonce%3Dbcfec834-d3f4-458c-bf22-a746928ee899%26redirect_uri%3Dhttps%253A%252F%252Fbunnieandminnie.com%252Fcustomer_authentication%252Fcallback%26response_type%3Dcode%26scope%3Dopenid%2Bemail%2Bcustomer-account-api%253Afull%26state%3DhWN7R85atsibzF54CopZD93y&ui_hint=full',
};

// Navigation configuration
export const NAVIGATION_CONFIG = {
  tabs: [
    {
      id: 'home',
      screenName: 'HomeScreen',
      icon: 'home',
      label: 'Home',
      route: URLS.HOME,
    },
    {
      id: 'contact',
      screenName: 'ContactScreen',
      icon: 'contact-mail',
      label: 'Contact',
      route: URLS.CONTACT,
    },
  ],
};
