"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { FaCheck, FaTimes, FaSpinner } from "react-icons/fa";

interface TradeDetailsProps {
  params: {
    tradeId: string;
  };
  searchParams: {
    status?: string;
  };
}

interface TradeDetails {
  id: string;
  symbol: string;
  quantity: number;
  orderType: "market" | "limit";
  side: "buy" | "sell";
  limitPrice?: number;
  status: string;
  requestedBy: string;
  createdAt: Date;
  notes?: string;
  brokerApprovalBy?: string;
  brokerApprovalAt?: Date;
  brokerNotes?: string;
  clientApprovalBy?: string;
  clientApprovalAt?: Date;
  clientNotes?: string;
  executionDetails?: {
    executionPrice: number;
    executedAt: Date;
    orderId: string;
  };
}

export default function TradeDetailsPage({
  params,
  searchParams,
}: TradeDetailsProps) {
  const router = useRouter();
  const [trade, setTrade] = useState<TradeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchTradeDetails();
  }, [params.tradeId]);

  const fetchTradeDetails = async () => {
    try {
      const response = await fetch(`/api/trades/${params.tradeId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch trade details");

      const data = await response.json();
      setTrade(data.trade);
    } catch (error) {
      setError("Failed to load trade details");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (approved: boolean, notes: string = "") => {
    try {
      setProcessing(true);
      setError("");

      const endpoint =
        trade?.status === "pending_broker_approval"
          ? `/api/trades/${params.tradeId}/broker-approval`
          : `/api/trades/${params.tradeId}/client-approval`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ approved, notes }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process approval");
      }

      await fetchTradeDetails();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!trade) return <div>Trade not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <PageHeader
        title="Trade Details"
        description={`${trade.side.toUpperCase()} ${trade.quantity} ${
          trade.symbol
        }`}
      />

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Trade Details
              </h3>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-500">Symbol</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {trade.symbol}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Side</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {trade.side.toUpperCase()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Quantity</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {trade.quantity}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Order Type</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {trade.orderType.toUpperCase()}
                  </dd>
                </div>
                {trade.limitPrice && (
                  <div>
                    <dt className="text-sm text-gray-500">Limit Price</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      ${trade.limitPrice}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-gray-500">Status</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {trade.status}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Requested By</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {trade.requestedBy}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Created At</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {new Date(trade.createdAt).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Approval Status
              </h3>
              <div className="space-y-4">
                {trade.brokerApprovalBy && (
                  <div>
                    <p className="text-sm text-gray-500">Broker Approval</p>
                    <p className="text-sm font-medium text-gray-900">
                      By: {trade.brokerApprovalBy}
                    </p>
                    <p className="text-sm text-gray-500">
                      At: {new Date(trade.brokerApprovalAt!).toLocaleString()}
                    </p>
                    {trade.brokerNotes && (
                      <p className="text-sm text-gray-600 mt-1">
                        Notes: {trade.brokerNotes}
                      </p>
                    )}
                  </div>
                )}

                {trade.clientApprovalBy && (
                  <div>
                    <p className="text-sm text-gray-500">Client Approval</p>
                    <p className="text-sm font-medium text-gray-900">
                      By: {trade.clientApprovalBy}
                    </p>
                    <p className="text-sm text-gray-500">
                      At: {new Date(trade.clientApprovalAt!).toLocaleString()}
                    </p>
                    {trade.clientNotes && (
                      <p className="text-sm text-gray-600 mt-1">
                        Notes: {trade.clientNotes}
                      </p>
                    )}
                  </div>
                )}

                {trade.status === "executed" && trade.executionDetails && (
                  <div className="mt-6 p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">
                      Execution Details
                    </h4>
                    <dl className="grid grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm text-gray-600">Price</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          ${trade.executionDetails.executionPrice}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-600">Total Value</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          $
                          {trade.executionDetails.executionPrice *
                            trade.quantity}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-600">Order ID</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {trade.executionDetails.orderId}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-600">Executed At</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {new Date(
                            trade.executionDetails.executedAt
                          ).toLocaleString()}
                        </dd>
                      </div>
                    </dl>
                  </div>
                )}
              </div>
            </div>
          </div>

          {(trade.status === "pending_broker_approval" ||
            trade.status === "pending_client_approval") && (
            <div className="mt-8 flex justify-end space-x-4">
              <button
                onClick={() => handleApproval(false)}
                disabled={processing}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {processing ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <>
                    <FaTimes className="mr-2" />
                    Reject
                  </>
                )}
              </button>
              <button
                onClick={() => handleApproval(true)}
                disabled={processing}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {processing ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <>
                    <FaCheck className="mr-2" />
                    Approve
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
