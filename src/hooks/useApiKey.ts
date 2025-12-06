
import { useCallback, useEffect, useState } from 'react';

interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
}

export const useApiKey = () => {
    const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);

    const validateApiKey = useCallback(async (): Promise<boolean> => {
        // Check if we have an env var key first
        if (import.meta.env.VITE_GOOGLE_API_KEY) return true;

        const aistudio = (window as any).aistudio as AIStudio | undefined;

        if (aistudio) {
            try {
                const hasKey = await aistudio.hasSelectedApiKey();
                if (!hasKey) {
                    setShowApiKeyDialog(true);
                    return false;
                }
            } catch (error) {
                console.warn('API Key check failed', error);
                setShowApiKeyDialog(true);
                return false;
            }
        }
        return true;
    }, []);

    // Run check automatically on mount
    useEffect(() => {
        validateApiKey();
    }, [validateApiKey]);

    const handleApiKeyDialogContinue = useCallback(async () => {
        setShowApiKeyDialog(false);
        const aistudio = (window as any).aistudio as AIStudio | undefined;
        if (aistudio) {
            await aistudio.openSelectKey();
        }
    }, []);

    return {
        showApiKeyDialog,
        setShowApiKeyDialog,
        validateApiKey,
        handleApiKeyDialogContinue,
    };
};
