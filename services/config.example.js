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
    apiKey: 'YOUR_API_BIBLE_KEY_HERE',
    baseUrl: 'https://api.scripture.api.bible/v1',

    // Your selected favorites + commonly used versions
    versions: {
      NKJV: '63097d2a0a2f7db3-01',
      MSG: '6f11a7de016f942e-01',
      AMP: 'a81b73293d3080c9-01',
      KJV: 'de4e12af7f28f599-01',
      NIV: '65eec8e0b60e656b-01',
      ESV: '06125adad2d5898a-01',
      NLT: '65eec8e0b60e656b-02',
      ASV: '685d1470fe4d5c3b-01',
      NASB: '0a78c7b95f39a9c4-01',
      CSB: 'a5a127150e5e5533-01',
    },

    versionNames: {
      '63097d2a0a2f7db3-01': 'New King James Version',
      '6f11a7de016f942e-01': 'The Message',
      'a81b73293d3080c9-01': 'Amplified Bible',
      'de4e12af7f28f599-01': 'King James Version',
      '65eec8e0b60e656b-01': 'New International Version',
      '06125adad2d5898a-01': 'English Standard Version',
      '65eec8e0b60e656b-02': 'New Living Translation',
      '685d1470fe4d5c3b-01': 'American Standard Version',
      '0a78c7b95f39a9c4-01': 'New American Standard Bible',
      'a5a127150e5e5533-01': 'Christian Standard Bible',
    },
    PUBLIC_API: {
      baseUrl: 'https://bible-api.com',
      versions: {
        KJV: 'kjv',
        WEB: 'web',
        BBE: 'bbe',
        OEB: 'oeb',
      }
    }
  }
};
