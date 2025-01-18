import { useTranslation } from "react-i18next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaHome,
  FaChartLine,
  FaExchangeAlt,
  FaMoneyBillWave,
  FaCog,
} from "react-icons/fa";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navigation() {
  const { t } = useTranslation();
  const pathname = usePathname();

  const navigation = [
    { name: t("navigation.home"), href: "/", icon: FaHome },
    { name: t("navigation.portfolio"), href: "/portfolio", icon: FaChartLine },
    { name: t("navigation.trades"), href: "/trades", icon: FaExchangeAlt },
    {
      name: t("navigation.deposits"),
      href: "/deposits",
      icon: FaMoneyBillWave,
    },
    { name: t("navigation.settings"), href: "/settings", icon: FaCog },
  ];

  return (
    <nav className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/" className="text-xl font-bold text-indigo-600">
                StockTrading
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                      pathname === item.href
                        ? "border-b-2 border-indigo-500 text-gray-900"
                        : "border-b-2 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    }`}
                  >
                    <Icon className="mr-2 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </nav>
  );
}
