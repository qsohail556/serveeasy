import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-bold text-primary mb-2">ServeEasy</h1>
      <p className="text-gray-600 max-w-md mb-8">
        QR-based contactless table ordering for restaurants. Customers scan a QR code at their
        table to browse the menu and order — no app download required.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          to="/staff/login"
          className="bg-primary text-white rounded-lg py-3 font-medium"
        >
          Staff / Admin Login
        </Link>
      </div>

      <p className="text-gray-400 text-xs mt-10 max-w-sm">
        Are you a customer? Scan the QR code on your table to view the menu — this page is for
        restaurant staff only.
      </p>
    </div>
  );
}