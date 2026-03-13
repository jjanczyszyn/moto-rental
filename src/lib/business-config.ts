// M6-6: Shared Business Config — single source of truth for all business constants

export const BUSINESS_NAME = 'Karen & JJ Motorcycle Rental' as const;
export const MANAGER_NAME = 'Karen Adrana Espinoza Ruiz' as const;
export const MANAGER_WHATSAPP_NUMBER = '+50589750052' as const;
export const MANAGER_WHATSAPP_LINK = 'https://wa.me/50589750052' as const;
export const MAP_LINK = 'https://maps.app.goo.gl/ZCk4z9estajyz2JLA?g_st=ic' as const;

export const PRICING = {
  dailyRateUsd: 20,
  monthlyRateUsd: 400,
  weeklyDiscountPct: 10,
  biweeklyDiscountPct: 18,
  securityDepositUsd: 100,
  insuranceValidUntil: '2026-06-11',
} as const;

export const PAYMENT_METHODS = [
  { type: 'Venmo', handle: '@justina-lydia' },
  { type: 'PayPal', handle: 'justinalydiacuddles@gmail.com' },
  { type: 'Wise', handle: 'https://wise.com/pay/me/justynaj102' },
  { type: 'Cash', handle: '' },
] as const;

export const UNIVERSAL_INCLUSIONS = [
  'Delivery included',
  'Surf rack included',
  '2 helmets included',
] as const;

export const MOTORCYCLES = [
  {
    slug: 'yamaha-xt-125-white',
    name: 'Yamaha XT 125',
    brand: 'Yamaha',
    model: 'XT 125',
    color: 'White',
    transmission: 'Manual',
    imagePath: '/images/yamaha-xt-125-white.jpg',
  },
  {
    slug: 'blue-genesis-click',
    name: 'Blue Genesis Click',
    brand: 'Genesis',
    model: 'Click',
    color: 'Blue',
    transmission: 'Automatic',
    imagePath: '/images/blue-genesis-click.jpg',
  },
  {
    slug: 'pink-genesis-click',
    name: 'Pink Genesis Click',
    brand: 'Genesis',
    model: 'Click',
    color: 'Pink',
    transmission: 'Automatic',
    imagePath: '/images/pink-genesis-click.jpg',
  },
] as const;

export const REVIEW_LINK = '' as const;
