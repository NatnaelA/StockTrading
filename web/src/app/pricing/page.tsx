import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { FaCheck } from "react-icons/fa";

const plans = [
  {
    name: "Individual",
    description: "Perfect for individual traders and investors",
    price: 29,
    features: [
      "Real-time market data",
      "Basic charting tools",
      "Mobile app access",
      "Email support",
      "5 trades per day",
      "Basic portfolio analytics",
    ],
    highlighted: false,
  },
  {
    name: "Professional",
    description: "For serious traders and small firms",
    price: 99,
    features: [
      "Everything in Individual, plus:",
      "Advanced charting tools",
      "API access",
      "Priority support",
      "Unlimited trades",
      "Advanced portfolio analytics",
      "Custom alerts",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    description: "Custom solutions for large organizations",
    price: null,
    features: [
      "Everything in Professional, plus:",
      "Custom integration",
      "Dedicated account manager",
      "Custom reporting",
      "Multi-user access",
      "White-label options",
      "24/7 phone support",
    ],
    highlighted: false,
  },
];

export default function Pricing() {
  return (
    <div>
      <PageHeader
        title="Transparent Pricing"
        description="Choose the plan that best fits your trading needs."
      />

      {/* Pricing Plans */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`rounded-lg ${
                  plan.highlighted
                    ? "bg-blue-600 text-white transform scale-105"
                    : "bg-white text-gray-800"
                } p-8 shadow-lg relative flex flex-col`}
              >
                {plan.highlighted && (
                  <div className="absolute top-0 right-0 bg-yellow-400 text-blue-900 text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                    POPULAR
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p
                  className={`${
                    plan.highlighted ? "text-blue-100" : "text-gray-600"
                  } mb-6`}
                >
                  {plan.description}
                </p>
                <div className="mb-6">
                  {plan.price ? (
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="text-lg ml-2">/month</span>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold">Custom Pricing</div>
                  )}
                </div>
                <ul className="space-y-4 mb-8 flex-grow">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <FaCheck
                        className={`w-5 h-5 mr-3 ${
                          plan.highlighted ? "text-blue-200" : "text-blue-600"
                        }`}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.price ? "/register" : "/contact"}
                  className={`text-center px-6 py-3 rounded-lg font-semibold transition duration-300 ${
                    plan.highlighted
                      ? "bg-white text-blue-600 hover:bg-blue-50"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {plan.price ? "Get Started" : "Contact Sales"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Can I change plans later?
                </h3>
                <p className="text-gray-600">
                  Yes, you can upgrade or downgrade your plan at any time.
                  Changes will be reflected in your next billing cycle.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Is there a free trial?
                </h3>
                <p className="text-gray-600">
                  Yes, we offer a 14-day free trial for all plans. No credit
                  card required.
                </p>
              </div>
            </div>
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-gray-600">
                  We accept all major credit cards, wire transfers, and ACH
                  payments.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Do you offer refunds?
                </h3>
                <p className="text-gray-600">
                  Yes, we offer a 30-day money-back guarantee if you're not
                  satisfied with our service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
