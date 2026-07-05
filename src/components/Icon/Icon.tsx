import type { ReactNode, SVGProps } from 'react'

type IconName =
  | 'arrowLeft'
  | 'arrowRight'
  | 'bolt'
  | 'check'
  | 'chevronDown'
  | 'close'
  | 'doorUser'
  | 'eye'
  | 'eyeOff'
  | 'home'
  | 'houseUser'
  | 'locationTarget'
  | 'room'
  | 'search'
  | 'star'
  | 'storage'
  | 'user'

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName
}

const paths: Record<IconName, ReactNode> = {
  arrowLeft: <path d="M15.5 5 8.5 12l7 7M9 12h15" />,
  arrowRight: <path d="M8.5 5 15.5 12l-7 7M15 12H0" transform="translate(0 0)" />,
  bolt: <path d="m13 2-8 11h6l-2 9 8-12h-6l2-8Z" />,
  check: <path d="m5 13 4 4L19 7" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  doorUser: (
    <>
      <path d="M14 3h6v18h-6" />
      <path d="M14 7h-3a5 5 0 0 0-5 5v1" />
      <path d="M8.5 7.8a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6Z" />
      <path d="M4 21v-2a4.5 4.5 0 0 1 9 0v2" />
      <path d="M17 12h.01" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2.5 2.5 0 0 0 2.8 2.8" />
      <path d="M9.2 5.4A9.4 9.4 0 0 1 12 5c6 0 9.5 7 9.5 7a15.5 15.5 0 0 1-3.1 4.1" />
      <path d="M6.5 6.9C3.9 8.7 2.5 12 2.5 12s3.5 7 9.5 7a9.5 9.5 0 0 0 4.5-1.1" />
    </>
  ),
  home: (
    <>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10.5V21h13V10.5" />
      <path d="M9.5 21v-6h5v6" />
    </>
  ),
  houseUser: (
    <>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10.5V21h13V10.5" />
      <path d="M9 16.5a3 3 0 0 1 6 0" />
      <path d="M12 12.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z" />
    </>
  ),
  locationTarget: (
    <>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ),
  room: (
    <>
      <path d="M4 5.5 12 2l8 3.5v13L12 22l-8-3.5v-13Z" />
      <path d="M12 2v20M4 5.5l8 3.5 8-3.5" />
      <path d="M8 12h2M14 12h2" />
    </>
  ),
  search: <path d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" />,
  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
  storage: (
    <>
      <path d="M5 5h14v16H5z" />
      <path d="M8 9h8M8 13h8M8 17h8" />
    </>
  ),
  user: (
    <>
      <path d="M20 21a8 8 0 1 0-16 0" />
      <path d="M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" />
    </>
  ),
}

export function Icon({ name, className, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      {...props}
    >
      {paths[name]}
    </svg>
  )
}
