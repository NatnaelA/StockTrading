"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

interface AdminStats {
  totalUsers: number;
  pendingApprovals: number;
  activeTraders: number;
  dailyTradeVolume: number;
  systemStatus: "operational" | "degraded" | "down";
}

// Mock user for local development
const mockUser = {
  id: "admin-1",
  email: "admin@example.com",
  role: "admin",
};

export default function AdminDashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const [stats] = useState<AdminStats>({
    totalUsers: 1250,
    pendingApprovals: 25,
    activeTraders: 850,
    dailyTradeVolume: 2500000,
    systemStatus: "operational",
  });

  const handleLogout = () => {
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {t("admin.dashboard")}
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">{mockUser.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-800"
            >
              {t("auth.signOut")}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">
              {t("admin.totalUsers")}
            </h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {stats.totalUsers.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">
              {t("admin.pendingApprovals")}
            </h3>
            <p className="mt-2 text-3xl font-semibold text-red-600">
              {stats.pendingApprovals}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">
              {t("admin.activeTraders")}
            </h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {stats.activeTraders.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">
              {t("admin.dailyTradeVolume")}
            </h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              ${stats.dailyTradeVolume.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t("admin.quickActions")}
            </h2>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => router.push("/admin/accounts")}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                {t("admin.approveAccounts")}
              </button>
              <button
                onClick={() => router.push("/admin/trades")}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                {t("admin.reviewTrades")}
              </button>
              <button
                onClick={() => router.push("/admin/settings")}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                {t("admin.systemSettings")}
              </button>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t("admin.systemStatus")}
            </h2>
            <div className="flex items-center">
              <div
                className={`w-3 h-3 rounded-full mr-2 ${
                  stats.systemStatus === "operational"
                    ? "bg-green-500"
                    : stats.systemStatus === "degraded"
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
              />
              <span className="text-sm font-medium text-gray-700">
                {t(`admin.status.${stats.systemStatus}`)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
