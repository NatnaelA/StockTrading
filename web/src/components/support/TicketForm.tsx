"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaPaperclip, FaSpinner } from "react-icons/fa";
import {
  CreateTicketInput,
  TicketCategory,
  TicketPriority,
} from "@/types/support";
import { createTicket } from "@/services/zendeskService";
import { useAuth } from "@/hooks/useAuth";

const categories: { value: TicketCategory; label: string }[] = [
  { value: "account", label: "Account Issues" },
  { value: "trading", label: "Trading Problems" },
  { value: "deposits", label: "Deposit Issues" },
  { value: "withdrawals", label: "Withdrawal Issues" },
  { value: "kyc", label: "KYC Verification" },
  { value: "technical", label: "Technical Support" },
  { value: "other", label: "Other" },
];

const priorities: { value: TicketPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export default function TicketForm() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [input, setInput] = useState<CreateTicketInput>({
    category: "other",
    subject: "",
    description: "",
    priority: "medium",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      await createTicket(input, user);
      setSuccess(true);
      setInput({
        category: "other",
        subject: "",
        description: "",
        priority: "medium",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-md bg-green-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              {t("support.ticketCreated")}
            </h3>
            <div className="mt-2 text-sm text-green-700">
              {t("support.ticketCreatedDescription")}
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setSuccess(false)}
                className="rounded-md bg-green-50 px-2 py-1.5 text-sm font-medium text-green-800 hover:bg-green-100"
              >
                {t("support.createAnother")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
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
      )}

      <div>
        <label
          htmlFor="category"
          className="block text-sm font-medium text-gray-700"
        >
          {t("support.category")}
        </label>
        <select
          id="category"
          value={input.category}
          onChange={(e) =>
            setInput({ ...input, category: e.target.value as TicketCategory })
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          {categories.map((category) => (
            <option key={category.value} value={category.value}>
              {t(`support.categories.${category.value}`)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="subject"
          className="block text-sm font-medium text-gray-700"
        >
          {t("support.subject")}
        </label>
        <input
          type="text"
          id="subject"
          value={input.subject}
          onChange={(e) => setInput({ ...input, subject: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          {t("support.description")}
        </label>
        <textarea
          id="description"
          rows={4}
          value={input.description}
          onChange={(e) => setInput({ ...input, description: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label
          htmlFor="priority"
          className="block text-sm font-medium text-gray-700"
        >
          {t("support.priority")}
        </label>
        <select
          id="priority"
          value={input.priority}
          onChange={(e) =>
            setInput({ ...input, priority: e.target.value as TicketPriority })
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          {priorities.map((priority) => (
            <option key={priority.value} value={priority.value}>
              {t(`support.priorities.${priority.value}`)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          {t("support.attachments")}
        </label>
        <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6">
          <div className="space-y-1 text-center">
            <FaPaperclip className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer rounded-md bg-white font-medium text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:text-indigo-500"
              >
                <span>{t("support.uploadFiles")}</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  multiple
                  onChange={(e) =>
                    setInput({
                      ...input,
                      attachments: Array.from(e.target.files || []),
                    })
                  }
                />
              </label>
            </div>
            <p className="text-xs text-gray-500">{t("support.maxFileSize")}</p>
          </div>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          {loading ? (
            <>
              <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
              {t("common.loading")}
            </>
          ) : (
            t("support.submitTicket")
          )}
        </button>
      </div>
    </form>
  );
}
