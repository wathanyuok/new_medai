// tailwind.config.js
import typography from '@tailwindcss/typography';

const config = {
    theme: {
      extend: {
        borderImage: {
          'gradient': 'linear-gradient(to right, #4385EF, #FF68F5) 1',
        },  
        keyframes: {
          pulseCustom: {
            '0%, 100%': { opacity: 1, backgroundColor: '#60a5fa' }, // blue-400
            '50%': { opacity: 0.5, backgroundColor: '#3b82f6' }, 
          },
        },
        boxShadow: {
          'deep': '14px 27px 45px rgba(112, 144, 176, 0.2)',
        },
      },
    },
    plugins: [
      typography,
    ]
  };

export default config;
  