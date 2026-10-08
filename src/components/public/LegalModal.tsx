import React, { useState, useEffect } from 'react';
import { X, Shield, FileText, Lock, Cookie, Scale, CheckCircle2, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type LegalDocType = 'PRIVACY' | 'COOKIES' | 'ARCO' | 'TERMS' | 'AUP' | 'DOMAIN_AGREEMENT';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDoc?: LegalDocType;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialDoc = 'PRIVACY'
}) => {
  const [activeDoc, setActiveDoc] = useState<LegalDocType>(initialDoc);
  const { language } = useApp();
  const EN = language === 'en';

  useEffect(() => {
    if (initialDoc) {
      setActiveDoc(initialDoc);
    }
  }, [initialDoc]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#FCFCF8] border border-[#8A8F98] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#8A8F98] bg-[#F7F8F0]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#B8F23A] text-[#070707]">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#070707]">
                {EN ? 'Banelio Legal Framework' : 'Marco Legal y Normativo de Banelio'}
              </h3>
              <p className="text-xs text-[#555A52]">
                {EN
                  ? 'In accordance with Mexican legislation (LFPDPPP, INAI, Profeco, Commercial Code and NOM-151)'
                  : 'Conforme a la legislación de los Estados Unidos Mexicanos (LFPDPPP, INAI, Profeco, Código de Comercio y NOM-151)'}
              </p>
            </div>
          </div>
          
          <button
            id="legal-modal-close-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-[#555A52] hover:text-[#070707] hover:bg-[#8A8F98] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content with Sidebar Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-4 flex-1 overflow-hidden">
          
          {/* Navigation Sidebar */}
          <div className="p-4 border-r border-[#8A8F98] bg-[#F4F6EC] space-y-1.5 overflow-y-auto">
            <p className="text-[11px] font-bold text-[#858A82] uppercase tracking-wider px-3 mb-2">
              {EN ? 'Official Documents' : 'Documentos Oficiales'}
            </p>
            
            <button
              id="legal-nav-privacy"
              onClick={() => setActiveDoc('PRIVACY')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeDoc === 'PRIVACY'
                  ? 'bg-[#B8F23A] text-[#070707] shadow-xs'
                  : 'text-[#555A52] hover:bg-[#8A8F98] hover:text-[#070707]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>{EN ? 'Privacy Notice' : 'Aviso de Privacidad'}</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              id="legal-nav-cookies"
              onClick={() => setActiveDoc('COOKIES')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeDoc === 'COOKIES'
                  ? 'bg-[#B8F23A] text-[#070707] shadow-xs'
                  : 'text-[#555A52] hover:bg-[#8A8F98] hover:text-[#070707]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Cookie className="w-4 h-4" />
                <span>{EN ? 'Cookie Policy' : 'Aviso de Cookies'}</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              id="legal-nav-arco"
              onClick={() => setActiveDoc('ARCO')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeDoc === 'ARCO'
                  ? 'bg-[#B8F23A] text-[#070707] shadow-xs'
                  : 'text-[#555A52] hover:bg-[#8A8F98] hover:text-[#070707]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span>{EN ? 'ARCO Rights (INAI)' : 'Derechos ARCO (INAI)'}</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              id="legal-nav-terms"
              onClick={() => setActiveDoc('TERMS')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeDoc === 'TERMS'
                  ? 'bg-[#B8F23A] text-[#070707] shadow-xs'
                  : 'text-[#555A52] hover:bg-[#8A8F98] hover:text-[#070707]'
              }`}
            >
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>{EN ? 'Terms & SLA 99.9%' : 'Términos y SLA 99.9%'}</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              id="legal-nav-aup"
              onClick={() => setActiveDoc('AUP')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeDoc === 'AUP'
                  ? 'bg-[#B8F23A] text-[#070707] shadow-xs'
                  : 'text-[#555A52] hover:bg-[#8A8F98] hover:text-[#070707]'
              }`}
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{EN ? 'Acceptable Use (AUP)' : 'Uso Aceptable (AUP)'}</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              id="legal-nav-domain"
              onClick={() => setActiveDoc('DOMAIN_AGREEMENT')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeDoc === 'DOMAIN_AGREEMENT'
                  ? 'bg-[#B8F23A] text-[#070707] shadow-xs'
                  : 'text-[#555A52] hover:bg-[#8A8F98] hover:text-[#070707]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Scale className="w-4 h-4" />
                <span>{EN ? 'Domain Agreement ICANN' : 'Contrato Dominios ICANN'}</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>

          {/* Document Reader Area */}
          <div className="md:col-span-3 p-6 sm:p-8 overflow-y-auto max-h-[calc(90vh-140px)] text-sm text-[#353A32] space-y-6 leading-relaxed bg-[#FFFFFF]">
            
            {activeDoc === 'PRIVACY' && (
              <div className="space-y-6">
                <div className="border-b border-[#8A8F98] pb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#B8F23A]">
                    {EN ? 'LFPDPPP · INAI · Mexican Federal Legislation' : 'LFPDPPP &middot; INAI &middot; Legislación Federal Mexicana'}
                  </span>
                  <h2 className="text-2xl font-black text-[#070707] mt-1">
                    {EN ? 'Comprehensive Privacy Notice' : 'Aviso de Privacidad Integral'}
                  </h2>
                  <p className="text-xs text-[#858A82] mt-1">{EN ? 'Effective 2026. Banelio · try@banelio.com' : 'Vigente 2026. Banelio &middot; try@banelio.com'}</p>
                </div>

                {EN ? (
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-[#070707]">1. Identity and Address of the Responsible Party</h3>
                    <p>
                      <strong>Banelio</strong> ("Banelio"), official website <code>https://banelio.com</code> and electronic contact <code>try@banelio.com</code>, is responsible for the use, processing, confidentiality and safeguarding of your personal data, in strict compliance with Articles 15, 16, 17 and related provisions of the Mexican <em>Federal Law on the Protection of Personal Data Held by Private Parties (LFPDPPP)</em> and its Regulations issued by the National Institute for Transparency, Access to Information and Personal Data Protection (INAI).
                    </p>

                    <h3 className="text-base font-bold text-[#070707]">2. Personal Data Collected</h3>
                    <p>For the contracting and technical provisioning of infrastructure, we collect the following categories of data:</p>
                    <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                      <li><strong>Legal identification data:</strong> Full name, company name, tax ID (RFC with homoclave) and unique population registry code (CURP).</li>
                      <li><strong>Location and contact data:</strong> Administrative and technical email, mobile or landline phone number, and fiscal/notification address.</li>
                      <li><strong>Financial and tax data:</strong> SAT tax status statement, tax regime, CFDI 4.0 usage, billing history and bank transactions. <em>Banelio does not process or store full credit card numbers or CVV/CVC security codes, which are handled exclusively by PCI-DSS Level 1 certified payment gateways (Stripe, SPEI, OXXO Pay, PayPal).</em></li>
                      <li><strong>Technical and network records:</strong> Connection IP addresses, SSH/cPanel/Webmail access logs, Anycast DNS queries, SMTP email headers and TLS cryptographic fingerprints.</li>
                    </ul>

                    <h3 className="text-base font-bold text-[#070707]">3. Primary Purposes of Data Processing</h3>
                    <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                      <li>Registration and delegation of domain names with the Internet Corporation for Assigned Names and Numbers (ICANN) and NIC Mexico (Registry .MX).</li>
                      <li>Automated provisioning of Cloud NVMe servers, corporate email accounts and issuance of SSL certificates with RSA 2048/4096-bit encryption.</li>
                      <li>Issuance and digital stamping of electronic tax receipts (CFDI version 4.0) in accordance with the Federal Tax Code (CFF).</li>
                      <li>Mandatory technical security notices, domain expiration alerts and business continuity (SLA) alerts.</li>
                    </ul>

                    <h3 className="text-base font-bold text-[#070707]">4. National and International Data Transfers</h3>
                    <p>
                      Under Article 37 of the LFPDPPP, data transfers are carried out without additional consent only when necessary to fulfill the infrastructure contracts requested by the user, such as transmission to ICANN-accredited Registrars and SSL Certificate Authorities.
                    </p>

                    <h3 className="text-base font-bold text-[#070707]">5. Information Security Measures</h3>
                    <p>
                      Banelio implements administrative, technical and physical controls under the ISO/IEC 27001 standard, including AES-256 encryption at rest, TLS 1.3 in transit, multi-factor authentication (2FA) and CloudLinux CageFS isolation to prevent unauthorized access or security breaches.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-[#070707]">1. Identidad y Domicilio del Responsable</h3>
                  <p>
                    <strong>Banelio</strong> (en lo sucesivo "Banelio"), con portal web oficial <code>https://banelio.com</code> y dirección de contacto electrónico <code>try@banelio.com</code>, es responsable del uso, tratamiento, confidencialidad y resguardo de sus datos personales, en estricto apego a los Artículos 15, 16, 17 y correlativos de la <em>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</em> y su Reglamento expedido por el Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales (INAI).
                  </p>

                  <h3 className="text-base font-bold text-slate-900 font-bold">2. Datos Personales Recabados</h3>
                  <p>Para la contratación y provisión técnica de infraestructura, recabamos las siguientes categorías de datos:</p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                    <li><strong>Datos de Identificación Legal:</strong> Nombre completo, Razón Social o Denominación, Registro Federal de Contribuyentes (RFC) con homoclave, y Clave Única de Registro de Población (CURP).</li>
                    <li><strong>Datos de Localización y Contacto:</strong> Correo electrónico administrativo y técnico, número telefónico celular o fijo, domicilio fiscal o de notificación (calle, número, colonia, alcaldía o municipio, código postal y entidad federativa).</li>
                    <li><strong>Datos Patrimoniales y Fiscales:</strong> Constancia de Situación Fiscal (SAT), régimen fiscal, uso de CFDI 4.0, historial de facturación y transacciones bancarias. <em>Banelio no procesa ni almacena directamente números completos de tarjetas de crédito o códigos de seguridad CVV/CVC, los cuales son gestionados exclusivamente por pasarelas de pago certificadas PCI-DSS Nivel 1 (Stripe, SPEI, OXXO Pay, PayPal).</em></li>
                    <li><strong>Registros Técnicos y Telemáticos:</strong> Direcciones IP de conexión, logs de acceso SSH/cPanel/Webmail, consultas a servidores DNS Anycast, encabezados de correo SMTP y huellas digitales criptográficas TLS.</li>
                  </ul>

                  <h3 className="text-base font-bold text-[#070707]">3. Finalidades Primarias del Tratamiento</h3>
                  <p>Los datos recabados son indispensables para cumplir las siguientes finalidades primarias y necesarias:</p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                    <li>Registro y delegación oficial de nombres de dominio ante la Corporación de Internet para la Asignación de Nombres y Números (ICANN) y NIC México (Registry .MX).</li>
                    <li>Aprovisionamiento automatizado de servidores Cloud NVMe, cuentas de correo empresarial y emisión de certificados SSL con cifrado RSA 2048/4096 bits.</li>
                    <li>Emisión y timbrado digital de Comprobantes Fiscales Digitales por Internet (CFDI versión 4.0) conforme a las disposiciones del Código Fiscal de la Federación (CFF).</li>
                    <li>Notificaciones obligatorias de seguridad técnica, vencimientos de dominio y alertas de continuidad de negocio (SLA).</li>
                  </ul>

                  <h3 className="text-base font-bold text-[#070707]">4. Transferencia Nacional e Internacional de Datos</h3>
                  <p>
                    De conformidad con el Artículo 37 de la LFPDPPP, las transferencias de datos se realizan sin requerir consentimiento adicional únicamente cuando sean necesarias para el cumplimiento de los contratos de provisión de infraestructura solicitados por el usuario, tales como la transmisión a Registrars Acreditados por la ICANN y Autoridades Certificadoras SSL (Sectigo/Comodo).
                  </p>

                  <h3 className="text-base font-bold text-[#070707]">5. Medidas de Seguridad de la Información</h3>
                  <p>
                    Banelio implementa controles administrativos, técnicos y físicos conforme al estándar ISO/IEC 27001, incluyendo cifrado AES-256 en reposo, tránsito TLS 1.3, autenticación multifactor (2FA) y aislamiento CloudLinux CageFS para prevenir accesos no autorizados o vulneraciones de seguridad.
                  </p>
                </div>
              )}
            </div>
            )}

            {activeDoc === 'COOKIES' && (
              <div className="space-y-6">
                <div className="border-b border-[#8A8F98] pb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#B8F23A]">
                    {EN ? 'Digital Privacy & Cookie Policies' : 'Políticas de Privacidad Digital y Cookies'}
                  </span>
                  <h2 className="text-2xl font-black text-[#070707] mt-1">
                    {EN ? 'Cookie and Local Storage Policy' : 'Política de Cookies y Almacenamiento Local'}
                  </h2>
                  <p className="text-xs text-[#858A82] mt-1">{EN ? 'In accordance with INAI and PROFECO informed consent guidelines' : 'Conforme a las directrices de consentimiento informado del INAI y la PROFECO'}</p>
                </div>

                {EN ? (
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-[#070707]">1. Definition and Technical Scope</h3>
                    <p>
                      Cookies, web beacons and local storage (LocalStorage/IndexedDB) are browser persistence technologies that enable Banelio to optimize domain quotation response times, keep active shopping carts and protect authenticated sessions against Cross-Site Request Forgery (CSRF) attacks.
                    </p>

                    <h3 className="text-base font-bold text-[#070707]">2. Classification of Cookies Used</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-3">
                      <div className="p-4 rounded-2xl bg-[#F7F8F0] border border-[#8A8F98]">
                        <h4 className="font-bold text-[#070707] text-xs flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-[#B8F23A]" />
                          <span>Essential Technical Cookies</span>
                        </h4>
                        <p className="text-xs text-[#555A52] mt-1">
                          Strictly necessary for navigation, shopping cart persistence, JWT authentication and currency selection (MXN/USD). Cannot be disabled in our systems.
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#F7F8F0] border border-[#8A8F98]">
                        <h4 className="font-bold text-[#070707] text-xs flex items-center gap-1.5">
                          <Cookie className="w-3.5 h-3.5 text-[#B8F23A]" />
                          <span>Analytics & Performance Cookies</span>
                        </h4>
                        <p className="text-xs text-[#555A52] mt-1">
                          Collect network latency metrics in an aggregated and anonymous manner to optimize load distribution across Anycast servers.
                        </p>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-[#070707]">3. Control and Disabling in Browsers</h3>
                    <p>
                      Users may at any time restrict, block or delete cookies by configuring the privacy options of their web browser (Google Chrome, Mozilla Firefox, Apple Safari, Microsoft Edge). Note that disabling essential technical cookies may prevent the shopping cart and administration console from working.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-[#070707]">1. Definición y Alcance Tecnológico</h3>
                  <p>
                    Las cookies, balizas web (web beacons) y almacenes locales (LocalStorage/IndexedDB) son tecnologías de persistencia en el navegador que permiten a Banelio optimizar los tiempos de respuesta del cotizador de dominios, mantener carritos de compras activos y proteger las sesiones autenticadas contra ataques Cross-Site Request Forgery (CSRF).
                  </p>

                  <h3 className="text-base font-bold text-[#070707]">2. Clasificación de Cookies Empleadas</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-3">
                    <div className="p-4 rounded-2xl bg-[#F7F8F0] border border-[#8A8F98]">
                      <h4 className="font-bold text-[#070707] text-xs flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-[#B8F23A]" />
                        <span>Cookies Técnicas y Esenciales</span>
                      </h4>
                      <p className="text-xs text-[#555A52] mt-1">
                        Estrictamente indispensables para la navegación, persistencia de ítems en carrito, autenticación con JWT y selección de divisa (MXN/USD). No pueden desactivarse en los sistemas.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#F7F8F0] border border-[#8A8F98]">
                      <h4 className="font-bold text-[#070707] text-xs flex items-center gap-1.5">
                        <Cookie className="w-3.5 h-3.5 text-[#B8F23A]" />
                        <span>Cookies Analíticas y de Rendimiento</span>
                      </h4>
                      <p className="text-xs text-[#555A52] mt-1">
                        Recopilan métricas de latencia de red de manera agregada y anónima para optimizar la distribución de carga en servidores Anycast.
                      </p>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-[#070707]">3. Control y Desactivación en Navegadores</h3>
                  <p>
                    El usuario puede en cualquier momento restringir, bloquear o borrar las cookies configurando las opciones de privacidad de su navegador web (Google Chrome, Mozilla Firefox, Apple Safari, Microsoft Edge). Tenga en cuenta que la inhabilitación de cookies técnicas esenciales podría impedir el funcionamiento del carrito de compras y la consola de administración.
                  </p>
                </div>
              )}
            </div>
            )}

            {activeDoc === 'ARCO' && (
              <div className="space-y-6">
                <div className="border-b border-[#8A8F98] pb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#B8F23A]">
                    {EN ? 'National Institute for Transparency, Access to Information and Personal Data Protection' : 'Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales'}
                  </span>
                  <h2 className="text-2xl font-black text-[#070707] mt-1">
                    {EN ? 'Procedure for Exercising ARCO Rights' : 'Procedimiento para el Ejercicio de Derechos ARCO'}
                  </h2>
                  <p className="text-xs text-[#858A82] mt-1">{EN ? 'Access, Rectification, Cancellation and Opposition of Personal Data' : 'Acceso, Rectificación, Cancelación y Oposición de Datos Personales'}</p>
                </div>

                {EN ? (
                  <div className="space-y-4">
                    <p>
                      In accordance with Title Three of the LFPDPPP, any data subject or their duly accredited legal representative may exercise their rights of <strong>Access</strong>, <strong>Rectification</strong>, <strong>Cancellation</strong> or <strong>Opposition</strong> (ARCO rights), as well as revoke the consent granted for the processing of their information.
                    </p>

                    <h3 className="text-base font-bold text-[#070707]">Official Request Mechanism</h3>
                    <div className="p-4 rounded-2xl bg-[#F7F8F0] border border-[#8A8F98] space-y-2">
                      <p className="text-xs text-[#070707] font-semibold">To process your request, please send an email to:</p>
                      <div className="flex items-center gap-2">
                        <span className="bg-[#B8F23A] text-[#070707] font-mono font-black text-xs px-3 py-1 rounded-xl">
                          try@banelio.com
                        </span>
                      </div>
                      <p className="text-xs text-[#555A52]">Subject: "ARCO Rights Request - [Full Name or Company Name]"</p>
                    </div>

                    <h3 className="text-base font-bold text-[#070707]">Admissibility Requirements (Article 29 LFPDPPP)</h3>
                    <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm">
                      <li><strong>Proof of ownership:</strong> Attach a scanned copy of a current official ID (INE voter ID or Mexican passport). For legal entities, the notarized power of attorney of the legal representative.</li>
                      <li><strong>Clear and precise description:</strong> Specify which personal data the ARCO right applies to and the legal basis of the request.</li>
                      <li><strong>Supporting documents (where applicable):</strong> For Rectification, provide the fiscal or legal documentation evidencing the requested change.</li>
                    </ol>

                    <h3 className="text-base font-bold text-[#070707]">Legal Response Deadlines</h3>
                    <p>
                      Banelio will notify the data subject within a maximum of <strong>twenty (20) business days</strong> from the formal receipt of the request of the determination adopted, so that, if deemed appropriate, it may be effective within <strong>fifteen (15) business days</strong> following the day the response is communicated.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p>
                      De acuerdo con el Título Tercero de la LFPDPPP, todo titular de datos personales o su representante legal debidamente acreditado podrá ejercer sus derechos de <strong>Acceso</strong>, <strong>Rectificación</strong>, <strong>Cancelación</strong> u <strong>Oposición</strong> (Derechos ARCO), así como revocar el consentimiento otorgado para el tratamiento de su información.
                  </p>

                  <h3 className="text-base font-bold text-[#070707]">Mecanismo Oficial de Solicitud</h3>
                  <div className="p-4 rounded-2xl bg-[#F7F8F0] border border-[#8A8F98] space-y-2">
                    <p className="text-xs text-[#070707] font-semibold">Para dar trámite a su solicitud, deberá enviar un correo a:</p>
                    <div className="flex items-center gap-2">
                      <span className="bg-[#B8F23A] text-[#070707] font-mono font-black text-xs px-3 py-1 rounded-xl">
                        try@banelio.com
                      </span>
                    </div>
                    <p className="text-xs text-[#555A52]">Asunto: "Solicitud de Derechos ARCO - [Nombre Completo o Razón Social]"</p>
                  </div>

                  <h3 className="text-base font-bold text-[#070707]">Requisitos de Procedencia (Artículo 29 LFPDPPP)</h3>
                  <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm">
                    <li><strong>Acreditación de Titularidad:</strong> Adjuntar copia digitalizada de identificación oficial vigente (Credencial para Votar INE o Pasaporte mexicano). En caso de personas morales, poder notarial del apoderado legal.</li>
                    <li><strong>Descripción Clara y Precisa:</strong> Señalar puntualmente los datos personales respecto de los que se busca ejercer alguno de los derechos ARCO y la motivación jurídica de la solicitud.</li>
                    <li><strong>Documentos de Soporte (en su caso):</strong> Tratándose de Rectificación, aportar la documentación fiscal o legal que acredite la modificación solicitada.</li>
                  </ol>

                  <h3 className="text-base font-bold text-[#070707]">Plazos Legales de Respuesta</h3>
                  <p>
                    Banelio comunicará al titular en un plazo máximo de <strong>veinte (20) días hábiles</strong>, contados desde la fecha en que se recibió formalmente la solicitud, la determinación adoptada, a efecto de que, si resulta procedente, se haga efectiva la misma dentro de los <strong>quince (15) días hábiles</strong> siguientes a la fecha en que se comunica la respuesta.
                  </p>
                </div>
              )}
            </div>
            )}

            {activeDoc === 'TERMS' && (
              <div className="space-y-6">
                <div className="border-b border-[#8A8F98] pb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#B8F23A]">
                    {EN ? 'Commercial Code · Federal Consumer Protection Law (PROFECO)' : 'Código de Comercio &middot; Ley Federal de Protección al Consumidor (PROFECO)'}
                  </span>
                  <h2 className="text-2xl font-black text-[#070707] mt-1">
                    {EN ? 'Terms of Service and Service Level Agreement (SLA 99.9%)' : 'Términos de Servicio y Acuerdo de Nivel de Servicio (SLA 99.9%)'}
                  </h2>
                  <p className="text-xs text-[#858A82] mt-1">{EN ? 'Adhesion contract for the provision of technology services' : 'Contrato de Adhesión para la Prestación de Servicios Tecnológicos'}</p>
                </div>

                {EN ? (
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-[#070707]">1. Contractual Consent by Electronic Means</h3>
                    <p>
                      This instrument constitutes a binding commercial contract entered into in accordance with Article 80 of the <em>Commercial Code</em> and <em>NOM-151-SCFI-2016</em>. By completing the order and payment process on the Banelio platform, the user provides their express and informed consent.
                    </p>

                    <h3 className="text-base font-bold text-[#070707]">2. Server Availability Guarantee (SLA 99.9%)</h3>
                    <p>
                      Banelio guarantees uninterrupted monthly operational availability of its Cloud NVMe storage nodes and backbone networks of <strong>99.9%</strong>. This guarantee excludes scheduled maintenance windows notified 48 hours in advance and events of force majeure.
                    </p>
                    <p>
                      In the event of non-compliance with the guaranteed SLA metric within a monthly billing cycle, the customer will be entitled to request credits applicable to renewal in accordance with the following scale:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                      <li>Availability 99.0% - 99.8%: Credit equivalent to 10% of the monthly amount.</li>
                      <li>Availability 95.0% - 98.9%: Credit equivalent to 25% of the monthly amount.</li>
                      <li>Availability below 95.0%: Credit equivalent to 50% of the monthly amount.</li>
                    </ul>

                    <h3 className="text-base font-bold text-[#070707]">3. Prices, Currencies and Taxes</h3>
                    <p>
                      All amounts shown in Mexican pesos (MXN) include Value Added Tax (16% IVA) or will be duly itemized when generating the CFDI 4.0. International transactions in US Dollars (USD) are settled according to the exchange rate processed by the corresponding issuing entity.
                    </p>

                    <h3 className="text-base font-bold text-[#070707]">4. Jurisdiction and Legal Competence</h3>
                    <p>
                      For the interpretation, compliance and resolution of disputes arising from these Terms, the parties submit to the administrative competence of the Federal Consumer Protection Agency (PROFECO) and to the jurisdiction of the Competent Courts of Mexico City, waiving any other forum that might correspond to them by reason of their present or future domiciles.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-[#070707]">1. Consentimiento Contractual por Medios Electrónicos</h3>
                  <p>
                    El presente instrumento constituye un contrato mercantil vinculante celebrado de conformidad con el Artículo 80 del <em>Código de Comercio</em> y la <em>NOM-151-SCFI-2016</em>. Al completar el proceso de orden y pago en la plataforma Banelio, el usuario manifiesta su consentimiento expreso e informado.
                  </p>

                  <h3 className="text-base font-bold text-[#070707]">2. Garantía de Disponibilidad de Servidores (SLA 99.9%)</h3>
                  <p>
                    Banelio garantiza una disponibilidad operativa mensual ininterrumpida de sus nodos de almacenamiento Cloud NVMe y redes troncales del <strong>99.9%</strong>. Dicha garantía excluye ventanas de mantenimiento programado notificadas con 48 horas de antelación y eventos de caso fortuito o fuerza mayor.
                  </p>
                  <p>
                    En caso de incumplimiento de la métrica SLA garantizada dentro de un ciclo de facturación mensual, el cliente tendrá derecho a solicitar créditos aplicables a renovación de conformidad con la siguiente escala:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                    <li>Disponibilidad 99.0% - 99.8%: Crédito equivalente al 10% del importe mensual.</li>
                    <li>Disponibilidad 95.0% - 98.9%: Crédito equivalente al 25% del importe mensual.</li>
                    <li>Disponibilidad menor a 95.0%: Crédito equivalente al 50% del importe mensual.</li>
                  </ul>

                  <h3 className="text-base font-bold text-[#070707]">3. Precios, Divisas e Impuestos</h3>
                  <p>
                    Todos los importes exhibidos en moneda nacional (MXN) incluyen el Impuesto al Valor Agregado (IVA del 16%) o se desglosará debidamente al momento de generar el CFDI 4.0. Las transacciones internacionales en Dólares Estadounidenses (USD) se liquidan conforme al tipo de cambio procesado por la entidad emisora correspondiente.
                  </p>

                  <h3 className="text-base font-bold text-[#070707]">4. Jurisdicción y Competencia Legal</h3>
                  <p>
                    Para la interpretación, cumplimiento y solución de controversias derivadas de los presentes Términos, las partes se someten a la competencia administrativa de la Procuraduría Federal del Consumidor (PROFECO) y a la jurisdicción de los Tribunales Competentes de la Ciudad de México, renunciando a cualquier otro fuero que pudiera corresponderles por razón de sus domicilios presentes o futuros.
                  </p>
                </div>
              )}
            </div>
            )}

            {activeDoc === 'AUP' && (
              <div className="space-y-6">
                <div className="border-b border-[#8A8F98] pb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#B8F23A]">
                    {EN ? 'Cybersecurity and Prevention of Computer Crimes (Federal Criminal Code)' : 'Ciberseguridad y Prevención de Delitos Informáticos (Código Penal Federal)'}
                  </span>
                  <h2 className="text-2xl font-black text-[#070707] mt-1">
                    {EN ? 'Acceptable Use Policy (AUP) and Anti-Abuse' : 'Política de Uso Aceptable (AUP) y Anti-Abuso'}
                  </h2>
                  <p className="text-xs text-[#858A82] mt-1">{EN ? 'Secure operation guidelines for network and corporate email' : 'Directrices de Operación Segura de Red y Correo Corporativo'}</p>
                </div>

                {EN ? (
                  <div className="space-y-4">
                    <p>
                      To safeguard the reputation of the assigned IP ranges, the deliverability of corporate emails to inboxes and the security of all tenants on shared servers, it is strictly prohibited to use Banelio infrastructure for:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
                      <li><strong>Unsolicited email (SPAM):</strong> Mass dispatch of promotional messages without the prior and verifiable consent of the recipient (Double Opt-In), as well as the purchase/sale of email databases.</li>
                      <li><strong>Identity impersonation (Phishing & Spoofing):</strong> Creating or hosting fake sites, credential-harvesting portals or forging email headers.</li>
                      <li><strong>Hosting malicious software:</strong> Distributing or storing trojans, ransomware, botnet scripts, exploits or executable malicious code.</li>
                      <li><strong>Network attacks and cybercrime:</strong> Executing Denial of Service (DoS/DDoS) attacks, unauthorized port scanning, brute force attacks against third parties or unauthorized cryptocurrency mining that degrades CPU cores.</li>
                    </ul>
                    <p className="text-xs font-semibold text-[#070707] bg-[#F7F8F0] p-3.5 rounded-2xl border border-[#8A8F98]">
                      Detection of any of these activities will entitle Banelio to proceed with the immediate precautionary suspension of the service, as well as to cooperate with the competent judicial and police authorities in accordance with the Mexican Federal Criminal Code.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p>
                      Para salvaguardar la reputación de los rangos de direcciones IP asignadas, la entregabilidad de correos corporativos en bandejas de entrada y la seguridad de todos los arrendatarios en servidores compartidos, queda terminantemente prohibido utilizar la infraestructura de Banelio para:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
                    <li><strong>Envío de Correo No Solicitado (SPAM):</strong> Prohibido el despacho masivo de mensajes promocionales sin el consentimiento previo y verificable del destinatario (Double Opt-In), así como la compra/venta de bases de datos de correos electrónicos.</li>
                    <li><strong>Suplantación de Identidad (Phishing & Spoofing):</strong> Creación o alojamiento de sitios falsos, portales de captura de credenciales bancarias o falsificación de encabezados de correo electrónico.</li>
                    <li><strong>Alojamiento de Software Malicioso:</strong> Distribución o resguardo de troyanos, ransomware, scripts de botnets, exploits o código malicioso ejecutable.</li>
                    <li><strong>Ataques de Red y Ciberdelincuencia:</strong> Ejecución de ataques de Denegación de Servicio (DoS/DDoS), escaneo no autorizado de puertos, ataques de fuerza bruta contra terceros o minería no autorizada de criptoactivos que degrade los núcleos de CPU.</li>
                  </ul>
                  <p className="text-xs font-semibold text-[#070707] bg-[#F7F8F0] p-3.5 rounded-2xl border border-[#8A8F98]">
                    La detección de cualquiera de estas actividades facultará a Banelio a proceder a la suspensión precautoria e inmediata del servicio, así como a colaborar con las autoridades judiciales y policiales competentes conforme al Código Penal Federal mexicano.
                  </p>
                </div>
              )}
            </div>
            )}

            {activeDoc === 'DOMAIN_AGREEMENT' && (
              <div className="space-y-6">
                <div className="border-b border-[#8A8F98] pb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#B8F23A]">
                    ICANN 2013 Registrar Accreditation Agreement &middot; NIC México (.MX)
                  </span>
                  <h2 className="text-2xl font-black text-[#070707] mt-1">
                    {EN ? 'Domain Name Registration Contract and Policies' : 'Contrato y Políticas de Registro de Nombres de Dominio'}
                  </h2>
                  <p className="text-xs text-[#858A82] mt-1">{EN ? 'Official provisions on ownership, renewal and dispute resolution' : 'Disposiciones Oficiales de Titularidad, Renovación y Resolución de Disputas'}</p>
                </div>

                {EN ? (
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-[#070707]">1. ICANN Authority and Accreditation Framework</h3>
                    <p>
                      The registration of generic top-level domain names (gTLDs: .com, .net, .org, .online, .tech, .xyz, etc.) and territorial names (ccTLDs: .mx, .com.mx) is governed by the guidelines of the <strong>Internet Corporation for Assigned Names and Numbers (ICANN)</strong> and the agreements with <strong>NIC Mexico (Registry .MX)</strong>.
                    </p>

                    <h3 className="text-base font-bold text-[#070707]">2. Duty of Accuracy in WHOIS / RDAP Records</h3>
                    <p>
                      The registrant declares under penalty of perjury that all information provided (name, company name, administrative and technical contact email) is truthful, complete and up to date. The intentional provision of false information constitutes legal grounds for the irrevocable cancellation of the domain under ICANN rules.
                    </p>

                    <h3 className="text-base font-bold text-[#070707]">3. Free WHOIS Privacy</h3>
                    <p>
                      Banelio provides the WHOIS Privacy service at no additional cost for eligible gTLDs, masking the registrant's data through a trust proxy to protect against abusive telemarketing, identity theft or online scams, without prejudice to the registrant's exclusive ownership rights over the domain.
                    </p>

                    <h3 className="text-base font-bold text-[#070707]">4. Trademark Dispute Resolution Policy (UDRP & LDRP)</h3>
                    <p>
                      The registrant submits to the <em>Uniform Domain Name Dispute Resolution Policy (UDRP)</em> and the <em>Dispute Resolution Policy for .MX Domain Names (LDRP)</em> administered by the Arbitration and Mediation Center of the World Intellectual Property Organization (WIPO).
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-[#070707]">1. Marco de Autoridad y Acreditación ICANN</h3>
                  <p>
                    El registro de nombres de dominio de nivel superior genérico (gTLDs: .com, .net, .org, .online, .tech, .xyz, etc.) y nombres territoriales (ccTLDs: .mx, .com.mx) se rige bajo los lineamientos de la <strong>Corporación de Internet para la Asignación de Nombres y Números (ICANN)</strong> y los acuerdos con <strong>NIC México (Registry .MX)</strong>.
                  </p>

                  <h3 className="text-base font-bold text-[#070707]">2. Obligación de Veracidad en Registros WHOIS / RDAP</h3>
                  <p>
                    El titular registrador (Registrant) declara bajo protesta de decir verdad que toda la información suministrada (nombre, razón social, correo de contacto administrativo y técnico) es fidedigna, completa y actualizada. El suministro intencional de información falsa constituye causa legal para la cancelación irrevocable del dominio conforme a las normas de ICANN.
                  </p>

                  <h3 className="text-base font-bold text-[#070707]">3. Privacidad WHOIS Gratuita</h3>
                  <p>
                    Banelio proporciona el servicio de Privacidad WHOIS sin costo adicional para los gTLDs elegibles, enmascarando los datos del titular mediante un fideicomiso proxy para salvaguardarlo contra telemercadeo abusivo, robo de identidad o estafas digitales, sin menoscabo de sus derechos de propiedad exclusiva sobre el dominio.
                  </p>

                  <h3 className="text-base font-bold text-[#070707]">4. Política de Resolución de Disputas de Marca (UDRP & LDRP)</h3>
                  <p>
                    El registrante se somete a la <em>Política Uniforme de Resolución de Controversias en Materia de Nombres de Dominio (UDRP)</em> y a la <em>Política de Solución de Controversias para Nombres de Dominio .MX (LDRP)</em> administrada por el Centro de Arbitraje y Mediación de la Organización Mundial de la Propiedad Intelectual (OMPI / WIPO).
                  </p>
                </div>
              )}
            </div>
            )}

          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-[#8A8F98] bg-[#F7F8F0] gap-3">
          <div className="flex items-center gap-2 text-xs text-[#555A52]">
            <Shield className="w-4 h-4 text-[#B8F23A]" />
            <span>{EN ? 'Banelio © 2026. Legal documentation in accordance with Mexican law.' : 'Banelio © 2026. Documentación legal conforme a las leyes mexicanas.'}</span>
          </div>
          <button
            id="legal-modal-ok-btn"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-[#070707] hover:bg-[#111111] text-white text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
          >
            {EN ? 'Understood and Accepted' : 'Entendido y Aceptado'}
          </button>
        </div>

      </div>
    </div>
  );
};

