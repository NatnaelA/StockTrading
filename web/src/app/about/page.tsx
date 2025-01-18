import Image from "next/image";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { FaLinkedin, FaTwitter } from "react-icons/fa";

const teamMembers = [
  {
    name: "Sarah Johnson",
    role: "CEO & Founder",
    image: "/placeholder-profile.svg",
    bio: "15+ years of experience in financial markets and technology.",
    linkedin: "#",
    twitter: "#",
  },
  {
    name: "Michael Chen",
    role: "CTO",
    image: "/placeholder-profile.svg",
    bio: "Former tech lead at major financial institutions.",
    linkedin: "#",
    twitter: "#",
  },
  {
    name: "Emily Rodriguez",
    role: "Head of Product",
    image: "/placeholder-profile.svg",
    bio: "Product strategist with focus on user experience.",
    linkedin: "#",
    twitter: "#",
  },
  {
    name: "David Kim",
    role: "Head of Trading",
    image: "/placeholder-profile.svg",
    bio: "20+ years of trading and risk management experience.",
    linkedin: "#",
    twitter: "#",
  },
];

export default function About() {
  return (
    <div>
      <PageHeader
        title="About Us"
        description="Building the future of stock trading technology."
      />

      {/* Company Story */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Founded in 2024, StockTrading was born from a vision to
                  democratize access to professional-grade trading tools while
                  maintaining the highest standards of security and compliance.
                </p>
                <p>
                  Our team combines decades of experience in financial markets
                  with cutting-edge technology expertise to deliver a platform
                  that serves both individual traders and large institutions.
                </p>
                <p>
                  Today, we serve thousands of traders across the globe,
                  processing millions of transactions daily while maintaining
                  our commitment to security, reliability, and innovation.
                </p>
              </div>
            </div>
            <div className="relative">
              <Image
                src="/trading-interface.svg"
                alt="Trading Platform"
                width={800}
                height={600}
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Our Values
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl text-white">🔒</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Security First
              </h3>
              <p className="text-gray-600">
                We prioritize the security of our clients' assets and data above
                all else.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl text-white">💡</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Innovation
              </h3>
              <p className="text-gray-600">
                Continuously pushing the boundaries of what's possible in
                trading technology.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl text-white">🤝</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Integrity
              </h3>
              <p className="text-gray-600">
                Operating with complete transparency and ethical standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Our Leadership Team
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="text-center">
                <div className="relative w-48 h-48 mx-auto mb-6">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="rounded-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {member.name}
                </h3>
                <p className="text-blue-600 mb-3">{member.role}</p>
                <p className="text-gray-600 mb-4">{member.bio}</p>
                <div className="flex justify-center space-x-4">
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-blue-600"
                  >
                    <FaLinkedin className="w-5 h-5" />
                  </a>
                  <a
                    href={member.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-blue-600"
                  >
                    <FaTwitter className="w-5 h-5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Join Our Team</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            We're always looking for talented individuals who share our passion
            for innovation in financial technology.
          </p>
          <Link
            href="/careers"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition duration-300"
          >
            View Open Positions
          </Link>
        </div>
      </section>
    </div>
  );
}
