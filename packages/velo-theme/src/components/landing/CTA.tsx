import React from 'react'

export default function CTA() {
    return (
        <section className="py-20 bg-white text-center animate-fade-in">
            <h2 className="mb-6 text-3xl font-bold text-gray-900">
                Ready to elevate your Discord server?
            </h2>
            <p className="mb-12 text-xl text-gray-600">
                Join thousands of communities using Velo Theme today.
            </p>
            <button className="px-8 py-4 text-lg font-medium text-white rounded-lg shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-transform transform hover:scale-105">
                Get Started
            </button>
        </section>
    )
}