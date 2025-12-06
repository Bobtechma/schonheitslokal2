import Header from '@/components/Header'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="container mx-auto px-4 py-24 max-w-4xl">
                <Link to="/" className="inline-flex items-center text-pink-600 hover:text-pink-700 mb-8">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Zurück zur Startseite
                </Link>

                <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">Datenschutzerklärung</h1>

                    <div className="prose prose-pink max-w-none text-gray-600 space-y-6">
                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Einleitung</h2>
                            <p>
                                Der Schutz Ihrer Privatsphäre ist uns wichtig. Diese Datenschutzerklärung erläutert,
                                wie SchönheitsLokal ("wir") personenbezogene Daten erhebt, verwendet und schützt.
                                Wir halten uns an die Bestimmungen des Schweizerischen Datenschutzgesetzes (DSG).
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Erhebung von Daten</h2>
                            <p>
                                Wir erheben folgende personenbezogene Daten, wenn Sie unsere Dienste nutzen:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Kontaktinformationen (Name, Telefonnummer, E-Mail-Adresse)</li>
                                <li>Termindaten und Behandlungshistorie</li>
                                <li>Gesundheitsinformationen (sofern für die Behandlung relevant, z.B. Allergien)</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Verwendung der Daten</h2>
                            <p>
                                Ihre Daten werden ausschliesslich für folgende Zwecke verwendet:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Terminvereinbarung und -verwaltung</li>
                                <li>Durchführung der gewünschten Dienstleistungen</li>
                                <li>Kommunikation (z.B. Terminerinnerungen)</li>
                                <li>Verbesserung unseres Serviceangebots</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Datensicherheit</h2>
                            <p>
                                Wir treffen angemessene technische und organisatorische Massnahmen, um Ihre Daten vor Verlust,
                                Missbrauch und unbefugtem Zugriff zu schützen. Ihre Daten werden vertraulich behandelt
                                und nicht an Dritte weitergegeben, es sei denn, dies ist gesetzlich vorgeschrieben.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Ihre Rechte</h2>
                            <p>
                                Sie haben das Recht, jederzeit Auskunft über Ihre bei uns gespeicherten Daten zu verlangen.
                                Zudem können Sie die Berichtigung oder Löschung Ihrer Daten fordern, sofern keine gesetzlichen
                                Aufbewahrungspflichten entgegenstehen.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Kontakt</h2>
                            <p>
                                Bei Fragen zum Datenschutz können Sie uns unter folgender Adresse erreichen:
                            </p>
                            <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                                <p className="font-medium">SchönheitsLokal</p>
                                <p>Kalkbreitestrasse 129</p>
                                <p>8003 Zürich</p>
                                <p>E-Mail: schonheitlokal@gmail.com</p>
                            </div>
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
