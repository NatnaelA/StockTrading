"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { FaFilter, FaSpinner } from "react-icons/fa";
import { SupportTicket, TicketFilters } from "@/types/support";
import { getTickets } from "@/services/zendeskService";
import { useAuth } from "@/hooks/useAuth";
import TicketForm from "@/components/support/TicketForm";

export default function SupportPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<TicketFilters>({});
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [filters]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const fetchedTickets = await getTickets(filters);
      setTickets(fetchedTickets);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
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
              <div className="mt-2 text-sm text-red-700">{error}</div>
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
          {t("support.title")}
        </h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <FaFilter className="mr-2 h-4 w-4" />
            {t("support.filters")}
          </button>
          <button
            onClick={() => setShowNewTicketForm(!showNewTicketForm)}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            {showNewTicketForm
              ? t("support.hideForm")
              : t("support.createTicket")}
          </button>
        </div>
      </div>

      {showNewTicketForm && (
        <div className="mb-8">
          <TicketForm />
        </div>
      )}

      {showFilters && (
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label
                htmlFor="status-filter"
                className="block text-sm font-medium text-gray-700"
              >
                {t("support.status")}
              </label>
              <select
                id="status-filter"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    status: e.target.value
                      ? [e.target.value as any]
                      : undefined,
                  })
                }
              >
                <option value="">{t("support.allStatuses")}</option>
                <option value="open">{t("support.statuses.open")}</option>
                <option value="pending">{t("support.statuses.pending")}</option>
                <option value="solved">{t("support.statuses.solved")}</option>
                <option value="closed">{t("support.statuses.closed")}</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="category-filter"
                className="block text-sm font-medium text-gray-700"
              >
                {t("support.category")}
              </label>
              <select
                id="category-filter"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    category: e.target.value
                      ? [e.target.value as any]
                      : undefined,
                  })
                }
              >
                <option value="">{t("support.allCategories")}</option>
                <option value="account">
                  {t("support.categories.account")}
                </option>
                <option value="trading">
                  {t("support.categories.trading")}
                </option>
                <option value="deposits">
                  {t("support.categories.deposits")}
                </option>
                <option value="withdrawals">
                  {t("support.categories.withdrawals")}
                </option>
                <option value="kyc">{t("support.categories.kyc")}</option>
                <option value="technical">
                  {t("support.categories.technical")}
                </option>
                <option value="other">{t("support.categories.other")}</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="date-range"
                className="block text-sm font-medium text-gray-700"
              >
                {t("support.dateRange")}
              </label>
              <div className="mt-1 flex space-x-2">
                <input
                  id="start-date"
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
                  id="end-date"
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
                      {t("support.ticketId")}
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      {t("support.subject")}
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      {t("support.category")}
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      {t("support.status")}
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      {t("support.createdAt")}
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
                  ) : tickets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4">
                        {t("support.noTickets")}
                      </td>
                    </tr>
                  ) : (
                    tickets.map((ticket) => (
                      <tr key={ticket.id}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {ticket.id}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          {ticket.subject}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {t(`support.categories.${ticket.category}`)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              ticket.status === "open"
                                ? "bg-green-100 text-green-800"
                                : ticket.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : ticket.status === "solved"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {t(`support.statuses.${ticket.status}`)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {format(ticket.createdAt, "yyyy-MM-dd HH:mm")}
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
