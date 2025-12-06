import Header from '@/components/Header'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="container mx-auto px-4 py-24 max-w-4xl">
                <Link to="/" className="inline-flex items-center text-pink-600 hover:text-pink-700 mb-8">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Zurück zur Startseite
                </Link>

                <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">Allgemeine Geschäftsbedingungen (AGB)</h1>

                    <div className="prose prose-pink max-w-none text-gray-600 space-y-6">
                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Geltungsbereich</h2>
                            <p>
                                Diese Allgemeinen Geschäftsbedingungen gelten für alle Dienstleistungen und Produkte,
                                die von SchönheitsLokal (nachfolgend "Salon" genannt) angeboten werden.
                                Mit der Buchung eines Termins akzeptieren Sie diese Bedingungen.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Termine und Stornierungen</h2>
                            <p>
                                Termine können online, telefonisch oder vor Ort vereinbart werden.
                                Wir bitten Sie, vereinbarte Termine pünktlich einzuhalten.
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Stornierungen müssen mindestens 24 Stunden vor dem Termin erfolgen.</li>
                                <li>Bei verspäteter Stornierung oder Nichterscheinen behalten wir uns vor, 50% des Behandlungspreises in Rechnung zu stellen.</li>
                                <li>Bei Verspätungen von mehr als 15 Minuten kann die Behandlung möglicherweise nicht oder nur verkürzt durchgeführt werden.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Preise und Bezahlung</h2>
                            <p>
                                Es gelten die Preise zum Zeitpunkt der Buchung. Alle Preise verstehen sich in Schweizer Franken (CHF)
                                inklusive der gesetzlichen Mehrwertsteuer. Die Bezahlung erfolgt unmittelbar nach der Behandlung
                                vor Ort (Bar, Karte oder TWINT).
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Gutscheine</h2>
                            <p>
                                Gutscheine sind ab Ausstellungsdatum 12 Monate gültig. Eine Barauszahlung ist nicht möglich.
                                Bei Verlust wird kein Ersatz geleistet.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Haftung</h2>
                            <p>
                                Der Salon haftet nur für Schäden, die auf grobe Fahrlässigkeit oder Vorsatz zurückzuführen sind.
                                Für persönliche Gegenstände der Kunden wird keine Haftung übernommen.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Gesundheitsfragen</h2>
                            <p>
                                Kunden sind verpflichtet, vor der Behandlung auf bestehende Krankheiten, Allergien oder
                                andere gesundheitliche Einschränkungen hinzuweisen, die die Behandlung beeinträchtigen könnten.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Gerichtsstand</h2>
                            <p>
                                Es gilt schweizerisches Recht. Gerichtsstand ist Zürich.
                            </p>
                        </section>

                        <div className="pt-8 text-sm text-gray-500 border-t">
                            Stand: Dezember 2025
                        </div>
                    </div>
                </div>
            </main>

            <footer className="bg-gray-800 text-white py-8 text-center">
                <p>&copy; 2025 SchönheitsLokal. Alle Rechte vorbehalten.</p>
            </footer>
        </div>
    )
}
