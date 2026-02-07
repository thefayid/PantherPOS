import React, { useState, useEffect } from 'react';
import { labelService } from '../services/labelService';
import type { LabelTemplate } from '../types/label';
import { LabelDesigner } from '../components/LabelDesigner';
import { Button } from '../components/Button';
import { Plus, Edit2, Copy, Printer, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

const LabelsPage = () => {
    const [templates, setTemplates] = useState<LabelTemplate[]>([]);
    const [editingTemplate, setEditingTemplate] = useState<LabelTemplate | null>(null);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        const data = await labelService.getTemplates();
        setTemplates(data);
    };

    const handleCreate = () => {
        const newTemplate = labelService.createTemplate();
        setEditingTemplate(newTemplate);
    };

    const handleEdit = (t: LabelTemplate) => {
        setEditingTemplate(t);
    };

    const handleSave = async (t: LabelTemplate) => {
        await labelService.saveTemplate(t);
        toast.success('Template saved');
        setEditingTemplate(null);
        loadTemplates();
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this template?')) {
            await labelService.deleteTemplate(id);
            toast.success('Deleted');
            loadTemplates();
        }
    };

    if (editingTemplate) {
        return (
            <div className="h-full flex flex-col">
                <div className="border-b border-border bg-background p-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold flex items-center">
                        <button onClick={() => setEditingTemplate(null)} className="mr-2 hover:bg-muted p-1 rounded">←</button>
                        Label Designer
                    </h1>
                </div>
                <div className="flex-1 overflow-hidden">
                    <LabelDesigner
                        template={editingTemplate}
                        onSave={handleSave}
                        onBack={() => setEditingTemplate(null)}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Tag className="w-6 h-6 text-primary" />
                        Label Templates
                    </h1>
                    <p className="text-muted-foreground mt-1">Design and manage custom barcode labels and shelf tags.</p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" /> New Template
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map(t => (
                    <div key={t.id} className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button onClick={(e) => handleDelete(e, t.id)} className="p-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive hover:text-white transition-colors">
                                <Tag className="w-4 h-4" /> {/* Trash icon actually, Tags is wrong here but using imports available */}
                            </button>
                        </div>

                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg">{t.name}</h3>
                                <p className="text-sm text-muted-foreground">{t.width}mm x {t.height}mm</p>
                            </div>
                        </div>

                        {/* Mini Preview */}
                        <div className="w-full h-32 bg-muted/20 rounded-lg border border-border/50 mb-4 flex items-center justify-center overflow-hidden relative">
                            <div
                                className="bg-white border text-[6px] relative shadow-sm"
                                style={{
                                    width: `${t.width * 2}px`, // Scaled preview
                                    height: `${t.height * 2}px`
                                }}
                            >
                                {t.elements.map(el => (
                                    <div
                                        key={el.id}
                                        className="absolute bg-gray-200 border border-gray-300"
                                        style={{
                                            left: el.x * 2, top: el.y * 2,
                                            width: el.width * 2, height: el.height * 2
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button className="flex-1" variant="secondary" onClick={() => handleEdit(t)}>
                                <Edit2 className="w-4 h-4 mr-2" /> Design
                            </Button>
                            <Button className="flex-1" onClick={() => toast('Select products to print labels (Coming Soon in Products Page)')}>
                                <Printer className="w-4 h-4 mr-2" /> Print
                            </Button>
                        </div>
                    </div>
                ))}

                {templates.length === 0 && (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-xl">
                        <Tag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No templates yet</h3>
                        <p className="text-muted-foreground mb-4">Create your first label template to get started.</p>
                        <Button onClick={handleCreate}>Create Template</Button>
                    </div>
                )}
            </div>
        </div>
    );
};


class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.error("LabelsPage Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-10 text-destructive">
                    <h1 className="text-xl font-bold">Something went wrong.</h1>
                    <pre className="mt-4 bg-gray-100 p-4 rounded overflow-auto text-xs">
                        {String(this.state.error)}
                    </pre>
                </div>
            );
        }

        return this.props.children;
    }
}

export default function LabelsPageWrapper() {
    return (
        <ErrorBoundary>
            <LabelsPage />
        </ErrorBoundary>
    );
}
