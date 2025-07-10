import '../styles.css'
import React from 'react'
import Navbar      from '../components/Navbar'
import Hero        from '../components/landing/Hero'
import Features    from '../components/landing/Features'
import Testimonial from '../components/landing/Testimonial'
import CTA         from '../components/landing/CTA'
import Footer      from '../components/Footer'

import { Space_Grotesk } from 'next/font/google'

import Head from 'next/head'
import CommandsSection from "../components/commands/CommandsSection";
import Link from "next/link";

const space = Space_Grotesk({
    subsets: ['latin'],
    weight: ['400','600','700'],
    variable: '--font-space-grotesk',
})

export default function Page() {
    return (
        <html>
        <body className={space.className}>
        <div className="dynamic-accent w-56 h-56 opacity-20 bg-gradient-to-tr from-pink-500 to-purple-500 top-1/4 right-1/3 animation-delay-200" />
        <div className="dynamic-accent w-64 h-64 opacity-20 bg-gradient-to-r from-purple-500 to-pink-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-2/3 animation-delay-300" />

        <Navbar />

        <section className="py-32 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div
                    className="text-9xl font-extrabold mb-6 animate-fade-in
                     bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500
                     bg-clip-text text-transparent tracking-tight"
                >
                    404
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-6 animate-fade-in delay-100">
                    Page Not Found
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12 animate-fade-in delay-200">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <div className="flex justify-center gap-4 animate-fade-in delay-300">
                    <Link
                        href="/"
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg text-white font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                        Go Home
                    </Link>
                    <Link
                        href="/support"
                        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-all"
                    >
                        Contact Support
                    </Link>
                </div>
            </div>
        </section>

        <Footer />
        </body>
        </html>
    )
}