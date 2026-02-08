import { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Gift, PartyPopper, Rocket } from 'lucide-react';
import { Button } from '../Button';
import { promotionService } from '../../services/promotionService';
import toast from 'react-hot-toast';

interface MarketingEvent {
    id: string;
    date: string; // MM-DD format
    name: string;
    type: 'FESTIVAL' | 'NATIONAL' | 'SEASONAL';
    suggestedCode: string;
    suggestedDiscount: number;
    description: string;
}

// Static Data for Indian Context
const EVENTS: MarketingEvent[] = [
    { id: '1', date: '01-26', name: 'Republic Day', type: 'NATIONAL', suggestedCode: 'JAIHIND', suggestedDiscount: 26, description: 'Celebrate the constitution with a patriotic sale.' },
    { id: '2', date: '08-15', name: 'Independence Day', type: 'NATIONAL', suggestedCode: 'FREEDOM', suggestedDiscount: 15, description: 'Freedom sale for your customers.' },
    { id: '3', date: '10-02', name: 'Gandhi Jayanti', type: 'NATIONAL', suggestedCode: 'PEACE', suggestedDiscount: 10, description: 'Special offer to honor the Mahatma.' },
    { id: '4', date: '11-01', name: 'Diwali (Deepavali)', type: 'FESTIVAL', suggestedCode: 'LIGHTS24', suggestedDiscount: 20, description: 'Festival of lights special offer.' },
    { id: '5', date: '12-25', name: 'Christmas', type: 'FESTIVAL', suggestedCode: 'SANTA', suggestedDiscount: 25, description: 'End of year holiday cheer.' },
    { id: '6', date: '01-01', name: 'New Year', type: 'SEASONAL', suggestedCode: 'NEWYEAR', suggestedDiscount: 10, description: 'Start the year with a bang.' },
    { id: '7', date: '02-14', name: 'Valentine\'s Day', type: 'SEASONAL', suggestedCode: 'LOVE', suggestedDiscount: 14, description: 'For the ones they love.' },
    { id: '8', date: '03-08', name: 'Women\'s Day', type: 'SEASONAL', suggestedCode: 'WOMEN', suggestedDiscount: 15, description: 'Celebrate women power.' },
    { id: '9', date: '03-25', name: 'Holi', type: 'FESTIVAL', suggestedCode: 'COLORS', suggestedDiscount: 10, description: 'Splash of discounts for Holi.' } // Approximate date
];

export function EventCalendar() {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();

    const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' });

    const prevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const nextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const launchPromo = async (evt: MarketingEvent) => {
        if (!confirm(`Launch "${evt.name}" Promotion?\n\nCode: ${evt.suggestedCode}\nDiscount: ${evt.suggestedDiscount}%\n\nThis will create an active coupon instantly.`)) return;

        try {
            const startDate = new Date().toISOString().split('T')[0];
            // End date 7 days from now
            const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            await promotionService.createPromotion({
                name: `${evt.name} Sale`,
                type: 'COUPON',
                code: evt.suggestedCode,
                discount_type: 'PERCENT',
                discount_value: evt.suggestedDiscount,
                min_cart_value: 0,
                max_discount: 0,
                start_date: startDate,
                end_date: endDate,
                active: true,
                description: evt.description
            });

            toast.success(`🚀 ${evt.suggestedCode} Launched Successfully!`);
        } catch (e) {
            console.error(e);
            toast.error('Failed to launch promotion');
        }
    };

    const renderDays = () => {
        const days = [];
        // Empty slots for prev month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-32 bg-muted/5 border-b border-r border-border"></div>);
        }

        // Days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const event = EVENTS.find(e => e.date === dateStr);
            const isToday = d === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

            days.push(
                <div key={d} className={`h-32 border-b border-r border-border p-2 relative group hover:bg-muted/10 transition-colors ${isToday ? 'bg-primary/5' : ''}`}>
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-muted-foreground'}`}>
                        {d}
                    </div>

                    {event && (
                        <div className="absolute inset-x-1 bottom-1 top-8">
                            <div className={`h-full rounded-lg p-2 flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-transform shadow-sm ${event.type === 'NATIONAL' ? 'bg-orange-100 border border-orange-200 text-orange-800' :
                                    event.type === 'FESTIVAL' ? 'bg-purple-100 border border-purple-200 text-purple-800' :
                                        'bg-pink-100 border border-pink-200 text-pink-800'
                                }`}>
                                <div>
                                    <div className="text-xs font-bold truncate flex items-center gap-1">
                                        {event.type === 'FESTIVAL' ? <PartyPopper size={10} /> : <Gift size={10} />}
                                        {event.name}
                                    </div>
                                    <div className="text-[10px] opacity-80 mt-1 leading-tight line-clamp-2">
                                        {event.description}
                                    </div>
                                </div>
                                <Button size="sm" className="w-full text-[10px] h-6 bg-white/50 hover:bg-white text-black border-0" onClick={() => launchPromo(event)}>
                                    <Rocket size={10} className="mr-1" /> Launch {event.suggestedDiscount}% Off
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return days;
    };

    return (
        <div className="h-full flex flex-col bg-background animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-surface">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <CalendarIcon className="text-primary" /> Marketing Calendar
                    </h2>
                    <p className="text-muted-foreground text-sm">Plan ahead and automate your festival sales.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-muted rounded-lg p-1">
                        <button onClick={prevMonth} className="p-2 hover:bg-background rounded-md transition-colors"><ChevronLeft size={16} /></button>
                        <div className="px-4 py-2 font-bold min-w-[120px] text-center">{monthName} {currentYear}</div>
                        <button onClick={nextMonth} className="p-2 hover:bg-background rounded-md transition-colors"><ChevronRight size={16} /></button>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-auto bg-surface">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 border-b border-border bg-muted/20">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="p-3 text-center text-xs font-bold uppercase text-muted-foreground tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7">
                    {renderDays()}
                </div>
            </div>
        </div>
    );
}
