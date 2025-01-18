import Image from "next/image";
import PageHeader from "@/components/PageHeader";
import {
  FaChartLine,
  FaShieldAlt,
  FaUsers,
  FaClock,
  FaGlobe,
  FaMobile,
  FaLock,
  FaChartBar,
} from "react-icons/fa";

const features = [
  {
    icon: <FaChartLine className="w-8 h-8" />,
    title: "Advanced Trading Tools",
    description:
      "Professional-grade charting, technical analysis, and real-time market data for informed decision making.",
  },
  {
    icon: <FaShieldAlt className="w-8 h-8" />,
    title: "Enterprise Security",
    description:
      "Bank-level encryption, multi-factor authentication, and secure infrastructure to protect your assets.",
  },
  {
    icon: <FaUsers className="w-8 h-8" />,
    title: "Multi-Role Platform",
    description:
      "Customized access and permissions for traders, brokers, administrators, and support staff.",
  },
  {
    icon: <FaClock className="w-8 h-8" />,
    title: "Real-Time Updates",
    description:
      "Instant trade execution, live market data, and real-time portfolio updates.",
  },
  {
    icon: <FaGlobe className="w-8 h-8" />,
    title: "Global Markets",
    description:
      "Access to international markets, multiple asset classes, and diverse trading opportunities.",
  },
  {
    icon: <FaMobile className="w-8 h-8" />,
    title: "Mobile Trading",
    description:
      "Trade on-the-go with our powerful mobile app, available for iOS and Android.",
  },
  {
    icon: <FaLock className="w-8 h-8" />,
    title: "Compliance Ready",
    description:
      "Built-in compliance tools, audit trails, and regulatory reporting capabilities.",
  },
  {
    icon: <FaChartBar className="w-8 h-8" />,
    title: "Portfolio Analytics",
    description:
      "Comprehensive portfolio analysis, risk assessment, and performance tracking.",
  },
];

export default function Features() {
  return (
    <div>
      <PageHeader
        title="Platform Features"
        description="Discover the powerful features that make our platform the choice of professional traders."
      />

      {/* Main Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition duration-300"
              >
                <div className="text-blue-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trading Interface Preview */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Professional Trading Interface
          </h2>
          <div className="relative h-[600px] rounded-lg overflow-hidden shadow-2xl">
            {/* Replace with actual trading interface screenshot */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-600">Trading Interface Preview</p>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Features */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Technical Capabilities
          </h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-6">
                Trading Engine
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm mr-3 mt-1">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      High-Frequency Trading Support
                    </h4>
                    <p className="text-gray-600">
                      Execute thousands of trades per second with minimal
                      latency.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm mr-3 mt-1">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      Advanced Order Types
                    </h4>
                    <p className="text-gray-600">
                      Support for market, limit, stop, and algorithmic orders.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm mr-3 mt-1">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      Risk Management
                    </h4>
                    <p className="text-gray-600">
                      Real-time risk assessment and automated safety controls.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-6">
                Integration & APIs
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm mr-3 mt-1">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      RESTful & WebSocket APIs
                    </h4>
                    <p className="text-gray-600">
                      Comprehensive APIs for seamless integration with existing
                      systems.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm mr-3 mt-1">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      Data Export & Import
                    </h4>
                    <p className="text-gray-600">
                      Flexible data integration with major financial data
                      providers.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm mr-3 mt-1">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      Custom Integration Support
                    </h4>
                    <p className="text-gray-600">
                      Dedicated team for custom integration requirements.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
