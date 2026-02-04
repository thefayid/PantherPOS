
export const productImageFetcher = {
    fetchProductByBarcode: async (barcode: string): Promise<{ name?: string, imageBase64?: string } | null> => {
        if (!barcode || barcode.length < 8) return null;

        try {
            const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`, {
                headers: {
                    'User-Agent': 'PantherPOS/1.0 (internal-dev)'
                }
            });

            if (!response.ok) return null;

            const data = await response.json();
            if (data.status !== 1 || !data.product) return null;

            const product = data.product;
            const imageUrl = product.image_url || product.image_front_url;
            const name = product.product_name || product.product_name_en;

            let imageBase64 = undefined;

            if (imageUrl) {
                try {
                    // Fetch the actual image data
                    const imgRes = await fetch(imageUrl);
                    const blob = await imgRes.blob();

                    // Convert to Base64
                    imageBase64 = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });
                } catch (imgErr) {
                    console.error('Failed to download/convert image:', imgErr);
                }
            }

            return {
                name,
                imageBase64
            };

        } catch (error) {
            console.error('OpenFoodFacts API Error:', error);
            return null;
        }
    }
};
