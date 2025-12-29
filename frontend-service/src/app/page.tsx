import Link from "next/link";
import { BookOpen, Search, Star, Users, MessageSquare, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 px-4 py-24 text-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-sm">
            <BookOpen className="h-4 w-4" />
            Your Digital Library
          </div>

          <h1 className="text-5xl font-bold leading-tight md:text-6xl">
            Discover, Review &<br />Share Your Reads
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-indigo-100">
            Explore millions of books from the Open Library catalog. Rate your favorites,
            write reviews, and connect with other book lovers.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/books"
              className="flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-semibold text-indigo-600 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <Search className="h-5 w-5" />
              Start Exploring
            </Link>
            <Link
              href="/api/auth/signin"
              className="flex items-center gap-2 rounded-xl border-2 border-white/30 px-8 py-4 font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10"
            >
              <Users className="h-5 w-5" />
              Join Community
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Everything You Need for Your Reading Journey
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              A complete platform for book discovery and community engagement
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="group rounded-2xl border border-gray-100 bg-gray-50 p-8 transition-all hover:border-indigo-200 hover:bg-indigo-50/50">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                <Search className="h-7 w-7" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                Powerful Search
              </h3>
              <p className="mt-2 text-gray-600">
                Search by title, author, or subject across millions of books from the Open Library catalog.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-2xl border border-gray-100 bg-gray-50 p-8 transition-all hover:border-indigo-200 hover:bg-indigo-50/50">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                <Star className="h-7 w-7" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                Rate & Review
              </h3>
              <p className="mt-2 text-gray-600">
                Share your thoughts with 5-star ratings and detailed reviews. Help others find their next read.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-2xl border border-gray-100 bg-gray-50 p-8 transition-all hover:border-indigo-200 hover:bg-indigo-50/50">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                <MessageSquare className="h-7 w-7" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                Community Reviews
              </h3>
              <p className="mt-2 text-gray-600">
                Read reviews from other readers. See what the community thinks before you read.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group rounded-2xl border border-gray-100 bg-gray-50 p-8 transition-all hover:border-indigo-200 hover:bg-indigo-50/50">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                <Users className="h-7 w-7" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                User Profiles
              </h3>
              <p className="mt-2 text-gray-600">
                Track your reading history, view your reviews, and see your average ratings.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group rounded-2xl border border-gray-100 bg-gray-50 p-8 transition-all hover:border-indigo-200 hover:bg-indigo-50/50">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                <Shield className="h-7 w-7" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                Secure Authentication
              </h3>
              <p className="mt-2 text-gray-600">
                Enterprise-grade security with Keycloak SSO. Your data is safe with us.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group rounded-2xl border border-gray-100 bg-gray-50 p-8 transition-all hover:border-indigo-200 hover:bg-indigo-50/50">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                <BookOpen className="h-7 w-7" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                Rich Book Details
              </h3>
              <p className="mt-2 text-gray-600">
                View covers, descriptions, subjects, and author information for every book.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 px-4 py-24 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold">Ready to Start Reading?</h2>
          <p className="mt-4 text-lg text-gray-400">
            Join thousands of readers who use Biblio to discover and review books.
          </p>
          <Link
            href="/books"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 font-semibold text-white transition-all hover:bg-indigo-700"
          >
            <Search className="h-5 w-5" />
            Browse Books Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8 md:flex-row">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-indigo-600" />
              <span className="font-semibold text-gray-900">Biblio</span>
            </div>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Biblio. Powered by Open Library API.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
