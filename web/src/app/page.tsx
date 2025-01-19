"use client";

import { useTranslation } from "react-i18next";
import Image from "next/image";
import Link from "next/link";
import { FaChartLine, FaShieldAlt, FaUsers, FaGlobe } from "react-icons/fa";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full bg-white shadow">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/trading-logo.svg"
              alt="Trading Platform Logo"
              width={40}
              height={40}
              priority
            />
          </Link>
          <div className="flex items-center space-x-6">
            <LanguageSwitcher />
            <Link
              href="/login"
              className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              {t("auth.login")}
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600"
            >
              {t("auth.register")}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative mt-16 overflow-hidden bg-gradient-to-b from-teal-50 pt-16">
        <div className="container mx-auto px-4 py-16">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                {t("landing.hero.title")}
              </h1>
              <p className="mb-8 text-lg text-gray-600">
                {t("landing.hero.description")}
              </p>
              <div className="flex space-x-4">
                <Link
                  href="/register"
                  className="rounded-md bg-teal-500 px-6 py-3 text-base font-medium text-white hover:bg-teal-600"
                >
                  {t("landing.hero.getStarted")}
                </Link>
                <Link
                  href="/about"
                  className="rounded-md bg-white px-6 py-3 text-base font-medium text-teal-500 hover:bg-gray-50"
                >
                  {t("landing.hero.learnMore")}
                </Link>
              </div>
            </div>
            <div className="relative">
              <Image
                src="/trading-interface.svg"
                alt="Trading Interface"
                width={600}
                height={400}
                className="rounded-lg shadow-xl"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            {t("landing.features.title")}
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-white p-6 shadow-lg">
              <div className="mb-4 rounded-full bg-teal-100 p-3 text-teal-500 inline-block">
                <FaChartLine className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-gray-900">
                {t("landing.features.realtime.title")}
              </h3>
              <p className="text-gray-600">
                {t("landing.features.realtime.description")}
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-lg">
              <div className="mb-4 rounded-full bg-teal-100 p-3 text-teal-500 inline-block">
                <FaShieldAlt className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-gray-900">
                {t("landing.features.security.title")}
              </h3>
              <p className="text-gray-600">
                {t("landing.features.security.description")}
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-lg">
              <div className="mb-4 rounded-full bg-teal-100 p-3 text-teal-500 inline-block">
                <FaUsers className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-gray-900">
                {t("landing.features.multiRole.title")}
              </h3>
              <p className="text-gray-600">
                {t("landing.features.multiRole.description")}
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-lg">
              <div className="mb-4 rounded-full bg-teal-100 p-3 text-teal-500 inline-block">
                <FaGlobe className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-gray-900">
                {t("landing.features.global.title")}
              </h3>
              <p className="text-gray-600">
                {t("landing.features.global.description")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            {t("landing.benefits.title")}
          </h2>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <Image
                src="/benefit-security.svg"
                alt="Security"
                width={200}
                height={200}
                className="mb-6"
              />
              <h3 className="mb-3 text-xl font-semibold text-gray-900">
                {t("landing.benefits.security.title")}
              </h3>
              <p className="text-gray-600">
                {t("landing.benefits.security.description")}
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <Image
                src="/benefit-integration.svg"
                alt="Integration"
                width={200}
                height={200}
                className="mb-6"
              />
              <h3 className="mb-3 text-xl font-semibold text-gray-900">
                {t("landing.benefits.integration.title")}
              </h3>
              <p className="text-gray-600">
                {t("landing.benefits.integration.description")}
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <Image
                src="/benefit-support.svg"
                alt="Support"
                width={200}
                height={200}
                className="mb-6"
              />
              <h3 className="mb-3 text-xl font-semibold text-gray-900">
                {t("landing.benefits.support.title")}
              </h3>
              <p className="text-gray-600">
                {t("landing.benefits.support.description")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-teal-500 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-6 text-3xl font-bold text-white">
            {t("landing.cta.title")}
          </h2>
          <p className="mb-8 text-lg text-teal-100">
            {t("landing.cta.description")}
          </p>
          <Link
            href="/register"
            className="inline-block rounded-md bg-white px-8 py-3 text-base font-medium text-teal-500 hover:bg-teal-50"
          >
            {t("landing.cta.button")}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 text-gray-400">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h4 className="mb-4 text-lg font-semibold text-white">
                {t("footer.company")}
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="hover:text-white">
                    {t("footer.about")}
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white">
                    {t("footer.contact")}
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="hover:text-white">
                    {t("footer.careers")}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-lg font-semibold text-white">
                {t("footer.platform")}
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/features" className="hover:text-white">
                    {t("footer.features")}
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white">
                    {t("footer.pricing")}
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="hover:text-white">
                    {t("footer.security")}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-lg font-semibold text-white">
                {t("footer.resources")}
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/documentation" className="hover:text-white">
                    {t("footer.documentation")}
                  </Link>
                </li>
                <li>
                  <Link href="/api" className="hover:text-white">
                    {t("footer.api")}
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="hover:text-white">
                    {t("footer.support")}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-lg font-semibold text-white">
                {t("footer.legal")}
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy" className="hover:text-white">
                    {t("footer.privacy")}
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white">
                    {t("footer.terms")}
                  </Link>
                </li>
                <li>
                  <Link href="/compliance" className="hover:text-white">
                    {t("footer.compliance")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-8 text-center">
            <p>
              © {new Date().getFullYear()} Trading Platform.{" "}
              {t("footer.rights")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
