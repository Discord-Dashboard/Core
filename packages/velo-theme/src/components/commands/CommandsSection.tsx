'use client'

import React from 'react'

import { Space_Grotesk } from 'next/font/google'

import Head from 'next/head'

const space = Space_Grotesk({
    subsets: ['latin'],
    weight: ['400','600','700'],
    variable: '--font-space-grotesk',
})

export default function CommandsSection() {
    return (
        <section className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold text-center text-gray-900 mb-16 animate-fade-in">
                    <span className="gradient-text">Bot Commands</span>
                </h1>

                {/* Command Categories */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {[
                        {
                            title: 'Moderation',
                            iconBg: 'bg-blue-100',
                            iconColor: 'text-blue-600',
                            commands: [
                                { cmd: '/ban', desc: 'Ban a user from the server' },
                                { cmd: '/kick', desc: 'Kick a user from the server' },
                                { cmd: '/mute', desc: 'Timeout a user' },
                            ],
                        },
                        {
                            title: 'Utility',
                            iconBg: 'bg-purple-100',
                            iconColor: 'text-purple-600',
                            commands: [
                                { cmd: '/serverinfo', desc: 'View server information' },
                                { cmd: '/userinfo', desc: 'View user information' },
                                { cmd: '/avatar', desc: "Get a user's avatar" },
                            ],
                        },
                        {
                            title: 'Fun',
                            iconBg: 'bg-blue-100',
                            iconColor: 'text-blue-400',
                            commands: [
                                { cmd: '/meme', desc: 'Get a random meme' },
                                { cmd: '/8ball', desc: 'Ask the magic 8-ball' },
                                { cmd: '/coinflip', desc: 'Flip a coin' },
                            ],
                        },
                    ].map((cat, i) => (
                        <div
                            key={cat.title}
                            className={`bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 animate-fade-in delay-${(i + 1) *
                            100}`}
                        >
                            <div className="flex items-center mb-4">
                                <div className={`${cat.iconBg} p-3 rounded-lg mr-4`}>
                                    {/* you can swap these SVGs for whatever icon */}
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className={`h-6 w-6 ${cat.iconColor}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        {cat.title === 'Moderation' && (
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                            />
                                        )}
                                        {cat.title === 'Utility' && (
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M13 10V3L4 14h7v7l9-11h-7z"
                                            />
                                        )}
                                        {cat.title === 'Fun' && (
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                            />
                                        )}
                                    </svg>
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900">{cat.title}</h2>
                            </div>
                            <ul className="space-y-3">
                                {cat.commands.map(c => (
                                    <li key={c.cmd} className="flex items-start">
                    <span
                        className={`mr-2 ${cat.iconColor} font-medium`}
                    >
                      {c.cmd}
                    </span>
                                        <span className="text-gray-600">{c.desc}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="max-w-2xl mx-auto mb-16 animate-fade-in delay-100">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search commands..."
                            className="w-full px-6 py-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                        <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-blue-600 transition-colors">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* All Commands Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-fade-in delay-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                {['Command', 'Description', 'Usage'].map(col => (
                                    <th
                                        key={col}
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        {col}
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {[
                                ['/ban', 'Ban a user from the server', '/ban @user [reason]'],
                                ['/kick', 'Kick a user from the server', '/kick @user [reason]'],
                                ['/serverinfo', 'View server information', '/serverinfo'],
                            ].map(([cmd, desc, usage]) => (
                                <tr key={cmd}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                        {cmd}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {desc}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {usage}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    )
}