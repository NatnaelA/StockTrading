"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FaDownload, FaFilter, FaSearch, FaSpinner } from "react-icons/fa";
import { format } from "date-fns";
import { AuditFilters } from "@/types/audit";
import { exportAuditLogs } from "@/services/auditService";
import { useAuth } from "@/hooks/useAuth";
import { useAuditLogs } from "@/hooks/useAuditLogs";

export default function AuditDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [filters, setFilters] = useState<AuditFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const { logs, loading, error } = useAuditLogs(filters);

  useEffect(() => {
    if (user?.role !== "audit" && user?.role !== "super-admin") {
      window.location.href = "/";
      return;
    }
  }, [user]);

  const handleExport = async () => {
    const csv = await exportAuditLogs(logs);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {t("common.error")}
              </h3>
              <div className="mt-2 text-sm text-red-700">{error.message}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">
          {t("audit.title")}
        </h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <FaFilter className="mr-2 h-4 w-4" />
            {t("audit.filters")}
          </button>
          <button
            onClick={handleExport}
            disabled={loading || logs.length === 0}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            <FaDownload className="mr-2 h-4 w-4" />
            {t("audit.export")}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("audit.dateRange")}
              </label>
              <div className="mt-1 flex space-x-2">
                <input
                  type="date"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      startDate: e.target.value
                        ? new Date(e.target.value)
                        : undefined,
                    })
                  }
                />
                <input
                  type="date"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      endDate: e.target.value
                        ? new Date(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("audit.userId")}
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      userId: e.target.value || undefined,
                    })
                  }
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("audit.targetId")}
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      targetId: e.target.value || undefined,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      {t("audit.timestamp")}
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      {t("audit.action")}
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      {t("audit.initiatedBy")}
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      {t("audit.description")}
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      {t("audit.target")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4">
                        <FaSpinner className="inline-block h-5 w-5 animate-spin text-indigo-600" />
                        <span className="ml-2">{t("common.loading")}</span>
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4">
                        {t("audit.noLogs")}
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {format(log.timestamp, "yyyy-MM-dd HH:mm:ss")}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {t(`audit.actions.${log.action}`)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {log.initiatedBy.email}
                          <br />
                          <span className="text-xs text-gray-400">
                            {log.initiatedBy.role}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          {log.details.description}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {log.target ? (
                            <>
                              {log.target.type}
                              <br />
                              <span className="text-xs text-gray-400">
                                {log.target.id}
                              </span>
                            </>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
