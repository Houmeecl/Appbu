import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Shield, 
  Users, 
  MapPin, 
  Clock, 
  Smartphone,
  FileCheck,
  Zap,
  Globe,
  TrendingUp,
  Award,
  CheckCircle,
  ArrowRight,
  Phone,
  Mail,
  MessageSquare,
  Star,
  Building,
  Banknote,
  Lock,
  Wifi,
  Video
} from "lucide-react";

export default function LandingPage() {
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro' | 'enterprise'>('pro');

  const features = [
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Firma Electrónica Avanzada",
      description: "Certificación FEA con validez legal según Ley 19.799"
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      title: "500+ Puntos de Atención",
      description: "Red nacional en minimarkets y farmacias"
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Atención Express 5-8 min",
      description: "Documentos listos mientras esperas"
    },
    {
      icon: <Smartphone className="h-6 w-6" />,
      title: "Tecnología Móvil",
      description: "Terminales POS Android en cada punto"
    },
    {
      icon: <Video className="h-6 w-6" />,
      title: "Atención Híbrida",
      description: "Videollamadas para zonas rurales"
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: "Máxima Seguridad",
      description: "Biometría y geolocalización GPS"
    }
  ];

  const documentTypes = [
    { name: "Declaración Jurada Simple", price: "$3.500", popular: true },
    { name: "Poder Notarial", price: "$5.900", popular: false },
    { name: "Autorización Viaje Menores", price: "$4.500", popular: true },
    { name: "Contrato Arriendo", price: "$8.900", popular: false },
    { name: "Finiquito Laboral", price: "$6.500", popular: true },
    { name: "Compraventa Vehículo", price: "$12.900", popular: false }
  ];

  const stats = [
    { value: "50.000+", label: "Documentos Procesados" },
    { value: "500+", label: "Puntos de Atención" },
    { value: "99.9%", label: "Disponibilidad" },
    { value: "4.8/5", label: "Satisfacción Cliente" }
  ];

  const testimonials = [
    {
      name: "María González",
      location: "Santiago Centro",
      rating: 5,
      comment: "Increíble! Hice mi declaración jurada en el minimarket de la esquina en solo 5 minutos. Mucho más barato que la notaría."
    },
    {
      name: "Juan Pérez",
      location: "Viña del Mar",
      rating: 5,
      comment: "El poder notarial para mi hijo que viaja quedó perfecto. La certificadora fue muy amable por videollamada."
    },
    {
      name: "Ana Silva",
      location: "Temuco",
      rating: 5,
      comment: "Como vivo en zona rural, la atención por video fue perfecta. No tuve que viajar 2 horas a la ciudad."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img 
                src={`${import.meta.env.BASE_URL}attached_assets/file_00000000be7c6230abade75100460c7c_1751098460822.png`}
                alt="NotaryPro Logo"
                className="h-12 w-auto object-contain"
                style={{ 
                  clipPath: 'polygon(52% 0%, 100% 0%, 100% 100%, 52% 100%)',
                  filter: 'saturate(1.3) contrast(1.1)'
                }}
              />
              <span className="ml-3 text-xl font-bold text-red-600">NotaryPro</span>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#servicios" className="text-gray-600 hover:text-gray-900">Servicios</a>
              <a href="#documentos" className="text-gray-600 hover:text-gray-900">Documentos</a>
              <a href="#precios" className="text-gray-600 hover:text-gray-900">Precios</a>
              <a href="#contacto" className="text-gray-600 hover:text-gray-900">Contacto</a>
              <Link href="/certificador">
                <Button variant="outline" size="sm">
                  Acceso Certificador
                </Button>
              </Link>
              <Link href="/pos">
                <Button className="bg-red-600 hover:bg-red-700" size="sm">
                  Terminal POS
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 bg-gradient-to-br from-red-50 to-orange-50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-red-100 text-red-800">
                Certificación Legal Electrónica en Chile
              </Badge>
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                Documentos Legales en 5 Minutos
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Red nacional de certificación electrónica avanzada en minimarkets y farmacias. 
                Más rápido, más barato y con la misma validez legal que una notaría tradicional.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-red-600 hover:bg-red-700">
                  Encuentra tu Punto Más Cercano
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline">
                  <Phone className="mr-2 h-4 w-4" />
                  Llamar Ahora
                </Button>
              </div>
              
              <div className="mt-8 flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Ley 19.799</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>FEA Certificada</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>24/7</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src={`${import.meta.env.BASE_URL}attached_assets/file_00000000912061f5b66bf583d7667919_1751094701879.png`}
                alt="NotaryPro en Acción"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold">+50,000</p>
                    <p className="text-sm text-gray-600">Documentos Certificados</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-4xl font-bold mb-2">{stat.value}</p>
                <p className="text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="servicios" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              La Nueva Era de los Documentos Legales
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Tecnología de punta que democratiza el acceso a servicios notariales
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="bg-red-100 w-12 h-12 rounded-lg flex items-center justify-center text-red-600 mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Documents Section */}
      <section id="documentos" className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Documentos Disponibles
            </h2>
            <p className="text-lg text-gray-600">
              Precios hasta 70% más baratos que notarías tradicionales
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documentTypes.map((doc, index) => (
              <Card key={index} className={doc.popular ? 'border-red-200 shadow-lg' : ''}>
                {doc.popular && (
                  <div className="bg-red-600 text-white text-center py-1 text-sm font-medium">
                    Más Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{doc.name}</CardTitle>
                  <CardDescription>
                    <span className="text-2xl font-bold text-gray-900">{doc.price}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Firma Electrónica Avanzada
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Validez Legal Inmediata
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Código QR de Verificación
                    </li>
                  </ul>
                  <Button className="w-full mt-4" variant={doc.popular ? 'default' : 'outline'}>
                    Solicitar Ahora
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Ecosistema LegalTech */}
      <section className="py-20 px-4 bg-gradient-to-r from-red-50 to-orange-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-red-100 text-red-800">
              Ecosistema LegalTech Líder en Latinoamérica
            </Badge>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              El Ecosistema Legal Más Completo
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              NotaryPro es parte de un ecosistema integrado que revoluciona los servicios legales con tecnología de punta
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                  <Smartphone className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">VecinoXpress POS</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Terminales móviles en minimarkets y farmacias para acceso inmediato
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-red-100 w-12 h-12 rounded-lg flex items-center justify-center text-red-600 mb-4">
                  <Shield className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">NotaryPro FEA</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Certificación con Firma Electrónica Avanzada y validez legal completa
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center text-green-600 mb-4">
                  <Globe className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">Blockchain Legal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Registro inmutable en blockchain para máxima seguridad y transparencia
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center text-purple-600 mb-4">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">IA Legal Assistant</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Asistente inteligente para búsqueda y generación de documentos
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Tecnología que Transforma
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold">API REST para Desarrolladores</p>
                      <p className="text-sm text-gray-600">Integra servicios notariales en tu aplicación</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold">SDK Multi-plataforma</p>
                      <p className="text-sm text-gray-600">Compatible con Android, iOS y Web</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold">Webhooks en Tiempo Real</p>
                      <p className="text-sm text-gray-600">Notificaciones instantáneas de eventos</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold">Compliance Automático</p>
                      <p className="text-sm text-gray-600">Cumple con todas las regulaciones chilenas</p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-red-100 to-orange-100 rounded-xl p-8 text-center">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
                    <Zap className="h-10 w-10 text-red-600" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    Potencia tu Negocio
                  </h4>
                  <p className="text-gray-700">
                    Únete al ecosistema LegalTech más avanzado de Chile
                  </p>
                </div>
                <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white">
                  Solicitar Demo API
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¿Cómo Funciona?
            </h2>
            <p className="text-lg text-gray-600">
              Proceso simple y rápido en 4 pasos
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center text-red-600 font-bold text-xl mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">Encuentra un Punto</h3>
              <p className="text-sm text-gray-600">
                Localiza el minimarket o farmacia más cercana con nuestro servicio
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center text-red-600 font-bold text-xl mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">Presenta tu Cédula</h3>
              <p className="text-sm text-gray-600">
                El operador POS capturará tus datos y biometría de forma segura
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center text-red-600 font-bold text-xl mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">Firma y Certifica</h3>
              <p className="text-sm text-gray-600">
                Certificador profesional aplica FEA por video o presencial
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center text-red-600 font-bold text-xl mx-auto mb-4">
                4
              </div>
              <h3 className="font-semibold mb-2">Recibe tu Documento</h3>
              <p className="text-sm text-gray-600">
                PDF con código QR enviado a tu email en minutos
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Lo que Dicen Nuestros Clientes
            </h2>
            <div className="flex justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-lg text-gray-600">4.8/5 basado en +10,000 reseñas</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{testimonial.comment}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.location}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precios" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Planes para Empresas
            </h2>
            <p className="text-lg text-gray-600">
              Soluciones corporativas con descuentos por volumen
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className={selectedPlan === 'basic' ? 'border-red-500 shadow-lg' : ''}>
              <CardHeader>
                <CardTitle>Plan Básico</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold">$29.900</span>/mes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Hasta 50 documentos/mes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Soporte por email</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Panel de control básico</span>
                  </li>
                </ul>
                <Button 
                  variant={selectedPlan === 'basic' ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => setSelectedPlan('basic')}
                >
                  Seleccionar Plan
                </Button>
              </CardContent>
            </Card>

            <Card className={selectedPlan === 'pro' ? 'border-red-500 shadow-lg' : ''}>
              <div className="bg-red-600 text-white text-center py-2 text-sm font-medium">
                Más Popular
              </div>
              <CardHeader>
                <CardTitle>Plan Pro</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold">$79.900</span>/mes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Hasta 200 documentos/mes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Soporte prioritario 24/7</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">API para integración</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Reportes avanzados</span>
                  </li>
                </ul>
                <Button 
                  variant={selectedPlan === 'pro' ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => setSelectedPlan('pro')}
                >
                  Seleccionar Plan
                </Button>
              </CardContent>
            </Card>

            <Card className={selectedPlan === 'enterprise' ? 'border-red-500 shadow-lg' : ''}>
              <CardHeader>
                <CardTitle>Plan Enterprise</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold">Personalizado</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Documentos ilimitados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Account Manager dedicado</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">SLA garantizado 99.9%</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Integración personalizada</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Capacitación on-site</span>
                  </li>
                </ul>
                <Button 
                  variant={selectedPlan === 'enterprise' ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => setSelectedPlan('enterprise')}
                >
                  Contactar Ventas
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Preguntas Frecuentes
            </h2>
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>¿Es legal la firma electrónica avanzada?</AccordionTrigger>
              <AccordionContent>
                Sí, la Firma Electrónica Avanzada (FEA) tiene plena validez legal en Chile según la Ley 19.799. 
                Los documentos firmados con FEA tienen el mismo valor jurídico que aquellos firmados de forma manuscrita ante notario.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger>¿Cuánto demora el proceso?</AccordionTrigger>
              <AccordionContent>
                El proceso completo toma entre 5 a 8 minutos. Esto incluye la verificación de identidad, 
                captura de evidencias biométricas, firma del documento y certificación FEA. 
                Recibirás el documento en tu email inmediatamente.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger>¿Dónde puedo encontrar puntos de atención?</AccordionTrigger>
              <AccordionContent>
                Contamos con más de 500 puntos de atención en minimarkets y farmacias a lo largo de todo Chile. 
                Puedes encontrar el más cercano usando nuestro localizador en línea o llamando a nuestro call center.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger>¿Qué documentos puedo tramitar?</AccordionTrigger>
              <AccordionContent>
                Ofrecemos más de 20 tipos de documentos legales incluyendo declaraciones juradas, poderes notariales, 
                autorizaciones de viaje, contratos de arriendo, finiquitos laborales, compraventas de vehículos, 
                y muchos más. Todos con certificación FEA.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5">
              <AccordionTrigger>¿Cómo verifico la autenticidad de mi documento?</AccordionTrigger>
              <AccordionContent>
                Cada documento incluye un código QR único que permite verificar su autenticidad en línea. 
                Cualquier persona puede escanear el código o ingresar el número de certificación en nuestro 
                portal de validación para confirmar la validez del documento.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">
            Únete a la Revolución Digital Notarial
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Más de 50,000 chilenos ya confían en NotaryPro para sus documentos legales
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">
              <Building className="mr-2 h-5 w-5" />
              Quiero ser Punto de Atención
            </Button>
            <Button size="lg" className="bg-white text-red-600 hover:bg-gray-100">
              <Award className="mr-2 h-5 w-5" />
              Quiero ser Certificador
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contacto" className="bg-gray-900 text-white py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4">NotaryPro</h3>
              <p className="text-gray-400 text-sm">
                Transformando el acceso a servicios notariales en Chile con tecnología 
                y una red nacional de atención.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Servicios</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Documentos Express</a></li>
                <li><a href="#" className="hover:text-white">Certificación FEA</a></li>
                <li><a href="#" className="hover:text-white">Atención Rural</a></li>
                <li><a href="#" className="hover:text-white">Planes Empresa</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Nosotros</a></li>
                <li><a href="#" className="hover:text-white">Únete al Equipo</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Prensa</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contacto</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>+56 2 2345 6789</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>contacto@notarypro.cl</span>
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Chat 24/7</span>
                </li>
              </ul>
            </div>
          </div>
          
          <Separator className="bg-gray-800 mb-8" />
          
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <p>© 2025 NotaryPro. Todos los derechos reservados.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white">Términos y Condiciones</a>
              <a href="#" className="hover:text-white">Política de Privacidad</a>
              <a href="#" className="hover:text-white">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}