import { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { productService } from '../../services/productService';
import type { Product } from '../../types/db';
import { Search, PenTool, LayoutTemplate, Download, Wand2, Image as ImageIcon, Palette, Type } from 'lucide-react';
import { Button } from '../Button';
import toast from 'react-hot-toast';

type Template = 'minimal' | 'gradient' | 'bold' | 'festive';

const TEMPLATES: Record<Template, { name: string, description: string, class: string }> = {
    minimal: { name: 'Clean & Minimal', description: 'White background, focus on product', class: 'bg-white text-gray-900' },
    gradient: { name: 'Sunset Vibes', description: 'Trendy gradient background', class: 'bg-gradient-to-br from-purple-500 to-pink-500 text-white' },
    bold: { name: 'Bold & Loud', description: 'High contrast for attention', class: 'bg-yellow-400 text-black' },
    festive: { name: 'Festival Special', description: 'Decorative elements for holidays', class: 'bg-[#1a4731] text-amber-50' }
};

export function SocialPostCreator() {
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [template, setTemplate] = useState<Template>('gradient');
    const [caption, setCaption] = useState('');
    const [customText, setCustomText] = useState('');
    const [search, setSearch] = useState('');
    const postRef = useRef<HTMLDivElement>(null);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        productService.getAll().then(setProducts);
    }, []);

    const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    const generateCaption = () => {
        if (!selectedProduct) return;
        const templates = [
            `🔥 **Flash Sale Alert!** Get the ${selectedProduct.name} for just ₹${selectedProduct.sell_price}! Limited usage. #DealOfTheDay`,
            `✨ Upgrade your life with specific ${selectedProduct.name}. Now available at our store! #NewArrival #MustHave`,
            `🏷️ **Best Price Guarantee!** We are selling ${selectedProduct.name} at an unbeatable price of ₹${selectedProduct.sell_price}. Visit us today!`,
            `😍 You need this! The amazing ${selectedProduct.name} is back in stock. Grab yours before it's gone!`
        ];
        setCaption(templates[Math.floor(Math.random() * templates.length)]);
    };

    const handleDownload = async () => {
        if (!postRef.current) return;
        try {
            setGenerating(true);
            const dataUrl = await toPng(postRef.current, { cacheBust: true, pixelRatio: 2 });
            const link = document.createElement('a');
            link.download = `${selectedProduct?.name || 'post'}-marketing.png`;
            link.href = dataUrl;
            link.click();
            toast.success('Post downloaded successfully!');
        } catch (err) {
            console.error(err);
            toast.error('Failed to generate image');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="flex h-full gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Left: Controls */}
            <div className="w-[400px] flex flex-col gap-4 bg-muted/10 border-r border-border pr-2 overflow-y-auto">

                {/* 1. Select Product */}
                <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                        <Search size={16} className="text-primary" /> Select Product
                    </h3>
                    <div className="relative mb-3">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full p-2 bg-background border border-border rounded-lg text-sm"
                        />
                    </div>
                    {!selectedProduct ? (
                        <div className="max-h-[200px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                            {filtered.map(p => (
                                <div key={p.id} onClick={() => { setSelectedProduct(p); generateCaption(); }}
                                    className="p-2 hover:bg-muted rounded-lg cursor-pointer flex justify-between text-sm items-center group">
                                    <span>{p.name}</span>
                                    <span className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">Select &rarr;</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-between bg-primary/10 p-3 rounded-lg border border-primary/20">
                            <div>
                                <div className="font-bold text-sm">{selectedProduct.name}</div>
                                <div className="text-xs text-muted-foreground">₹{selectedProduct.sell_price}</div>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => setSelectedProduct(null)}>Change</Button>
                        </div>
                    )}
                </div>

                {/* 2. Choose Template */}
                <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                        <LayoutTemplate size={16} className="text-purple-500" /> Choose Style
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        {(Object.entries(TEMPLATES) as [Template, typeof TEMPLATES[Template]][]).map(([key, t]) => (
                            <div
                                key={key}
                                onClick={() => setTemplate(key)}
                                className={`p-2 rounded-lg border cursor-pointer text-xs transition-all ${template === key ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'}`}
                            >
                                <div className="font-bold">{t.name}</div>
                                <div className="opacity-70 text-[10px] truncate">{t.description}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Customize Content */}
                <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                        <PenTool size={16} className="text-emerald-500" /> Customize Text
                    </h3>

                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-medium mb-1 block">Main Headline</label>
                            <input
                                value={customText}
                                onChange={e => setCustomText(e.target.value)}
                                placeholder={selectedProduct ? `Special Offer on ${selectedProduct.name}!` : "Enter headline..."}
                                className="w-full text-sm p-2 bg-background border border-border rounded-lg"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-xs font-medium">Caption (AI Auto-Gen)</label>
                                <button onClick={generateCaption} className="text-[10px] text-primary flex items-center gap-1 hover:underline">
                                    <Wand2 size={10} /> Regenerate
                                </button>
                            </div>
                            <textarea
                                value={caption}
                                onChange={e => setCaption(e.target.value)}
                                className="w-full text-sm p-2 bg-background border border-border rounded-lg h-24 resize-none"
                            />
                        </div>
                    </div>
                </div>

                <Button
                    onClick={handleDownload}
                    disabled={!selectedProduct || generating}
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg"
                >
                    {generating ? 'Generating...' : <><Download size={18} className="mr-2" /> Download Post</>}
                </Button>

            </div>

            {/* Right: Live Preview */}
            <div className="flex-1 flex items-center justify-center bg-muted/20 rounded-xl border border-dashed border-border p-8 overflow-hidden relative">

                <div className="absolute top-4 right-4 text-xs font-mono text-muted-foreground">
                    Preview Mode (1080x1080)
                </div>

                {!selectedProduct ? (
                    <div className="flex flex-col items-center text-muted-foreground opacity-50">
                        <ImageIcon size={64} className="mb-4" />
                        <p>Select a product to start designing</p>
                    </div>
                ) : (
                    <div
                        ref={postRef}
                        className={`w-[500px] h-[500px] shadow-2xl flex flex-col relative overflow-hidden transition-all duration-500 ${TEMPLATES[template].class}`}
                    >
                        {/* Design Elements based on Template */}

                        {/* Minimal: Clean white with big image */}
                        {template === 'minimal' && (
                            <div className="h-full flex flex-col p-8">
                                <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-2xl mb-6 relative overflow-hidden group">
                                    {selectedProduct.image ? (
                                        <img src={selectedProduct.image} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-700" />
                                    ) : (
                                        <ImageIcon size={64} className="text-gray-300" />
                                    )}
                                    <div className="absolute top-4 right-4 bg-black text-white px-3 py-1 rounded-full text-sm font-bold">
                                        Just ₹{selectedProduct.sell_price}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <h2 className="text-3xl font-black mb-2 tracking-tight">{customText || selectedProduct.name}</h2>
                                    <p className="text-gray-500 text-sm">{caption}</p>
                                    <div className="mt-4 inline-block border-b-2 border-black pb-0.5 font-bold text-xs uppercase tracking-widest">
                                        Shop Now
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Gradient: Modern & Trendy */}
                        {template === 'gradient' && (
                            <div className="h-full flex flex-col items-center justify-center p-8 text-center relative">
                                <div className="absolute inset-0 bg-white/10 backdrop-blur-3xl"></div>
                                <div className="relative z-10 w-full">
                                    <div className="text-sm uppercase tracking-[0.3em] mb-4 font-bold opacity-80">New Arrival</div>
                                    <h2 className="text-5xl font-black mb-6 leading-tight drop-shadow-lg">{customText || selectedProduct.name}</h2>

                                    <div className="w-64 h-64 bg-white/20 rounded-full mx-auto mb-6 flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-2xl group">
                                        {selectedProduct.image ? (
                                            <img src={selectedProduct.image} className="w-48 h-48 object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <span className="text-4xl font-bold">₹{selectedProduct.sell_price}</span>
                                        )}
                                    </div>

                                    <div className="inline-block bg-white text-purple-600 px-6 py-2 rounded-full font-bold text-lg shadow-lg">
                                        Only ₹{selectedProduct.sell_price}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Bold: High Contrast Yellow */}
                        {template === 'bold' && (
                            <div className="h-full flex flex-col p-8 border-8 border-black">
                                <div className="bg-black text-white px-4 py-2 self-start font-black uppercase text-xl transform -rotate-2 mb-4">
                                    Flash Sale
                                </div>
                                <div className="flex-1 flex items-center justify-center border-4 border-black mb-4 bg-white overflow-hidden relative">
                                    {selectedProduct.image ? (
                                        <img src={selectedProduct.image} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-6xl font-black opacity-20">IMAGE</div>
                                    )}
                                    <div className="absolute bottom-0 right-0 bg-black text-white p-4 font-black text-4xl">
                                        ₹{selectedProduct.sell_price}
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-4xl font-black uppercase leading-none mb-2">{customText || selectedProduct.name}</h2>
                                    <p className="font-bold text-sm leading-tight max-w-[80%]">{caption}</p>
                                </div>
                            </div>
                        )}

                        {/* Festive: Elegant Green & Gold */}
                        {template === 'festive' && (
                            <div className="h-full flex flex-col p-8 relative border-[16px] border-[#d4af37]/20">
                                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')]"></div>

                                <div className="relative z-10 text-center border-b border-[#d4af37]/50 pb-6 mb-6">
                                    <div className="text-[#d4af37] font-serif italic text-xl mb-1">Special Collection</div>
                                    <h2 className="text-3xl font-serif text-[#d4af37]">{customText || selectedProduct.name}</h2>
                                </div>

                                <div className="flex-1 relative mb-6">
                                    <div className="absolute inset-4 border border-[#d4af37]/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
                                    <div className="w-full h-full flex items-center justify-center">
                                        {selectedProduct.image ? (
                                            <img src={selectedProduct.image} className="w-48 h-48 object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)]" />
                                        ) : (
                                            <div className="text-[#d4af37] text-6xl">✨</div>
                                        )}
                                    </div>
                                </div>

                                <div className="text-center relative z-10">
                                    <div className="text-[#d4af37] text-xs uppercase tracking-[0.2em] mb-2">Exclusive Offer</div>
                                    <div className="text-5xl font-serif text-white">₹{selectedProduct.sell_price}</div>
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
}
