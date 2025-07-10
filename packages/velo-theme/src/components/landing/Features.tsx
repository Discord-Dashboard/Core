import React from 'react'
import {
    ChartBarIcon,
    AdjustmentsHorizontalIcon,
    ShieldCheckIcon,
} from '@heroicons/react/24/solid'

const items = [
    { Icon: ChartBarIcon, title: 'Server Dashboard', desc: "Stats & insights at a glance" },
    { Icon: AdjustmentsHorizontalIcon, title: 'Customizable',    desc: "Tailor widgets & layouts" },
    { Icon: ShieldCheckIcon,             title: 'Mod Tools',       desc: "Advanced logging & automation" },
]

export default function Features() {
    return (
        <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <h2 className="mb-12 text-3xl font-bold text-center text-gray-900 animate-fade-in">
                    Powerful Features
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {items.map((item, i) => (
                        <div
                            key={i}
                            className={`p-8 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow animate-fade-in delay-${(i+1)*100}`}
                        >
                            <div className="flex justify-center mb-6">
                                <item.Icon className="h-12 w-12 text-blue-600" />
                            </div>
                            <h3 className="mb-3 text-xl font-semibold text-center text-gray-900">{item.title}</h3>
                            <p className="text-gray-600 text-center">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}