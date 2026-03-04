'use client'

import { usePathname } from 'next/navigation'

export default function BgEffect2() {
  const pathname = usePathname()

  if (pathname === '/aichat') return null

  return (
    <>
      {/* <div className="absolute top-0 right-0 w-[300px] h-[300px] z-[-1] 
    bg-gradient-to-br from-[#FC95FF]/50 via-white/0 to-transparent 
    dark:from-purple-700/50 dark:via-black/0 dark:to-transparent 
    blur-3xl rounded-full pointer-events-none" /> */}
      {/* <div
    className="
      absolute
      w-[180px] h-[260px] sm:w-[220px] sm:h-[320px] md:w-[250px] md:h-[360px] lg:w-[282.5px] lg:h-[407.63px]
      left-1/2 top-[400px] sm:top-[420px] md:top-[440px] lg:left-[939.85px] lg:top-[458.53px]
      -translate-x-1/2
      [background:radial-gradient(24.11%_24.9%_at_77.88%_36.59%,rgba(67,133,239,0.2)_0%,rgba(242,134,219,0)_100%)]
      [transform:matrix(0.69,-0.73,-0.73,-0.69,0,0)]
      pointer-events-none
      z-0
    "
  /> */}



      {/* <div className="absolute inset-0 z-[-1] 
    bg-gradient-to-tr from-[#FC95FF]/50 via-white/0 to-transparent 
    dark:from-purple-800/40 dark:via-black/0 dark:to-transparent 
    blur-2xl" /> */}
      {/* <svg className='absolute bottom-0 left-0 z-[2]' width="717" height="461" viewBox="0 0 717 461" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g opacity="0.3">
            <g filter="url(#filter0_f_432_31328)">
              <path d="M114.914 261.116C177.928 162.654 259.49 26.8098 357.952 89.8231C456.414 152.836 534.491 390.845 471.477 489.307C408.464 587.77 277.562 616.506 179.1 553.493C80.6381 490.48 51.9011 359.578 114.914 261.116Z" fill="url(#paint0_linear_432_31328)" />
            </g>
            <path d="M211.824 283.05C274.837 184.587 356.399 48.7434 454.862 111.757C553.324 174.77 631.4 412.779 568.387 511.241C505.373 609.703 374.472 638.44 276.009 575.427C177.547 512.414 148.81 381.512 211.824 283.05Z" fill="url(#paint1_linear_432_31328)" />
          </g>
          <defs>
            <filter id="filter0_f_432_31328" x="39.0044" y="31.2432" width="497.665" height="598.16" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
              <feFlood flood-opacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="21.25" result="effect1_foregroundBlur_432_31328" />
            </filter>
            <linearGradient id="paint0_linear_432_31328" x1="179.09" y1="553.487" x2="441.575" y2="143.339" gradientUnits="userSpaceOnUse">
              <stop stop-color="#FF95EA" />
              <stop offset="1" stop-color="#F286CC" stop-opacity="0" />
            </linearGradient>
            <linearGradient id="paint1_linear_432_31328" x1="276" y1="575.42" x2="538.484" y2="165.273" gradientUnits="userSpaceOnUse">
              <stop stop-color="#FC95FF" />
              <stop offset="0.285" stop-color="#FC95FF" stop-opacity="0" />
            </linearGradient>
          </defs>
        </svg> */}
      < div className='bg-[#ECF1FB]'></div>
    </>
  )
}
