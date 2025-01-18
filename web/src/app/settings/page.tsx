"use client";

import { useTranslation } from "react-i18next";
import { FaGlobe, FaBell, FaLock, FaUser, FaCog } from "react-icons/fa";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function SettingsPage() {
  const { t } = useTranslation();

  const sections = [
    {
      id: "language",
      name: t("settings.language"),
      icon: FaGlobe,
      description: t("settings.languageDescription"),
      component: <LanguageSwitcher />,
    },
    {
      id: "notifications",
      name: t("settings.notifications"),
      icon: FaBell,
      description: t("settings.notificationsDescription"),
    },
    {
      id: "security",
      name: t("settings.security"),
      icon: FaLock,
      description: t("settings.securityDescription"),
    },
    {
      id: "profile",
      name: t("settings.profile"),
      icon: FaUser,
      description: t("settings.profileDescription"),
    },
    {
      id: "preferences",
      name: t("settings.preferences"),
      icon: FaCog,
      description: t("settings.preferencesDescription"),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {t("settings.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t("settings.description")}
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.id} className="py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <Icon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">
                        {section.name}
                      </h2>
                      <p className="mt-1 text-sm text-gray-500">
                        {section.description}
                      </p>
                    </div>
                  </div>
                  {section.component && (
                    <div className="ml-4">{section.component}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
