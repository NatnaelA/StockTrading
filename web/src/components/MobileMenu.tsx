"use client";

import { useState } from "react";
import Link from "next/link";
import { FaBars, FaTimes } from "react-icons/fa";

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="md:hidden">
      <button
        onClick={toggleMenu}
        className="text-gray-600 hover:text-blue-600 focus:outline-none"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <FaTimes className="h-6 w-6" />
        ) : (
          <FaBars className="h-6 w-6" />
        )}
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-6 border-b">
              <Link
                href="/"
                className="text-xl font-bold text-blue-600"
                onClick={() => setIsOpen(false)}
              >
                StockTrading
              </Link>
              <button
                onClick={toggleMenu}
                className="text-gray-600 hover:text-blue-600 focus:outline-none"
                aria-label="Close menu"
              >
                <FaTimes className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 px-6 py-8 space-y-6">
              <Link
                href="/features"
                className="block text-lg text-gray-600 hover:text-blue-600"
                onClick={() => setIsOpen(false)}
              >
                Features
              </Link>
              <Link
                href="/pricing"
                className="block text-lg text-gray-600 hover:text-blue-600"
                onClick={() => setIsOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/about"
                className="block text-lg text-gray-600 hover:text-blue-600"
                onClick={() => setIsOpen(false)}
              >
                About
              </Link>
              <Link
                href="/contact"
                className="block text-lg text-gray-600 hover:text-blue-600"
                onClick={() => setIsOpen(false)}
              >
                Contact
              </Link>
            </nav>
            <div className="p-6 border-t space-y-4">
              <Link
                href="/login"
                className="block w-full text-center text-gray-600 hover:text-blue-600"
                onClick={() => setIsOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/register"
                className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                onClick={() => setIsOpen(false)}
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
