interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export default function PageHeader({
  title,
  description,
  className = "",
}: PageHeaderProps) {
  return (
    <div
      className={`bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16 ${className}`}
    >
      <div className="container mx-auto px-6">
        <h1 className="text-4xl font-bold mb-4">{title}</h1>
        {description && <p className="text-xl text-white/80">{description}</p>}
      </div>
    </div>
  );
}
