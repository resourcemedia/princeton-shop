import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import CartButton from "./CartButton.jsx";

// Matches princetonanalytical.com's top nav gradient (sampled from the
// Webflow site's color-band background image) and logo/nav assets, so the
// shop subdomain reads as the same site rather than a separate app.
const NAV_GRADIENT = "linear-gradient(90deg, #27c2f0 0%, #1357a7 100%)";
const NAV_FONT = "'Open Sans', sans-serif";
const PHONE_FONT = "'Montserrat', sans-serif";

const DESKTOP_LOGO =
  "https://cdn.prod.website-files.com/67f4422a13e7899c785a3155/684895af1a2ca8be30cdbfd2_princeton-analytical-logo-top-1.png";
const MOBILE_LOGO =
  "https://cdn.prod.website-files.com/67f4422a13e7899c785a3155/684adfc258377509e0de7630_princeton-analytical-logo-mobile.png";
const FB_ICON =
  "https://cdn.prod.website-files.com/67f4422a13e7899c785a3155/68473b0af61cc945d3398b02_princeton-analytical-social-fb.svg";
const IG_ICON =
  "https://cdn.prod.website-files.com/67f4422a13e7899c785a3155/69122df3e501ef7e2d7672c8_princeton-analytical-social-in.svg";

const NAV_LINKS = [
  { label: "Home", href: "https://www.princetonanalytical.com/" },
  { label: "Our Lab", href: "https://www.princetonanalytical.com/our-lab/about-us" },
  { label: "Services", href: "https://www.princetonanalytical.com/watertestingservices" },
  { label: "Water Quiz", to: "/quiz" },
  { label: "Analytes", href: "https://www.princetonanalytical.com/analytes" },
  { label: "Shop Tests", to: "/shop" },
  { label: "FAQ", href: "https://www.princetonanalytical.com/faq" },
  { label: "Blog", href: "https://www.princetonanalytical.com/blog" },
  { label: "Contact", href: "https://www.princetonanalytical.com/contact" },
];

function NavItem({ link, onClick, mobile }) {
  const base = mobile
    ? "block w-full px-3 py-2.5 text-[15px] border-b border-white/25 last:border-b-0"
    : "px-2.5 py-1.5 text-[15px] whitespace-nowrap";
  const className = `text-white hover:text-white/80 transition-colors ${base}`;

  if (link.to) {
    return (
      <NavLink
        to={link.to}
        onClick={onClick}
        className={({ isActive }) =>
          `${className} ${isActive ? "font-bold underline underline-offset-4" : ""}`
        }
      >
        {link.label}
      </NavLink>
    );
  }

  return (
    <a href={link.href} onClick={onClick} className={className}>
      {link.label}
    </a>
  );
}

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header style={{ fontFamily: NAV_FONT }}>
      <div style={{ background: NAV_GRADIENT }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-5 flex items-center justify-between">
          <nav className="hidden lg:flex items-center flex-wrap py-2.5">
            {NAV_LINKS.map((link) => (
              <NavItem key={link.label} link={link} />
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-4 py-2.5 shrink-0">
            <a
              href="tel:5702097916"
              style={{ fontFamily: PHONE_FONT }}
              className="text-white font-medium text-[15px] whitespace-nowrap hover:text-white/80 transition-colors"
            >
              (570) 209-7916
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61583046193932"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Princeton Analytical Labs on Facebook"
            >
              <img src={FB_ICON} alt="" className="w-[27px] h-[27px]" />
            </a>
            <a
              href="https://www.instagram.com/princetonanalytical"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Princeton Analytical Labs on Instagram"
            >
              <img src={IG_ICON} alt="" className="w-[27px] h-[27px]" />
            </a>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="lg:hidden p-2.5 -ml-2.5 text-white"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {menuOpen && (
          <div className="lg:hidden border-t border-white/25">
            <nav className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <NavItem key={link.label} link={link} mobile onClick={closeMenu} />
              ))}
            </nav>
            <div className="flex items-center gap-4 px-3 py-3">
              <a
                href="tel:5702097916"
                style={{ fontFamily: PHONE_FONT }}
                className="text-white font-medium text-[15px] whitespace-nowrap"
              >
                (570) 209-7916
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61583046193932"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Princeton Analytical Labs on Facebook"
              >
                <img src={FB_ICON} alt="" className="w-[27px] h-[27px]" />
              </a>
              <a
                href="https://www.instagram.com/princetonanalytical"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Princeton Analytical Labs on Instagram"
              >
                <img src={IG_ICON} alt="" className="w-[27px] h-[27px]" />
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white shadow-[0_2px_10px_rgba(0,0,0,0.08)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-5 py-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <span />
          <a href="https://www.princetonanalytical.com/" className="shrink-0">
            <img
              src={DESKTOP_LOGO}
              alt="Princeton Analytical Labs"
              className="hidden sm:block h-auto w-[240px] max-w-full"
            />
            <img
              src={MOBILE_LOGO}
              alt="Princeton Analytical Labs"
              className="sm:hidden h-auto w-[170px] max-w-full"
            />
          </a>
          <div className="flex justify-end">
            <CartButton />
          </div>
        </div>
      </div>
    </header>
  );
}
