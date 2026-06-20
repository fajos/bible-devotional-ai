// services/config.example.js
// COPY THIS FILE TO config.js AND ADD YOUR ACTUAL API KEYS
// IMPORTANT: Never commit config.js to version control!

export const API_CONFIG = {
  OPENAI: {
    apiKey: 'YOUR_OPENAI_API_KEY_HERE',
    model: 'gpt-4o',
    maxTokens: 2000,
    temperature: 0.7,
  },

  BIBLE_API: {
    // bolls.life is a free, keyless API
    baseUrl: 'https://bolls.life',

    // Primary versions for the app
    versions: {
      NKJV: 'NKJV',
      MSG: 'MSG',
      AMP: 'AMP',
      KJV: 'KJV',
      NIV: 'NIV',
      ESV: 'ESV',
      NLT: 'NLT',
      NASB: 'NASB',
      CSB: 'CSB',
      ASV: 'ASV',
    },

    versionNames: {
      'NKJV': 'New King James Version',
      'MSG': 'The Message',
      'AMP': 'Amplified Bible',
      'KJV': 'King James Version',
      'NIV': 'New International Version',
      'ESV': 'English Standard Version',
      'NLT': 'New Living Translation',
      'NASB': 'New American Standard Bible',
      'CSB': 'Christian Standard Bible',
      'ASV': 'American Standard Version',
    },

    // Secondary fallback for public domain versions
    PUBLIC_API: {
      baseUrl: 'https://bible-api.com',
      versions: {
        KJV: 'kjv',
        WEB: 'web',
      }
    }
  }
};
