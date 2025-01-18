import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { FaClock, FaEnvelope, FaPhone } from "react-icons/fa";

export default function VerificationPending() {
  return (
    <div>
      <PageHeader
        title="Verification Pending"
        description="Your account is currently under review"
      />

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaClock className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Thank You for Registering
            </h2>
            <p className="text-gray-600 text-lg mb-6">
              Your account is currently under review. We'll verify your
              information and notify you once your account is ready.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                What Happens Next?
              </h3>
              <ul className="space-y-4 text-gray-600">
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm mr-3 mt-1">
                    1
                  </div>
                  <p>Our team will review your submitted documents</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm mr-3 mt-1">
                    2
                  </div>
                  <p>We'll verify your identity through our KYC process</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm mr-3 mt-1">
                    3
                  </div>
                  <p>You'll receive an email once your account is verified</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm mr-3 mt-1">
                    4
                  </div>
                  <p>You can then log in and start trading</p>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Need Help?
              </h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <FaEnvelope className="w-6 h-6 text-blue-600 mt-1 mr-4" />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Email</h4>
                    <p className="text-gray-600">support@stocktrading.com</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <FaPhone className="w-6 h-6 text-blue-600 mt-1 mr-4" />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Phone</h4>
                    <p className="text-gray-600">+1 (555) 123-4567</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
