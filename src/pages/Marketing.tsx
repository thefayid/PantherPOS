import { useState } from 'react';
import { Megaphone, Image, Users, Send, Sparkles } from 'lucide-react';
import { Button } from '../components/Button';
import { CatalogueBuilder } from '../components/marketing/CatalogueBuilder';

export default function Marketing() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'catalogue' | 'campaigns'>('dashboard');

    return (
        <div className="h-full bg-background text-foreground flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-border flex justify-between items-center bg-surface">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Sparkles className="text-primary" />
                        Marketing Suite
                    </h1>
                    <p className="text-muted-foreground">Grow your business with professional tools</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={activeTab === 'dashboard' ? 'primary' : 'secondary'}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        Dashboard
                    </Button>
                    <Button
                        variant={activeTab === 'catalogue' ? 'primary' : 'secondary'}
                        onClick={() => setActiveTab('catalogue')}
                    >
                        <Image size={16} className="mr-2" />
                        Catalogue Creator
                    </Button>
                    <Button
                        variant={activeTab === 'campaigns' ? 'primary' : 'secondary'}
                        onClick={() => setActiveTab('campaigns')}
                    >
                        <Megaphone size={16} className="mr-2" />
                        Campaigns
                    </Button>
                </div>
            </div>

            {/* Content Content */}
            <div className="flex-1 overflow-auto p-6">
                {activeTab === 'dashboard' && (
                    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* Hero Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div
                                onClick={() => setActiveTab('catalogue')}
                                className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-6 rounded-2xl cursor-pointer hover:shadow-lg transition-all group"
                            >
                                <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Image className="text-indigo-500" size={24} />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Digital Catalogue</h3>
                                <p className="text-muted-foreground text-sm">Create stunning product lookbooks to share on WhatsApp.</p>
                            </div>

                            <div
                                onClick={() => setActiveTab('campaigns')}
                                className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 p-6 rounded-2xl cursor-pointer hover:shadow-lg transition-all group"
                            >
                                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Send className="text-emerald-500" size={24} />
                                </div>
                                <h3 className="text-xl font-bold mb-2">WhatsApp Blasts</h3>
                                <p className="text-muted-foreground text-sm">Send offers and updates to your customers instantly.</p>
                            </div>

                            <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 p-6 rounded-2xl cursor-pointer hover:shadow-lg transition-all group">
                                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Users className="text-orange-500" size={24} />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Smart Insights</h3>
                                <p className="text-muted-foreground text-sm">Identify inactive customers and top spenders automatically.</p>
                            </div>
                        </div>

                        {/* Recent Activity / Insights Placeholder */}
                        <div className="bg-surface border border-border rounded-xl p-6">
                            <h3 className="text-lg font-bold mb-4">Quick Insights</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-muted/20 rounded-lg border border-border">
                                    <div className="text-sm text-muted-foreground mb-1">Dormant Customers (30+ Days)</div>
                                    <div className="text-2xl font-bold">12 Customers</div>
                                    <div className="text-xs text-emerald-500 mt-2 cursor-pointer hover:underline">Send "We Miss You" Offer &rarr;</div>
                                </div>
                                <div className="p-4 bg-muted/20 rounded-lg border border-border">
                                    <div className="text-sm text-muted-foreground mb-1">Top Selling Category</div>
                                    <div className="text-2xl font-bold">Electronics</div>
                                    <div className="text-xs text-primary mt-2 cursor-pointer hover:underline">Create Catalogue &rarr;</div>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {activeTab === 'catalogue' && (
                    <CatalogueBuilder />
                )}

                {activeTab === 'campaigns' && (
                    <div className="flex flex-col items-center justify-center h-full text-center p-10 animate-in fade-in zoom-in-95">
                        <Megaphone size={64} className="text-muted-foreground/30 mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Campaign Manager Coming Soon</h2>
                        <p className="text-muted-foreground max-w-md">We are building a powerful tool to help you send bulk WhatsApp messages safely and effectively.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
