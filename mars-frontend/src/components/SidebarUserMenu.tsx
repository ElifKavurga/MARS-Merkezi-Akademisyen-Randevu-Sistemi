import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRoleLabel } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { useLogout } from '../hooks/useLogout';
import { getInitials } from '../utils/userDisplay';

type SidebarUserMenuProps = {
  profilePath: string;
  onNavigate?: () => void;
};

export default function SidebarUserMenu({
  profilePath,
  onNavigate,
}: SidebarUserMenuProps) {
  const { user } = useAuth();
  const handleLogout = useLogout();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  if (!user) {
    return null;
  }

  const initials = getInitials(user.fullName) || '?';

  return (
    <div className="relative mt-auto border-t border-white/10 pt-3" ref={rootRef}>
      <button
        type="button"
        className={`admin-sidebar-link w-full border-0 bg-transparent text-left ${
          open ? 'admin-sidebar-link--active' : ''
        }`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
      >
        <span
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 font-label-md text-label-md font-semibold text-white/90"
          aria-hidden="true"
        >
          {initials}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate">{user.fullName}</span>
          <span className="mt-0.5 block truncate text-[12px] font-normal leading-4 opacity-70">
            {user.institutionalEmail}
          </span>
          <span className="mt-0.5 block truncate text-[12px] font-normal leading-4 opacity-55">
            {getRoleLabel(user.role)}
          </span>
        </span>
        <span className="admin-sidebar-icon material-symbols-outlined !text-[20px]" aria-hidden="true">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute bottom-[calc(100%+0.5rem)] left-0 z-50 w-full overflow-hidden rounded-lg border border-white/10 bg-[#0b1641] p-1 shadow-xl"
        >
          <Link
            role="menuitem"
            to={profilePath}
            className="admin-sidebar-link"
            style={{ textDecoration: 'none' }}
            onClick={() => {
              setOpen(false);
              onNavigate?.();
            }}
          >
            <span className="admin-sidebar-icon material-symbols-outlined" aria-hidden="true">
              person
            </span>
            <span>Profili Görüntüle</span>
          </Link>
          <button
            type="button"
            role="menuitem"
            className="admin-sidebar-link w-full border-0 bg-transparent text-left"
            onClick={() => {
              setOpen(false);
              handleLogout();
            }}
          >
            <span className="admin-sidebar-icon material-symbols-outlined" aria-hidden="true">
              logout
            </span>
            <span>Çıkış Yap</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
