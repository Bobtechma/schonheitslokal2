
import React from 'react';
import { KeyRound } from 'lucide-react';

interface ApiKeyDialogProps {
    onContinue: () => void;
}

const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({ onContinue }) => {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4 animate-fade-in">
            <div className="glass-panel bg-zinc-900/95 border border-zinc-700 rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center flex flex-col items-center">
                <div className="bg-[#c55b9f]/20 p-4 rounded-full mb-6">
                    <KeyRound className="w-12 h-12 text-[#c55b9f]" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">Kostenpflichtiger API-Schlüssel erforderlich</h2>
                <p className="text-zinc-300 mb-6">
                    Diese Anwendung nutzt Premium-KI-Modelle.
                    <br />
                    Sie müssen einen <strong>API-Schlüssel eines kostenpflichtigen Google Cloud-Projekts</strong> auswählen, um fortzufahren.
                </p>
                <p className="text-zinc-400 mb-8 text-sm">
                    Kostenlose Keys funktionieren nicht. Weitere Informationen finden Sie in der{' '}
                    <a
                        href="https://ai.google.dev/gemini-api/docs/billing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#c55b9f] hover:underline font-medium"
                    >
                        Abrechnungsdokumentation
                    </a>.
                </p>
                <button
                    onClick={onContinue}
                    className="w-full px-6 py-3 bg-[#c55b9f] hover:bg-[#a44a83] text-white font-semibold rounded-lg transition-colors text-lg shadow-lg shadow-[#c55b9f]/20"
                >
                    Kostenpflichtigen API-Schlüssel wählen
                </button>
            </div>
        </div>
    );
};

export default ApiKeyDialog;
