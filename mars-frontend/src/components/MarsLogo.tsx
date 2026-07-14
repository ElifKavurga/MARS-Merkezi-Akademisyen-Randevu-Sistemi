import marsLogoAsset from '../assets/images/mars-logo.png';
import { APP_NAME } from '../constants';

type MarsLogoProps = {
  className?: string;
  /** Lightens the official navy wordmark for deep-navy surfaces. */
  onDark?: boolean;
};

const PUBLIC_LOGO_SRC = `${import.meta.env.BASE_URL}images/mars-logo.png`;

export default function MarsLogo({ className = '', onDark = false }: MarsLogoProps) {
  return (
    <img
      src={marsLogoAsset}
      alt={APP_NAME}
      className={['mars-logo', onDark ? 'mars-logo--on-dark' : '', className]
        .filter(Boolean)
        .join(' ')}
      style={
        onDark
          ? {
              filter: 'brightness(0) invert(1)',
              WebkitFilter: 'brightness(0) invert(1)',
            }
          : undefined
      }
      draggable={false}
      decoding="async"
      onError={(event) => {
        const img = event.currentTarget;
        if (img.dataset.fallback === '1') {
          return;
        }
        img.dataset.fallback = '1';
        img.src = PUBLIC_LOGO_SRC;
      }}
    />
  );
}
