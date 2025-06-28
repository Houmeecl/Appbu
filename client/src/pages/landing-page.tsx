import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  Clock, 
  MapPin, 
  Smartphone, 
  CheckCircle, 
  Users, 
  FileText, 
  Zap,
  Star,
  ArrowRight,
  Phone,
  Mail,
  Globe
} from "lucide-react";

export default function LandingPage() {
  const features = [
    {
      icon: <Shield className="h-8 w-8 text-red-600" />,
      title: "Firma Electrónica Avanzada (FEA)",
      description: "Certificación legal conforme a la Ley 19.799 con validez jurídica plena en Chile."
    },
    {
      icon: <Clock className="h-8 w-8 text-blue-600" />,
      title: "Proceso Express 5-8 Minutos",
      description: "Documentos legales listos en minutos, no en días. Proceso optimizado para máxima eficiencia."
    },
    {
      icon: <MapPin className="h-8 w-8 text-green-600" />,
      title: "Red Nacional de Terminales",
      description: "Más de 500 puntos de atención en minimarkets y farmacias a lo largo de todo Chile."
    },
    {
      icon: <Smartphone className="h-8 w-8 text-purple-600" />,
      title: "Verificación Biométrica",
      description: "Captura facial, GPS y firma manuscrita para máxima seguridad en cada documento."
    }
  ];

  const documentTypes = [
    "Declaración Jurada Simple",
    "Poder Simple",
    "Autorización de Viaje",
    "Declaración de Bienes",
    "Constitución de Domicilio",
    "Documento Personalizado"
  ];

  const stats = [
    { number: "50,000+", label: "Documentos Certificados" },
    { number: "500+", label: "Puntos de Atención" },
    { number: "15", label: "Regiones Cubiertas" },
    { number: "99.9%", label: "Disponibilidad" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-red-600">NotaryPro</h1>
              <Badge variant="secondary" className="ml-3">Chile</Badge>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#servicios" className="text-gray-600 hover:text-red-600 transition-colors">Servicios</a>
              <a href="#como-funciona" className="text-gray-600 hover:text-red-600 transition-colors">Cómo Funciona</a>
              <a href="#ubicaciones" className="text-gray-600 hover:text-red-600 transition-colors">Ubicaciones</a>
              <a href="#contacto" className="text-gray-600 hover:text-red-600 transition-colors">Contacto</a>
            </nav>
            <div className="flex space-x-3">
              <Button variant="outline" className="hidden sm:inline-flex">
                Iniciar Sesión
              </Button>
              <Button className="bg-red-600 hover:bg-red-700">
                Crear Documento
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-red-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-red-100 text-red-800 mb-4">
                <Zap className="h-3 w-3 mr-1" />
                Revolucionando la Notarización en Chile
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Documentos Legales
                <span className="text-red-600 block">en 5 Minutos</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                La primera plataforma de firma electrónica avanzada que transforma cualquier minimarket 
                en una notaría digital. Certificación legal instantánea con validez jurídica completa.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-red-600 hover:bg-red-700 text-lg px-8 py-3">
                  <MapPin className="h-5 w-5 mr-2" />
                  Encontrar Punto Cercano
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                  <FileText className="h-5 w-5 mr-2" />
                  Ver Documentos Disponibles
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 border">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <Shield className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-900">Certificación FEA</h3>
                    <p className="text-sm text-gray-600">Ley 19.799 • Validez Legal Plena</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span>Verificación biométrica completa</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span>Geolocalización GPS certificada</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span>Timestamp criptográfico RFC 3161</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span>Archivo digital permanente</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-red-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="servicios" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Tecnología de Vanguardia para Documentos Legales
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Combinamos inteligencia artificial, biometría avanzada y blockchain para crear 
              el ecosistema de certificación legal más seguro y eficiente de Chile.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="como-funciona" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Proceso Simple en 3 Pasos
            </h2>
            <p className="text-xl text-gray-600">
              De la consulta al documento certificado en menos de 8 minutos
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Llega al Punto VecinoXpress</h3>
              <p className="text-gray-600">
                Encuentra el minimarket o farmacia más cercana con terminal NotaryPro. 
                Más de 500 ubicaciones disponibles.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Verifica tu Identidad</h3>
              <p className="text-gray-600">
                Captura facial, presentación de cédula y firma manuscrita. 
                Todo registrado con timestamp criptográfico.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Recibe tu Documento</h3>
              <p className="text-gray-600">
                Documento certificado con firma electrónica avanzada, 
                código QR de validación y respaldo digital permanente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Document Types */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Todos los Documentos que Necesitas
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Desde declaraciones juradas hasta poderes notariales, 
                procesamos todos los documentos legales más comunes en Chile.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {documentTypes.map((doc, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-gray-700">{doc}</span>
                  </div>
                ))}
              </div>
              <Button className="mt-8 bg-red-600 hover:bg-red-700" size="lg">
                Ver Lista Completa
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-blue-50 p-8 rounded-2xl">
              <div className="text-center mb-6">
                <Star className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900">Precios Transparentes</h3>
                <p className="text-gray-600">20% menos que notarías tradicionales</p>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Declaración Jurada Simple</span>
                  <span className="font-semibold">$4.800</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span>Poder Simple</span>
                  <span className="font-semibold">$8.400</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span>Autorización de Viaje</span>
                  <span className="font-semibold">$6.200</span>
                </div>
                <div className="text-xs text-gray-500 mt-4">
                  * Precios incluyen IVA. Varían según región GPS.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Locations */}
      <section id="ubicaciones" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Red Nacional de Atención
            </h2>
            <p className="text-xl text-gray-600">
              Encuentra el punto VecinoXpress más cercano a ti
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 text-red-600 mr-2" />
                  Región Metropolitana
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600 mb-2">150+ puntos</p>
                <p className="text-gray-600">
                  Santiago, Puente Alto, Maipú, Las Condes, Providencia y más.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 text-red-600 mr-2" />
                  Regiones Norte
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600 mb-2">85+ puntos</p>
                <p className="text-gray-600">
                  Antofagasta, Iquique, La Serena, Copiapó, Calama y más.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 text-red-600 mr-2" />
                  Regiones Sur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600 mb-2">120+ puntos</p>
                <p className="text-gray-600">
                  Valparaíso, Concepción, Temuco, Valdivia, Puerto Montt y más.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contacto" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              ¿Necesitas Ayuda?
            </h2>
            <p className="text-xl text-gray-600">
              Nuestro equipo está disponible para apoyarte en todo el proceso
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardContent className="pt-6">
                <Phone className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Teléfono</h3>
                <p className="text-gray-600 mb-4">Lunes a Viernes 8:00 - 19:00</p>
                <p className="text-lg font-semibold text-red-600">+56 2 2XXX XXXX</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Mail className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Email</h3>
                <p className="text-gray-600 mb-4">Respuesta en menos de 2 horas</p>
                <p className="text-lg font-semibold text-red-600">soporte@notarypro.cl</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Globe className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Chat Online</h3>
                <p className="text-gray-600 mb-4">Disponible 24/7</p>
                <Button className="bg-red-600 hover:bg-red-700">
                  Iniciar Chat
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-red-400 mb-4">NotaryPro</h3>
              <p className="text-gray-300 mb-4">
                Transformando la experiencia notarial en Chile con tecnología de vanguardia 
                y certificación legal completa.
              </p>
              <div className="flex space-x-4">
                <Badge variant="outline" className="text-white border-white">FEA Certified</Badge>
                <Badge variant="outline" className="text-white border-white">ISO 27001</Badge>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Servicios</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Declaraciones Juradas</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Poderes Notariales</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Autorizaciones</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Certificaciones</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Sobre Nosotros</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Términos y Condiciones</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Política de Privacidad</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Marco Legal</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Centro de Ayuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Validar Documento</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Estado del Sistema</a></li>
              </ul>
            </div>
          </div>
          <Separator className="my-8 bg-gray-700" />
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">
              © 2024 NotaryPro Chile. Todos los derechos reservados.
            </p>
            <p className="text-gray-400 text-sm mt-2 md:mt-0">
              Certificado por Ley 19.799 | RUT: XX.XXX.XXX-X
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}