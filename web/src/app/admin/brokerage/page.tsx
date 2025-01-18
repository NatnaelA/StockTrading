"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import {
  FaBuilding,
  FaUserTie,
  FaUserPlus,
  FaTrash,
  FaEdit,
} from "react-icons/fa";

interface BrokerageFirm {
  id: string;
  name: string;
  licenseNumber: string;
  address: string;
  admins: string[];
  seniorBrokers: string[];
  juniorBrokers: string[];
  createdAt: Date;
}

interface BrokerInvite {
  email: string;
  role: "admin" | "senior" | "junior";
}

export default function BrokerageManagement() {
  const router = useRouter();
  const [firms, setFirms] = useState<BrokerageFirm[]>([]);
  const [showNewFirmForm, setShowNewFirmForm] = useState(false);
  const [selectedFirm, setSelectedFirm] = useState<BrokerageFirm | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    licenseNumber: "",
    address: "",
  });
  const [inviteData, setInviteData] = useState<BrokerInvite>({
    email: "",
    role: "senior",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBrokerageFirms();
  }, []);

  const fetchBrokerageFirms = async () => {
    try {
      const response = await fetch("/api/admin/brokerage");
      if (!response.ok) throw new Error("Failed to fetch firms");
      const data = await response.json();
      setFirms(data.firms);
    } catch (error) {
      setError("Failed to load brokerage firms");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("/api/admin/brokerage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to create firm");

      await fetchBrokerageFirms();
      setShowNewFirmForm(false);
      setFormData({ name: "", licenseNumber: "", address: "" });
    } catch (error) {
      setError("Failed to create brokerage firm");
      console.error(error);
    }
  };

  const handleInviteBroker = async (firmId: string) => {
    try {
      const response = await fetch(`/api/admin/brokerage/${firmId}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inviteData),
      });

      if (!response.ok) throw new Error("Failed to invite broker");

      await fetchBrokerageFirms();
      setInviteData({ email: "", role: "senior" });
    } catch (error) {
      setError("Failed to invite broker");
      console.error(error);
    }
  };

  const handleRemoveBroker = async (
    firmId: string,
    userId: string,
    role: string
  ) => {
    try {
      const response = await fetch(
        `/api/admin/brokerage/${firmId}/broker/${userId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role }),
        }
      );

      if (!response.ok) throw new Error("Failed to remove broker");

      await fetchBrokerageFirms();
    } catch (error) {
      setError("Failed to remove broker");
      console.error(error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <PageHeader
        title="Brokerage Firm Management"
        description="Manage brokerage firms and broker roles"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
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

        <div className="mb-8">
          <button
            onClick={() => setShowNewFirmForm(!showNewFirmForm)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            {showNewFirmForm ? "Cancel" : "Add New Brokerage Firm"}
          </button>
        </div>

        {showNewFirmForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              New Brokerage Firm
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Firm Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Number
                </label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, licenseNumber: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Create Firm
              </button>
            </form>
          </div>
        )}

        <div className="grid gap-6">
          {firms.map((firm) => (
            <div
              key={firm.id}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">
                    {firm.name}
                  </h3>
                  <button
                    onClick={() =>
                      setSelectedFirm(
                        selectedFirm?.id === firm.id ? null : firm
                      )
                    }
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {selectedFirm?.id === firm.id
                      ? "Hide Details"
                      : "Show Details"}
                  </button>
                </div>

                {selectedFirm?.id === firm.id && (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">
                          License Number
                        </h4>
                        <p className="text-gray-600">{firm.licenseNumber}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">
                          Address
                        </h4>
                        <p className="text-gray-600">{firm.address}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-800 mb-4">
                        Invite Broker
                      </h4>
                      <div className="flex gap-4">
                        <input
                          type="email"
                          value={inviteData.email}
                          onChange={(e) =>
                            setInviteData({
                              ...inviteData,
                              email: e.target.value,
                            })
                          }
                          placeholder="Email address"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                        <select
                          value={inviteData.role}
                          onChange={(e) =>
                            setInviteData({
                              ...inviteData,
                              role: e.target.value as
                                | "admin"
                                | "senior"
                                | "junior",
                            })
                          }
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        >
                          <option value="admin">Admin</option>
                          <option value="senior">Senior Broker</option>
                          <option value="junior">Junior Broker</option>
                        </select>
                        <button
                          onClick={() => handleInviteBroker(firm.id)}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                        >
                          Invite
                        </button>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-4">
                          Admins
                        </h4>
                        <ul className="space-y-2">
                          {firm.admins.map((admin) => (
                            <li
                              key={admin}
                              className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                            >
                              <span>{admin}</span>
                              <button
                                onClick={() =>
                                  handleRemoveBroker(firm.id, admin, "admin")
                                }
                                className="text-red-600 hover:text-red-800"
                              >
                                <FaTrash />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 mb-4">
                          Senior Brokers
                        </h4>
                        <ul className="space-y-2">
                          {firm.seniorBrokers.map((broker) => (
                            <li
                              key={broker}
                              className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                            >
                              <span>{broker}</span>
                              <button
                                onClick={() =>
                                  handleRemoveBroker(firm.id, broker, "senior")
                                }
                                className="text-red-600 hover:text-red-800"
                              >
                                <FaTrash />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 mb-4">
                          Junior Brokers
                        </h4>
                        <ul className="space-y-2">
                          {firm.juniorBrokers.map((broker) => (
                            <li
                              key={broker}
                              className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                            >
                              <span>{broker}</span>
                              <button
                                onClick={() =>
                                  handleRemoveBroker(firm.id, broker, "junior")
                                }
                                className="text-red-600 hover:text-red-800"
                              >
                                <FaTrash />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
