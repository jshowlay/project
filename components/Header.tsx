'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ChevronDown, Bookmark } from 'lucide-react';

// Default navigation items
const DEFAULT_NAV_ITEMS = [
  { label: 'Explore', href: '/' },
  { label: 'Live', href: '/live' },
  { label: 'Trends', href: '/trends' },
  { label: 'Alerts', href: '/alerts' },
  { label: 'Resources', href: '/resources' },
  { label: 'Blog', href: '/blog' },
];

// Props interface
interface HeaderProps {
  nav?: Array<{ label: string; href: string }>;
  logoSrc?: string;
  isAuthed?: boolean;
  savedCount?: number;
}

// Header component
export default function Header({ 
  nav = DEFAULT_NAV_ITEMS, 
  logoSrc = 'https://trenderai.com/wp-content/uploads/2025/01/logo-new.png',
  isAuthed = false,
  savedCount = 0
}: HeaderProps) {
  // State management
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Refs for focus management and outside click detection
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const hamburgerButtonRef = useRef<HTMLButtonElement>(null);

  // Create full navigation array with conditional "Saved" link
  const fullNav = React.useMemo(() => {
    const navItems = [...nav];
    
    // Insert "Saved" between "Trends" and "Alerts" if user is authenticated
    if (isAuthed) {
      const trendsIndex = navItems.findIndex(item => item.label === 'Trends');
      if (trendsIndex !== -1) {
        navItems.splice(trendsIndex + 1, 0, { label: 'Saved', href: '/saved' });
      }
    }
    
    return navItems;
  }, [nav, isAuthed]);

  // Format saved count for display
  const formattedSavedCount = React.useMemo(() => {
    if (savedCount <= 0) return '';
    if (savedCount > 99) return '99+';
    return savedCount.toString();
  }, [savedCount]);

  // Handle scroll effect for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle body scroll lock when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Handle Escape key to close mobile menu
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMobileMenuOpen) {
        closeMobileMenu();
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isMobileMenuOpen]);

  // Handle outside click to close mobile menu
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        hamburgerButtonRef.current &&
        !hamburgerButtonRef.current.contains(event.target as Node)
      ) {
        closeMobileMenu();
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu function
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    // Return focus to hamburger button for accessibility
    hamburgerButtonRef.current?.focus();
  };

  // Toggle mobile menu function
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  return (
    <>
      {/* Header */}
      <header
        className={`
          fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out
          ${isScrolled 
            ? 'bg-black/80 backdrop-blur-md border-b border-gray-800/50' 
            : 'bg-black/60 backdrop-blur-sm'
          }
        `}
        role="banner"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link 
                href="/" 
                className="flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black rounded"
                aria-label="Go to TrenderAI homepage"
              >
                <div className="relative">
                  <Image
                    src={logoSrc}
                    alt="TrenderAI Logo"
                    width={96}
                    height={56}
                    className="object-contain w-20 h-12 md:w-24 md:h-14"
                    priority
                  />
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav 
              className="hidden md:flex items-center space-x-8"
              role="navigation"
              aria-label="Main navigation"
            >
              {fullNav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="
                    text-gray-300 hover:text-white transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black rounded px-2 py-1
                    relative group
                  "
                  aria-label={`Navigate to ${item.label}`}
                >
                  {item.label}
                  {/* Hover underline effect */}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-200 group-hover:w-full"></span>
                </Link>
              ))}
            </nav>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Saved Bookmark Icon (Desktop) - Only show if authenticated */}
              {isAuthed && (
                <Link
                  href="/saved"
                  className="
                    relative text-gray-300 hover:text-white transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black rounded p-2
                  "
                  aria-label={`View saved trends${formattedSavedCount ? ` (${formattedSavedCount} items)` : ''}`}
                >
                  <Bookmark className="h-5 w-5" aria-hidden="true" />
                  {/* Count Badge */}
                  {formattedSavedCount && (
                    <span className="
                      absolute -right-1 -top-1 bg-blue-600 text-white text-xs font-medium
                      rounded-full min-w-[18px] h-[18px] flex items-center justify-center
                      px-1
                    ">
                      {formattedSavedCount}
                    </span>
                  )}
                </Link>
              )}
              
              <Link
                href="/login"
                className="
                  text-gray-300 hover:text-white transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black rounded px-3 py-2
                "
                aria-label="Sign in to your account"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="
                  bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black rounded px-4 py-2 font-medium
                "
                aria-label="Create a new account"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Saved Bookmark Icon (Mobile) - Only show if authenticated */}
              {isAuthed && (
                <Link
                  href="/saved"
                  className="
                    relative text-gray-300 hover:text-white transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black rounded p-2
                    touch-manipulation
                  "
                  aria-label={`View saved trends${formattedSavedCount ? ` (${formattedSavedCount} items)` : ''}`}
                >
                  <Bookmark className="h-5 w-5" aria-hidden="true" />
                  {/* Count Badge */}
                  {formattedSavedCount && (
                    <span className="
                      absolute -right-1 -top-1 bg-blue-600 text-white text-xs font-medium
                      rounded-full min-w-[18px] h-[18px] flex items-center justify-center
                      px-1
                    ">
                      {formattedSavedCount}
                    </span>
                  )}
                </Link>
              )}
              
              <button
                ref={hamburgerButtonRef}
                onClick={toggleMobileMenu}
                className="
                  text-gray-300 hover:text-white transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black rounded p-3
                  touch-manipulation
                "
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
                aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            aria-hidden="true"
            onClick={closeMobileMenu}
          />
        )}

        {/* Mobile Menu Panel */}
        <div
          ref={mobileMenuRef}
          id="mobile-menu"
          className={`
            md:hidden fixed top-16 left-0 right-0 bg-black/95 backdrop-blur-md border-b border-gray-800/50
            transform transition-transform duration-300 ease-in-out z-50 max-h-[calc(100vh-4rem)] overflow-y-auto
            ${isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full'}
          `}
          role="navigation"
          aria-label="Mobile navigation"
          style={{ 
            pointerEvents: isMobileMenuOpen ? 'auto' : 'none',
            willChange: 'transform'
          }}
        >
          <div className="px-4 py-6 space-y-4 safe-area-inset-top">
            {/* Mobile Navigation Links */}
            {fullNav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={closeMobileMenu}
                className="
                  block text-gray-300 hover:text-white transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black rounded px-4 py-3
                  text-lg font-medium touch-manipulation
                "
                aria-label={`Navigate to ${item.label}`}
              >
                {item.label}
              </Link>
            ))}

            {/* Mobile Action Buttons */}
            <div className="pt-6 border-t border-gray-800 space-y-3">
              <Link
                href="/login"
                onClick={closeMobileMenu}
                className="
                  block text-gray-300 hover:text-white transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black rounded px-4 py-3
                  text-lg font-medium touch-manipulation
                "
                aria-label="Sign in to your account"
              >
                Login
              </Link>
              <Link
                href="/signup"
                onClick={closeMobileMenu}
                className="
                  block bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black rounded px-4 py-4
                  text-lg font-medium text-center touch-manipulation
                "
                aria-label="Create a new account"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer to prevent content from being hidden behind fixed header */}
      <div className="h-16" />
    </>
  );
}
