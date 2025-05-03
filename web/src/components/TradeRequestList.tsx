"use client";

import { useState, useEffect } from "react";
import { FaCheck, FaTimes, FaSpinner } from "react-icons/fa";

interface TradeRequest {
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

interface TradeRequestListProps {
  type: "broker" | "client";
  portfolioId?: string;
  firmId?: string;
}

export default function TradeRequestList({
  type,
  portfolioId,
  firmId,
}: TradeRequestListProps) {
  const [requests, setRequests] = useState<TradeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTradeRequests();
  }, [type, portfolioId, firmId]);

  const fetchTradeRequests = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (portfolioId) queryParams.append("portfolioId", portfolioId);
      if (firmId) queryParams.append("firmId", firmId);

      const response = await fetch(`/api/trades?${queryParams}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch trade requests");

      const data = await response.json();
      setRequests(data.trades);
    } catch (error) {
      setError("Failed to load trade requests");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (
    tradeId: string,
    approved: boolean,
    notes: string = ""
  ) => {
    try {
      setProcessingId(tradeId);
      setError("");

      const endpoint =
        type === "broker"
          ? `/api/trades/${tradeId}/broker-approval`
          : `/api/trades/${tradeId}/client-approval`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ approved, notes }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to process approval");

      await fetchTradeRequests();
    } catch (error) {
      setError("Failed to process approval");
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
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

      {requests.length === 0 ? (
        <div className="text-center text-gray-500">No trade requests found</div>
      ) : (
        <div className="grid gap-6">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {request.side.toUpperCase()} {request.quantity}{" "}
                      {request.symbol}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {request.orderType.toUpperCase()} Order
                      {request.limitPrice && ` @ $${request.limitPrice}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-800">
                      Status: {request.status}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(request.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {request.notes && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Notes:</span>{" "}
                      {request.notes}
                    </p>
                  </div>
                )}

                {request.status ===
                  (type === "broker"
                    ? "pending_broker_approval"
                    : "pending_client_approval") && (
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => handleApproval(request.id, false)}
                      disabled={processingId === request.id}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {processingId === request.id ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <>
                          <FaTimes className="mr-2" />
                          Reject
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleApproval(request.id, true)}
                      disabled={processingId === request.id}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {processingId === request.id ? (
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

                {request.status === "executed" && request.executionDetails && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">
                      Execution Details
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Price</p>
                        <p className="font-medium">
                          ${request.executionDetails.executionPrice}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Value</p>
                        <p className="font-medium">
                          $
                          {request.executionDetails.executionPrice *
                            request.quantity}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Order ID</p>
                        <p className="font-medium">
                          {request.executionDetails.orderId}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Executed At</p>
                        <p className="font-medium">
                          {new Date(
                            request.executionDetails.executedAt
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
