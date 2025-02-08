"use client";

import { useState, useEffect } from "react";
import { tradingService } from "@/services/trading";
import { UserDocument } from "@/types/trading";
import { format } from "date-fns";

interface DocumentsListProps {
  userId: string;
}

export default function DocumentsList({ userId }: DocumentsListProps) {
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;

    const loadDocuments = async () => {
      try {
        const docs = await tradingService.getUserDocuments(userId);
        setDocuments(docs);
      } catch (err) {
        console.error("Error loading documents:", err);
        setError("Failed to load documents");
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Documents</h2>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Documents</h2>
        <div className="p-4 text-red-700 bg-red-50 rounded-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Documents</h2>

      {documents.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No documents available</p>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <a
              key={doc.id}
              href={doc.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{doc.title}</h3>
                  {doc.description && (
                    <p className="text-sm text-gray-500">{doc.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {format(new Date(doc.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {doc.type === "tax_statement" && "📄 Tax Document"}
                  {doc.type === "transaction_confirmation" && "🧾 Transaction"}
                  {doc.type === "account_statement" && "📊 Statement"}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
