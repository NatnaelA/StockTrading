"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { FaUser, FaIdCard, FaPhone, FaCheck } from "react-icons/fa";

type RegistrationStep = "account" | "personal" | "kyc" | "verification";

interface FormData {
  // Account Details
  email: string;
  password: string;
  confirmPassword: string;
  accountType: "individual" | "broker";

  // Personal Information
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;

  // KYC Documents
  idType: "passport" | "drivers_license" | "national_id";
  idNumber: string;
  idFrontImage: File | null;
  idBackImage: File | null;
  selfieImage: File | null;

  // Additional Broker Fields
  brokerageName?: string;
  licenseNumber?: string;
  regulatoryBody?: string;
}

export default function Register() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<RegistrationStep>("account");
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    accountType: "individual",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    phoneNumber: "",
    address: "",
    city: "",
    country: "",
    postalCode: "",
    idType: "passport",
    idNumber: "",
    idFrontImage: null,
    idBackImage: null,
    selfieImage: null,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      switch (currentStep) {
        case "account":
          // Validate passwords match
          if (formData.password !== formData.confirmPassword) {
            throw new Error("Passwords do not match");
          }
          setCurrentStep("personal");
          break;

        case "personal":
          // Validate required fields
          if (
            !formData.firstName ||
            !formData.lastName ||
            !formData.phoneNumber
          ) {
            throw new Error("Please fill in all required fields");
          }
          setCurrentStep("kyc");
          break;

        case "kyc":
          // Validate document uploads
          if (!formData.idFrontImage || !formData.selfieImage) {
            throw new Error("Please upload all required documents");
          }

          // Create form data for file upload
          const uploadData = new FormData();
          uploadData.append("idFrontImage", formData.idFrontImage);
          if (formData.idBackImage) {
            uploadData.append("idBackImage", formData.idBackImage);
          }
          uploadData.append("selfieImage", formData.selfieImage);

          // Submit KYC documents to your API
          const response = await fetch("/api/kyc/submit", {
            method: "POST",
            body: uploadData,
          });

          if (!response.ok) {
            throw new Error("Failed to submit KYC documents");
          }

          setCurrentStep("verification");
          break;

        case "verification":
          // Final step - create user account
          const createAccountResponse = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          });

          if (!createAccountResponse.ok) {
            throw new Error("Failed to create account");
          }

          // Redirect to dashboard or verification pending page
          router.push("/verification-pending");
          break;
      }
    } catch (error) {
      console.error("Registration error:", error);
      // Handle error (show error message to user)
    }
  };

  return (
    <div>
      <PageHeader
        title="Create Your Account"
        description="Start trading with our secure platform"
      />

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex justify-between">
            {[
              { id: "account", icon: FaUser, label: "Account" },
              { id: "personal", icon: FaPhone, label: "Personal Info" },
              { id: "kyc", icon: FaIdCard, label: "Verification" },
              { id: "verification", icon: FaCheck, label: "Complete" },
            ].map(({ id, icon: Icon, label }) => (
              <div
                key={id}
                className={`flex flex-col items-center ${
                  currentStep === id ? "text-blue-600" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    currentStep === id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
          <div className="relative mt-4">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2" />
            <div
              className="absolute top-1/2 left-0 h-0.5 bg-blue-600 -translate-y-1/2 transition-all duration-300"
              style={{
                width: `${
                  (currentStep === "account"
                    ? 0
                    : currentStep === "personal"
                    ? 33.33
                    : currentStep === "kyc"
                    ? 66.66
                    : 100) + "%"
                }`,
              }}
            />
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {currentStep === "account" && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Account Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Type
                  </label>
                  <select
                    name="accountType"
                    value={formData.accountType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  >
                    <option value="individual">Individual Trader</option>
                    <option value="broker">Licensed Broker</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === "personal" && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === "kyc" && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Identity Verification
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Type
                  </label>
                  <select
                    name="idType"
                    value={formData.idType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  >
                    <option value="passport">Passport</option>
                    <option value="drivers_license">Driver's License</option>
                    <option value="national_id">National ID</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Number
                  </label>
                  <input
                    type="text"
                    name="idNumber"
                    value={formData.idNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Front Image
                  </label>
                  <input
                    type="file"
                    name="idFrontImage"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Back Image
                  </label>
                  <input
                    type="file"
                    name="idBackImage"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selfie with ID
                  </label>
                  <input
                    type="file"
                    name="selfieImage"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === "verification" && (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCheck className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Verification In Progress
                </h2>
                <p className="text-gray-600">
                  We're reviewing your information. This usually takes 1-2
                  business days. We'll notify you by email once your account is
                  verified.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            {currentStep !== "account" && (
              <button
                type="button"
                onClick={() => {
                  setCurrentStep(
                    currentStep === "verification"
                      ? "kyc"
                      : currentStep === "kyc"
                      ? "personal"
                      : "account"
                  );
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ml-auto"
            >
              {currentStep === "verification" ? "Complete" : "Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
