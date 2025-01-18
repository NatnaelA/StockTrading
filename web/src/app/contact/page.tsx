"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { FaMapMarkerAlt, FaPhone, FaEnvelope } from "react-icons/fa";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Add your form submission logic here
    console.log("Form submitted:", formData);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div>
      <PageHeader
        title="Contact Us"
        description="Get in touch with our team for any questions or support needs."
      />

      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-8">
                Send us a Message
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="company"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Company (Optional)
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  >
                    <option value="">Select a subject</option>
                    <option value="sales">Sales Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="billing">Billing Question</option>
                    <option value="partnership">Partnership Opportunity</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
                >
                  Send Message
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="lg:pl-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-8">
                Get in Touch
              </h2>

              <div className="space-y-8">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <FaMapMarkerAlt className="w-6 h-6 text-blue-600 mt-1" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      Office Location
                    </h3>
                    <p className="text-gray-600">
                      123 Trading Street
                      <br />
                      Financial District
                      <br />
                      New York, NY 10004
                      <br />
                      United States
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <FaPhone className="w-6 h-6 text-blue-600 mt-1" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      Phone
                    </h3>
                    <p className="text-gray-600">
                      Support: +1 (555) 123-4567
                      <br />
                      Sales: +1 (555) 987-6543
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <FaEnvelope className="w-6 h-6 text-blue-600 mt-1" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      Email
                    </h3>
                    <p className="text-gray-600">
                      Support: support@stocktrading.com
                      <br />
                      Sales: sales@stocktrading.com
                    </p>
                  </div>
                </div>

                {/* Office Hours */}
                <div className="bg-gray-50 rounded-lg p-6 mt-8">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Office Hours
                  </h3>
                  <div className="space-y-2">
                    <p className="text-gray-600">
                      <span className="font-medium">Trading Support:</span>
                      <br />
                      24/7 Support Available
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">General Inquiries:</span>
                      <br />
                      Monday - Friday: 9:00 AM - 6:00 PM EST
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
