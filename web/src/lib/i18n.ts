import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      common: {
        loading: 'Loading...',
        error: 'Error',
      },
      auth: {
        login: 'Log In',
        register: 'Register',
      },
      landing: {
        hero: {
          title: 'Professional Stock Trading Made Simple',
          description: 'A secure, integrated platform for individual traders and brokerage firms. Experience real-time trading with advanced portfolio management.',
          getStarted: 'Get Started',
          learnMore: 'Learn More',
        },
        features: {
          title: 'Why Choose Our Platform',
          realtime: {
            title: 'Real-Time Data',
            description: 'Access live market data, advanced charts, and instant trade execution.',
          },
          security: {
            title: 'Secure Trading',
            description: 'Enterprise-grade security with multi-factor authentication and encrypted transactions.',
          },
          multiRole: {
            title: 'Multi-Role Access',
            description: 'Customized access levels for individuals, brokers, and administrators.',
          },
          global: {
            title: 'Global Trading',
            description: 'Access markets worldwide with support for multiple currencies and exchanges.',
          },
        },
        benefits: {
          title: 'Platform Benefits',
          security: {
            title: 'Advanced Security',
            description: 'State-of-the-art security measures to protect your assets and data.',
          },
          integration: {
            title: 'Easy Integration',
            description: 'Seamlessly connect with existing brokerage systems and workflows.',
          },
          support: {
            title: '24/7 Support',
            description: 'Round-the-clock customer support and technical assistance.',
          },
        },
        cta: {
          title: 'Ready to Start Trading?',
          description: 'Join thousands of traders and brokerages who trust our platform for their trading needs.',
          button: 'Create Account',
        },
      },
      footer: {
        company: 'Company',
        about: 'About Us',
        contact: 'Contact',
        careers: 'Careers',
        platform: 'Platform',
        features: 'Features',
        pricing: 'Pricing',
        security: 'Security',
        resources: 'Resources',
        documentation: 'Documentation',
        api: 'API',
        support: 'Support',
        legal: 'Legal',
        privacy: 'Privacy Policy',
        terms: 'Terms of Service',
        compliance: 'Compliance',
        rights: 'All rights reserved.',
      },
      portfolio: {
        summary: 'Portfolio Summary',
        totalValue: 'Total Value',
        dayChange: 'Day Change',
        dayChangePercent: 'Day Change %',
        positions: 'Positions',
        holdings: 'Holdings',
        performance: 'Performance',
        recentTrades: 'Recent Trades',
      },
      trade: {
        newOrder: 'New Trade Order',
        symbol: 'Symbol',
        side: {
          buy: 'Buy',
          sell: 'Sell',
        },
        type: {
          market: 'Market',
          limit: 'Limit',
          stop: 'Stop',
        },
        status: {
          pending: 'Pending',
          completed: 'Completed',
          rejected: 'Rejected',
          cancelled: 'Cancelled',
        },
        quantity: 'Quantity',
        price: 'Price',
        limitPrice: 'Limit Price',
        stopPrice: 'Stop Price',
        date: 'Date',
        submit: 'Submit Order',
        noTrades: 'No recent trades',
      },
      documents: {
        title: 'Documents',
        filter: 'Filter',
        type: 'Type',
        allTypes: 'All Types',
        statement: 'Statement',
        confirmation: 'Trade Confirmation',
        tax: 'Tax Document',
        year: 'Year',
        allYears: 'All Years',
        period: 'Period',
        allPeriods: 'All Periods',
        date: 'Date',
        description: 'Description',
        action: 'Action',
        download: 'Download',
        noDocuments: 'No documents found',
      },
    },
  },
  am: {
    translation: {
      common: {
        loading: 'በመጫን ላይ...',
        error: 'ስህተት',
      },
      auth: {
        login: 'ግባ',
        register: 'ተመዝገብ',
      },
      landing: {
        hero: {
          title: 'ፕሮፌሽናል የአክሲዮን ንግድ ቀላል ሆኗል',
          description: 'ለግለሰብ ነጋዴዎች እና ለብሮከር ኩባንያዎች የተዘጋጀ ደህንነቱ የተጠበቀ እና ተቀናጅቶ የሚሰራ መድረክ። በላቀ የፖርትፎሊዮ አስተዳደር ከእውነተኛ ጊዜ ንግድ ጋር ይሞክሩ።',
          getStarted: 'አሁኑኑ ይጀምሩ',
          learnMore: 'ተጨማሪ ይወቁ',
        },
        features: {
          title: 'የእኛን መድረክ የሚመርጡበት ምክንያት',
          realtime: {
            title: 'የቀጥታ ስርጭት ዳታ',
            description: 'የቀጥታ ስርጭት የገበያ መረጃ፣ የላቀ ቻርቶች እና ፈጣን የንግድ አፈጻጸም።',
          },
          security: {
            title: 'ደህንነቱ የተጠበቀ ንግድ',
            description: 'በባለብዙ ደረጃ ማረጋገጫ እና በተመሰጠሩ ግብይቶች የድርጅት ደረጃ ደህንነት።',
          },
          multiRole: {
            title: 'ባለብዙ ሚና ተደራሽነት',
            description: 'ለግለሰቦች፣ ለብሮከሮች እና ለአስተዳዳሪዎች የተበጀ የተደራሽነት ደረጃዎች።',
          },
          global: {
            title: 'ዓለም አቀፍ ንግድ',
            description: 'በብዙ ምንዛሬዎች እና ገበያዎች ድጋፍ ዓለም አቀፍ ገበያዎችን ያግኙ።',
          },
        },
        benefits: {
          title: 'የመድረኩ ጥቅሞች',
          security: {
            title: 'የላቀ ደህንነት',
            description: 'ንብረትዎን እና ዳታዎን ለመጠበቅ ዘመናዊ የደህንነት እርምጃዎች።',
          },
          integration: {
            title: 'ቀላል ውህደት',
            description: 'ከነባር የብሮከር ስርዓቶች እና የስራ ፍሰቶች ጋር በቀላሉ ይገናኙ።',
          },
          support: {
            title: '24/7 ድጋፍ',
            description: 'ሰዓቱን ሙሉ የደንበኞች ድጋፍ እና ቴክኒካል እርዳታ።',
          },
        },
        cta: {
          title: 'ንግድ ለመጀመር ዝግጁ ነዎት?',
          description: 'ለንግድ ፍላጎታቸው መድረካችንን የሚያምኑ ሺዎች ነጋዴዎችን እና ብሮከሮችን ይቀላቀሉ።',
          button: 'መለያ ይፍጠሩ',
        },
      },
      footer: {
        company: 'ኩባንያ',
        about: 'ስለ እኛ',
        contact: 'አግኙን',
        careers: 'ሥራዎች',
        platform: 'መድረክ',
        features: 'ባህሪያት',
        pricing: 'ዋጋ አወሳሰን',
        security: 'ደህንነት',
        resources: 'ሀብቶች',
        documentation: 'ሰነዶች',
        api: 'API',
        support: 'ድጋፍ',
        legal: 'ሕጋዊ',
        privacy: 'የግላዊነት ፖሊሲ',
        terms: 'የአገልግሎት ውሎች',
        compliance: 'ሕጋዊ ተገዢነት',
        rights: 'ኩሉ መሰል ዝተሓለወ እዩ።',
      },
      portfolio: {
        summary: 'Portfolio Summary',
        totalValue: 'Total Value',
        dayChange: 'Day Change',
        dayChangePercent: 'Day Change %',
        positions: 'Positions',
        holdings: 'Holdings',
        performance: 'Performance',
        recentTrades: 'Recent Trades',
      },
      trade: {
        newOrder: 'New Trade Order',
        symbol: 'Symbol',
        side: {
          buy: 'Buy',
          sell: 'Sell',
        },
        type: {
          market: 'Market',
          limit: 'Limit',
          stop: 'Stop',
        },
        status: {
          pending: 'Pending',
          completed: 'Completed',
          rejected: 'Rejected',
          cancelled: 'Cancelled',
        },
        quantity: 'Quantity',
        price: 'Price',
        limitPrice: 'Limit Price',
        stopPrice: 'Stop Price',
        date: 'Date',
        submit: 'Submit Order',
        noTrades: 'No recent trades',
      },
      documents: {
        title: 'Documents',
        filter: 'Filter',
        type: 'Type',
        allTypes: 'All Types',
        statement: 'Statement',
        confirmation: 'Trade Confirmation',
        tax: 'Tax Document',
        year: 'Year',
        allYears: 'All Years',
        period: 'Period',
        allPeriods: 'All Periods',
        date: 'Date',
        description: 'Description',
        action: 'Action',
        download: 'Download',
        noDocuments: 'No documents found',
      },
    },
  },
  om: {
    translation: {
      common: {
        loading: 'Fe\'aa jira...',
        error: 'Dogoggora',
      },
      auth: {
        login: 'Seeni',
        register: 'Galmaa\'i',
      },
      landing: {
        hero: {
          title: 'Daldalii Share Ogummaan Laafame',
          description: 'Daldaltootaafi dhaabbilee daldalaa platformii nagaa qabuufi walitti hidhamedha. Bulchiinsa portfoliyoo cimaa wajjin daldalii yeroo dhugaa hordofaa.',
          getStarted: 'Jalqabi',
          learnMore: 'Dabalata Baradhu',
        },
        features: {
          title: 'Maaliif Platformii Keenya Filattan',
          realtime: {
            title: 'Ragaa Yeroo Dhugaa',
            description: 'Ragaa gabaa yeroo dhugaa, chaartii cimaa, raawwii daldalaa ariifachiisaa argadhu.',
          },
          security: {
            title: 'Daldalii Nagaa',
            description: 'Nageenya sadarkaa dhaabbataa mirkanaa\'ina sadarkaa hedduu fi daldalii encrypted qabu.',
          },
          multiRole: {
            title: 'Gahee Hedduu',
            description: 'Sadarkaalee argama dhuunfaa, daldaltoota, fi bulchitootaaf qophaa\'e.',
          },
          global: {
            title: 'Daldalii Addunyaa',
            description: 'Gabaa addunyaa saraara qarshii fi gabaa hedduu wajjin argadhu.',
          },
        },
        benefits: {
          title: 'Bu\'aalee Platformii',
          security: {
            title: 'Nageenya Cimaa',
            description: 'Tarkaanfilee nageenya yeroo ammaa qabeenyaafi ragaa keessan eeguuf.',
          },
          integration: {
            title: 'Walitti Makuu Laafaa',
            description: 'Sirnaalee daldalaa fi hojii jiranii waliin salphaatti walitti hidhama.',
          },
          support: {
            title: 'Deeggarsa 24/7',
            description: 'Deeggarsa maamilaa fi gargaarsa teeknikaa yeroo hundaa.',
          },
        },
        cta: {
          title: 'Daldaluuf Qophii dha?',
          description: 'Daldaltootaafi dhaabbilee daldalaa kuma hedduun platformii keenyatti amananii waliin ta\'i.',
          button: 'Herrega Uumi',
        },
      },
      footer: {
        company: 'Dhaabbata',
        about: 'Waa\'ee Keenya',
        contact: 'Nu Quunnamaa',
        careers: 'Carraa Hojii',
        platform: 'Platformii',
        features: 'Amaloota',
        pricing: 'Gatii',
        security: 'Nageenya',
        resources: 'Qabeenya',
        documentation: 'Dookimentii',
        api: 'API',
        support: 'Deeggarsa',
        legal: 'Seeraa',
        privacy: 'Imaammata Dhuunfaa',
        terms: 'Waliigaltee Tajaajilaa',
        compliance: 'Eegumsa Seeraa',
        rights: 'Mirgi hunduu seeraan kan eegame.',
      },
      portfolio: {
        summary: 'Portfolio Summary',
        totalValue: 'Total Value',
        dayChange: 'Day Change',
        dayChangePercent: 'Day Change %',
        positions: 'Positions',
        holdings: 'Holdings',
        performance: 'Performance',
        recentTrades: 'Recent Trades',
      },
      trade: {
        newOrder: 'New Trade Order',
        symbol: 'Symbol',
        side: {
          buy: 'Buy',
          sell: 'Sell',
        },
        type: {
          market: 'Market',
          limit: 'Limit',
          stop: 'Stop',
        },
        status: {
          pending: 'Pending',
          completed: 'Completed',
          rejected: 'Rejected',
          cancelled: 'Cancelled',
        },
        quantity: 'Quantity',
        price: 'Gatii',
        limitPrice: 'Gatii Daangaa',
        stopPrice: 'Gatii Dhaabii',
        date: 'Guyyaa',
        submit: 'Ajaja Galchi',
        noTrades: 'Daldaliin dhiyoo hin jiru',
      },
      documents: {
        title: 'Sanadoota',
        filter: 'Calleessi',
        type: 'Gosa',
        allTypes: 'Gosota Hunda',
        statement: 'Ibsa',
        confirmation: 'Mirkaneessa Daldalaa',
        tax: 'Sanadii Taaksii',
        year: 'Waggaa',
        allYears: 'Waggoota Hunda',
        period: 'Yeroo',
        allPeriods: 'Yeroo Hunda',
        date: 'Guyyaa',
        description: 'Ibsa',
        action: 'Gocha',
        download: 'Buusi',
        noDocuments: 'Sanadni hin argamne',
      },
    },
  },
  ti: {
    translation: {
      common: {
        loading: 'ይጽዓን ኣሎ...',
        error: 'ጌጋ',
      },
      auth: {
        login: 'እቶ',
        register: 'ተመዝገብ',
      },
      landing: {
        hero: {
          title: 'ፕሮፈሽናል ምክያድ ንግዲ ኣክስዮን ቀሊል ኮይኑ',
          description: 'ንውልቀ ነጋዶታትን ናይ ብሮከር ትካላትን ውሑስን ዝተወሃሃደን መድረኽ። ምስ ዝማዕበለ ምሕደራ ፖርትፎሊዮ ናይ ሓቂ ግዜ ንግዲ ይፈትኑ።',
          getStarted: 'ጀምር',
          learnMore: 'ተወሳኺ ፍለጥ',
        },
        features: {
          title: 'ንምንታይ ነዚ መድረኽና ትመርጹ',
          realtime: {
            title: 'ናይ ሓቂ ግዜ ሓበሬታ',
            description: 'ናይ ሓቂ ግዜ ናይ ዕዳጋ ሓበሬታ፣ ዝማዕበለ ቻርትታትን ቅልጡፍ ፈጻሚ ንግድን።',
          },
          security: {
            title: 'ውሑስ ንግዲ',
            description: 'ብብዙሕ ደረጃ መረጋገጺን ዝተመስጠሩ ንግድታትን ናይ ትካል ደረጃ ውሕስነት።',
          },
          multiRole: {
            title: 'ብዙሕ ተራ ምብጻሕ',
            description: 'ንውልቀሰባት፣ ብሮከራትን ኣመሓደርትን ዝተዳለወ ደረጃታት ምብጻሕ።',
          },
          global: {
            title: 'ዓለምለኻዊ ንግዲ',
            description: 'ብብዙሓት ባጤታታትን ዕዳጋታትን ደገፍ ዓለምለኻዊ ዕዳጋታት ይርከቡ።',
          },
        },
        benefits: {
          title: 'ጥቕምታት መድረኽ',
          security: {
            title: 'ዝማዕበለ ውሕስነት',
            description: 'ንብረትኩምን ሓበሬታኹምን ንምሕላው ዘመናዊ ስጉምትታት ውሕስነት።',
          },
          integration: {
            title: 'ቀሊል ውህደት',
            description: 'ምስ ዘለዉ ናይ ብሮከር ስርዓታትን ናይ ስራሕ ፍሰታትን ብቐሊሉ ይራኸቡ።',
          },
          support: {
            title: '24/7 ደገፍ',
            description: 'መዓልቲ ምሉእ ናይ ዓማዊል ደገፍን ተክኒካዊ ሓገዝን።',
          },
        },
        cta: {
          title: 'ንንግዲ ድሉው ዲኻ?',
          description: 'ንናይ ንግዲ ድልየቶም ነዚ መድረኽና ዝኣምንዎ ኣሽሓት ነጋዶታትን ብሮከራትን ተሓወስ።',
          button: 'ኣካውንት ፍጠር',
        },
      },
      footer: {
        company: 'ኩባንያ',
        about: 'ብዛዕባና',
        contact: 'ርኸቡና',
        careers: 'ስራሕ',
        platform: 'መድረኽ',
        features: 'ባህርያት',
        pricing: 'ዋጋ',
        security: 'ውሕስነት',
        resources: 'ጸጋታት',
        documentation: 'ሰነዳት',
        api: 'API',
        support: 'ደገፍ',
        legal: 'ሕጋዊ',
        privacy: 'ፖሊሲ ውልቃዊ',
        terms: 'ውዕላት ኣገልግሎት',
        compliance: 'ምትግባር ሕጊ',
        rights: 'ኩሉ መሰል ዝተሓለወ እዩ።',
      },
      portfolio: {
        summary: 'Portfolio Summary',
        totalValue: 'Total Value',
        dayChange: 'Day Change',
        dayChangePercent: 'Day Change %',
        positions: 'Positions',
        holdings: 'Holdings',
        performance: 'Performance',
        recentTrades: 'Recent Trades',
      },
      trade: {
        newOrder: 'New Trade Order',
        symbol: 'Symbol',
        side: {
          buy: 'Buy',
          sell: 'Sell',
        },
        type: {
          market: 'Market',
          limit: 'Limit',
          stop: 'Stop',
        },
        status: {
          pending: 'Pending',
          completed: 'Completed',
          rejected: 'Rejected',
          cancelled: 'Cancelled',
        },
        quantity: 'Quantity',
        price: 'Price',
        limitPrice: 'Limit Price',
        stopPrice: 'Stop Price',
        date: 'Date',
        submit: 'Submit Order',
        noTrades: 'No recent trades',
      },
      documents: {
        title: 'Documents',
        filter: 'Filter',
        type: 'Type',
        allTypes: 'All Types',
        statement: 'Statement',
        confirmation: 'Trade Confirmation',
        tax: 'Tax Document',
        year: 'Year',
        allYears: 'All Years',
        period: 'Period',
        allPeriods: 'All Periods',
        date: 'Date',
        description: 'Description',
        action: 'Action',
        download: 'Download',
        noDocuments: 'No documents found',
      },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    supportedLngs: ['en', 'am', 'om', 'ti'],
  });

export default i18n; 