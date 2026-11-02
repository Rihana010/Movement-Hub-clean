"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { SupabaseSignOutButton } from "@/components/SupabaseSignOutButton";
import { Wordmark } from "@/components/Wordmark";

type NavbarClientProps = {
  name: string | null;
  email: string | null;
  role: string | null;
  signedIn: boolean;
};

function initials(name: string | null, email: string | null) {
  const source = name || email || "?";
  const words = source.trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? `${words[0][0]}${words[1][0]}` : source.slice(0, 2))
    .toUpperCase();
}

function firstName(name: string | null, email: string | null) {
  return (name || email || "Account").trim().split(/\s+/)[0];
}

function isActive(pathname: string, href: string) {
  return href === "/map" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function isDashboardActive(pathname: string) {
  return pathname === "/admin";
}

export function NavbarClient({
  name,
  email,
  role,
  signedIn,
}: NavbarClientProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const roleLabel = role === "super_admin"
    ? "SUPER ADMIN"
    : role === "event_admin"
      ? "EVENT ADMIN"
      : "MOVEMENT HUB ACCOUNT";
  const profileLabel = role ? "My profile" : "My profile";

  return (
    <nav ref={menuRef} className="mh-navbar" aria-label="Primary">
      <div className="mh-navbar__inner">
        <Wordmark />

        <div className="mh-navbar__desktop">
          <div className="mh-navbar__links" aria-label="Main navigation">
            <Link
              href="/map"
              onClick={() => setOpen(false)}
              className={`mh-navbar__link${isActive(pathname, "/map") ? " is-active" : ""}`}
            >
              Heat Map
            </Link>
            {role ? (
              <>
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className={`mh-navbar__link${isDashboardActive(pathname) ? " is-active" : ""}`}
                >
                  Dashboard
                </Link>
                {role === "super_admin" && (
                  <Link
                    href="/admin/users"
                    onClick={() => setOpen(false)}
                    className={`mh-navbar__link${isActive(pathname, "/admin/users") ? " is-active" : ""}`}
                  >
                    Admins
                  </Link>
                )}
              </>
            ) : signedIn ? (
              <Link
                href="/missions"
                onClick={() => setOpen(false)}
                className={`mh-navbar__link${isActive(pathname, "/missions") ? " is-active" : ""}`}
              >
                My events
              </Link>
            ) : (
              <Link href="/?signin=1" onClick={() => setOpen(false)} className="mh-navbar__link">
                Admin sign in
              </Link>
            )}
          </div>
          <div className="mh-navbar__account">
            {signedIn ? (
              <>
                <button
                  type="button"
                  className="mh-navbar__account-trigger"
                  aria-expanded={open}
                  aria-haspopup="menu"
                  onClick={() => setOpen((current) => !current)}
                >
                  <span className="mh-navbar__avatar" aria-hidden="true">
                    {initials(name, email)}
                  </span>
                  <span className="mh-navbar__first-name">{firstName(name, email)}</span>
                  <span className={`mh-navbar__chevron${open ? " is-open" : ""}`} aria-hidden="true">
                    ↓
                  </span>
                </button>
                {open && (
                  <div className="mh-navbar__dropdown" role="menu">
                    <span className="mh-navbar__role technical-label">{roleLabel}</span>
                    <Link href="/profile" role="menuitem" onClick={() => setOpen(false)}>{profileLabel}</Link>
                    {role ? <AdminLogoutButton /> : <SupabaseSignOutButton />}
                  </div>
                )}
              </>
            ) : (
              <Link href="/?signin=1" className="mh-navbar__sign-in">
                Sign in
              </Link>
            )}
          </div>
        </div>

        <button
          type="button"
          className={`mh-navbar__mobile-trigger${signedIn ? " is-avatar" : ""}`}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          {signedIn ? (
            <span className="mh-navbar__avatar" aria-hidden="true">{initials(name, email)}</span>
          ) : (
            <span className="mh-navbar__menu-icon" aria-hidden="true"><i /><i /><i /></span>
          )}
        </button>
      </div>

      {open && (
        <div className="mh-navbar__mobile-panel">
          <div className="mh-navbar__mobile-links">
            <Link href="/map" onClick={() => setOpen(false)} className={isActive(pathname, "/map") ? "is-active" : ""}>Heat Map</Link>
            {role ? (
              <>
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className={isDashboardActive(pathname) ? "is-active" : ""}
                >
                  Dashboard
                </Link>
                {role === "super_admin" && (
                  <Link
                    href="/admin/users"
                    onClick={() => setOpen(false)}
                    className={isActive(pathname, "/admin/users") ? "is-active" : ""}
                  >
                    Admins
                  </Link>
                )}
              </>
            ) : signedIn ? (
              <Link
                href="/missions"
                onClick={() => setOpen(false)}
                className={isActive(pathname, "/missions") ? "is-active" : ""}
              >
                My events
              </Link>
            ) : (
              <Link href="/?signin=1" onClick={() => setOpen(false)} className="">
                Admin sign in
              </Link>
            )}
          </div>
          <div className="mh-navbar__mobile-account">
            {signedIn ? (
              <>
                <span className="mh-navbar__role technical-label">{roleLabel}</span>
                <Link href="/profile" onClick={() => setOpen(false)}>My profile</Link>
                {role ? <AdminLogoutButton /> : <SupabaseSignOutButton />}
              </>
            ) : (
              <Link href="/?signin=1" className="mh-navbar__sign-in">Sign in</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
