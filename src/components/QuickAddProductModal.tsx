import React from 'react';
import { Modal } from './Modal';
import { ProductForm } from './ProductForm';
import { productService } from '../services/productService';
import toast from 'react-hot-toast';
import type { Product } from '../types/db';

interface QuickAddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: Partial<Product>;
}

export function QuickAddProductModal({ isOpen, onClose, onSuccess, initialData }: QuickAddProductModalProps) {
    const handleSubmit = async (data: any) => {
        try {
            await productService.create(data);
            toast.success("Product Created Successfully");
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to create product: " + error.message);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Product">
            <div className="max-h-[80vh] overflow-y-auto pr-2">
                <ProductForm
                    initialData={initialData}
                    onSubmit={handleSubmit}
                    onCancel={onClose}
                />
            </div>
        </Modal>
    );
}
