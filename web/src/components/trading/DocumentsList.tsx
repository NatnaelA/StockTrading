"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaDownload, FaFilter } from "react-icons/fa";
import { TradeDocument } from "@/types/trading";

interface DocumentsListProps {
  documents: TradeDocument[];
}

export default function DocumentsList({ documents }: DocumentsListProps) {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");

  const years = Array.from(
    new Set(documents.map((doc) => new Date(doc.date).getFullYear()))
  ).sort((a, b) => b - a);

  const periods = Array.from(
    new Set(
      documents.map((doc) => {
        const date = new Date(doc.date);
        return `${date.getMonth() + 1}/${date.getFullYear()}`;
      })
    )
  ).sort((a, b) => {
    const [monthA, yearA] = a.split("/").map(Number);
    const [monthB, yearB] = b.split("/").map(Number);
    if (yearA !== yearB) return yearB - yearA;
    return monthB - monthA;
  });

  const filteredDocuments = documents.filter((doc) => {
    const docYear = new Date(doc.date).getFullYear().toString();
    const docPeriod = `${new Date(doc.date).getMonth() + 1}/${new Date(
      doc.date
    ).getFullYear()}`;

    return (
      (selectedType === "all" || doc.type === selectedType) &&
      (selectedYear === "all" || docYear === selectedYear) &&
      (selectedPeriod === "all" || docPeriod === selectedPeriod)
    );
  });

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">
          {t("documents.title")}
        </h2>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200"
        >
          <FaFilter className="mr-2" />
          {t("documents.filter")}
        </button>
      </div>

      {showFilters && (
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700"
            >
              {t("documents.type")}
            </label>
            <select
              id="type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="all">{t("documents.allTypes")}</option>
              <option value="statement">{t("documents.statement")}</option>
              <option value="confirmation">
                {t("documents.confirmation")}
              </option>
              <option value="tax">{t("documents.tax")}</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="year"
              className="block text-sm font-medium text-gray-700"
            >
              {t("documents.year")}
            </label>
            <select
              id="year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="all">{t("documents.allYears")}</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="period"
              className="block text-sm font-medium text-gray-700"
            >
              {t("documents.period")}
            </label>
            <select
              id="period"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="all">{t("documents.allPeriods")}</option>
              {periods.map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {t("documents.date")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {t("documents.type")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                {t("documents.description")}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                {t("documents.action")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredDocuments.map((doc) => (
              <tr key={doc.id}>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {new Date(doc.date).toLocaleDateString()}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {t(`documents.type.${doc.type}`)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {doc.description}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                  <a
                    href={doc.url}
                    download
                    className="inline-flex items-center text-indigo-600 hover:text-indigo-900"
                  >
                    <FaDownload className="mr-1" />
                    {t("documents.download")}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredDocuments.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-500">
            {t("documents.noDocuments")}
          </div>
        )}
      </div>
    </div>
  );
}
