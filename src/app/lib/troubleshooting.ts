export type Validation = { valid: boolean; errors: Record<string, string> };
export const CLAIMS = [
 { id: 'profile', label: 'Die lokale DNS-Konfiguration weicht vom freigegebenen Profil ab.', expected: 'supported', explanation: 'Das Profil nennt .53, die lokale Überschreibung verwendet .99.' },
 { id: 'https', label: 'Der HTTPS-Endpunkt antwortet vom betroffenen Client aus, wenn die Namensauflösung gezielt umgangen wird.', expected: 'supported', explanation: 'Die Kontrollprüfung erhält HTTP 200 bei erhaltenem Hostnamen, SNI und erfolgreicher Zertifikatsprüfung.' },
 { id: 'dnsStopped', label: 'Der DNS-Dienst auf .99 ist sicher gestoppt.', expected: 'unproven', explanation: 'Ein Timeout zeigt keine Antwort innerhalb der Wartezeit; die Ursache ist damit nicht bewiesen.' },
 { id: 'unreachable', label: 'Wegen der fehlenden Ping-Antworten ist der Portalserver unerreichbar.', expected: 'unproven', explanation: 'ICMP ohne Antwort beweist keine allgemeine Unerreichbarkeit. Die HTTPS-Kontrollprüfung war erfolgreich.' },
] as const;
export const DIAGNOSES = [
 { value: 'local-override', label: 'Lokale DNS-Überschreibung weicht vom freigegebenen Profil ab; sie ist der begründete erste Korrekturpunkt.' },
 { value: 'firewall', label: 'Die Firewall blockiert nachweislich jeden Zugriff auf den Portalserver.' },
 { value: 'dns-down', label: 'Der freigegebene DNS-Dienst ist nachweislich ausgefallen.' },
] as const;
export const CORRECTIONS = [
 { value: 'restore-profile', label: 'Lokale DNS-Überschreibung entfernen und das freigegebene Clientprofil mit DNS 10.20.30.53 wiederherstellen.' },
 { value: 'public-dns', label: 'Stattdessen einen öffentlichen DNS-Resolver eintragen.' },
 { value: 'disable-firewall', label: 'Die Firewall pauschal deaktivieren.' },
 { value: 'hosts', label: 'Den Portalnamen dauerhaft in der lokalen hosts-Datei fest eintragen.' },
] as const;
export const VERIFICATIONS = [
 { value: 'normal-dns-https', label: 'Namensauflösung über den normalen Clientpfad und anschließend gewöhnlichen HTTPS-Aufruf über den Portalnamen prüfen.' },
 { value: 'ping', label: 'Nur Ping wiederholen.' },
 { value: 'pinned-only', label: 'Nur die HTTPS-Kontrollprüfung mit festgelegter IP wiederholen.' },
 { value: 'assume-fixed', label: 'Ohne weitere Prüfung als behoben abschließen.' },
] as const;
export function validateDiagnosis(diagnosis: string, classifications: Record<string,string>): Validation {
 const errors: Record<string,string> = {};
 if(diagnosis !== 'local-override') errors.diagnosis = 'Wähle die Diagnose, die durch den Profilvergleich und die Kontrollprüfungen gestützt wird.';
 for(const claim of CLAIMS) if(!Object.hasOwn(classifications,claim.id) || classifications[claim.id] !== claim.expected) errors[claim.id] = claim.explanation;
 return {valid:Object.keys(errors).length===0,errors};
}
export function validateCorrection(correction: string, verification: string): Validation {
 const errors: Record<string,string> = {};
 if(correction !== 'restore-profile') errors.correction = 'Stelle das freigegebene lokale Profil wieder her. Ein öffentlicher Resolver, ein hosts-Eintrag oder das Abschalten der Firewall ist hier keine begründete Korrektur.';
 if(verification !== 'normal-dns-https') errors.verification = 'Prüfe danach normale Namensauflösung und gewöhnlichen HTTPS-Zugriff über den Namen; eine Kontrolle mit festgelegter IP umgeht den Fehlerpfad.';
 return {valid:Object.keys(errors).length===0,errors};
}
