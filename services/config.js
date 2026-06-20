// services/config.js
// IMPORTANT: In production, use environment variables or secure storage
// For development, we'll use this config file (add to .gitignore!)

export const API_CONFIG = {
  OPENAI: {
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    model: 'gpt-4o',
    maxTokens: 2000,
    temperature: 0.7,
  },
  
  BIBLE_API: {
    // Shifting to bolls.life (Free, no key required)
    baseUrl: 'https://bolls.life',
    
    // Versions available on bolls.life
    versions: {
      NKJV: 'NKJV',
      MSG: 'MSG',
      AMP: 'AMP',
      KJV: 'KJV',
      NIV: 'NIV',
      ESV: 'ESV',
      NLT: 'NLT',
      NASB: 'NASB',
      CSB: 'CSB17',
      ASV: 'ASV',
      WEB: 'WEB',
      RSV: 'RSV',
      CJB: 'CJB',
      GNT: 'GNT',
      NET: 'NET',
      GNV: 'GNV',
      LSV: 'LSV',
      BSB: 'BSB',
      MEV: 'MEV',
      ISV: 'ISV',
      CEVD: 'CEVD',
      GNTD: 'GNTD',
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
      'WEB': 'World English Bible',
      'RSV': 'Revised Standard Version',
      'CJB': 'Complete Jewish Bible',
      'GNT': 'Good News Translation',
      'NET': 'NET Bible',
      'GNV': 'Geneva Bible',
      'LSV': 'Literal Standard Version',
      'BSB': 'Berean Standard Bible',
      'MEV': 'Modern English Version',
      'ISV': 'International Standard Version',
      'CEVD': 'Contemporary English Version',
      'GNTD': 'Good News Translation',
    },

    // Secondary fallback for KJV/WEB
    PUBLIC_API: {
      baseUrl: 'https://bible-api.com',
      versions: {
        KJV: 'kjv',
        WEB: 'web',
      }
    }
  }
};
