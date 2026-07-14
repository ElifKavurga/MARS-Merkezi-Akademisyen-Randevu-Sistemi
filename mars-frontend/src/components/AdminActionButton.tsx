import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type AdminActionVariant = 'primary' | 'danger' | 'neutral';

type AdminActionButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  variant?: AdminActionVariant;
  icon?: string;
  children: ReactNode;
};

export default function AdminActionButton({
  variant = 'primary',
  icon,
  children,
  className = '',
  type = 'button',
  ...rest
}: AdminActionButtonProps) {
  return (
    <button
      type={type}
      className={['mars-action-btn', `mars-action-btn--${variant}`, className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {icon ? (
        <span className="material-symbols-outlined" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  );
}
