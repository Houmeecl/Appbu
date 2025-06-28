import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Stats = {
  documents: {
    totalDocuments: number;
    pendingDocuments: number;
    todayCount: number;
    monthlyCount: number;
    rejectedCount: number;
  };
  regions: {
    region: string;
    documentCount: number;
    posCount: number;
  }[];
};

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const documentTypes = [
    { name: "Declaración Jurada Simple", count: 6234, percentage: 39, color: "bg-blue-600" },
    { name: "Poder Simple", count: 4123, percentage: 26, color: "bg-red-600" },
    { name: "Recibo de Dinero", count: 3467, percentage: 22, color: "bg-green-500" },
    { name: "Otros", count: 2023, percentage: 13, color: "bg-yellow-500" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard del Sistema</h1>
              <p className="text-gray-600">VecinoXpress & NotaryPro - Analytics y Monitoreo</p>
            </div>
            <div className="flex items-center space-x-4">
              <Select defaultValue="month">
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Último mes</SelectItem>
                  <SelectItem value="quarter">Últimos 3 meses</SelectItem>
                  <SelectItem value="year">Último año</SelectItem>
                </SelectContent>
              </Select>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <i className="fas fa-download mr-2"></i>
                Exportar Reporte
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Key Metrics */}
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <i className="fas fa-file-signature text-blue-600 text-xl"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Documentos Procesados</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats?.documents?.totalDocuments?.toLocaleString() || "0"}
                    </p>
                    <p className="text-sm text-green-600">
                      <i className="fas fa-arrow-up mr-1"></i>
                      +12% vs mes anterior
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <i className="fas fa-store text-red-600 text-xl"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Puntos de Venta Activos</p>
                    <p className="text-3xl font-bold text-gray-900">342</p>
                    <p className="text-sm text-green-600">
                      <i className="fas fa-arrow-up mr-1"></i>
                      +8% vs mes anterior
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <i className="fas fa-dollar-sign text-green-600 text-xl"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Ingresos del Mes</p>
                    <p className="text-3xl font-bold text-gray-900">$38.5M</p>
                    <p className="text-sm text-green-600">
                      <i className="fas fa-arrow-up mr-1"></i>
                      +15% vs mes anterior
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <i className="fas fa-clock text-yellow-600 text-xl"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Tiempo Promedio</p>
                    <p className="text-3xl font-bold text-gray-900">4.2min</p>
                    <p className="text-sm text-green-600">
                      <i className="fas fa-arrow-down mr-1"></i>
                      -8% vs mes anterior
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Document Types Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Tipos de Documentos Más Procesados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documentTypes.map((type, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                          <div className={`w-4 h-4 ${type.color} rounded mr-3`}></div>
                          <span className="text-sm text-gray-600">{type.name}</span>
                        </div>
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900 mr-3">
                            {type.count.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">{type.percentage}%</div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`${type.color} h-2 rounded-full`} 
                          style={{ width: `${type.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance by Region */}
            <Card>
              <CardHeader>
                <CardTitle>Rendimiento por Región</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.regions?.map((region, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{region.region}</h4>
                        <p className="text-sm text-gray-600">{region.posCount} puntos de venta</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {region.documentCount.toLocaleString()}
                        </div>
                        <div className="text-sm text-green-600">+15%</div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      <i className="fas fa-chart-bar text-4xl mb-4"></i>
                      <p>No hay datos de regiones disponibles</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flow-root">
                <ul className="-mb-8">
                  <li>
                    <div className="relative pb-8">
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"></span>
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                            <i className="fas fa-check text-white text-sm"></i>
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              Documento <span className="font-medium text-gray-900">DOC-2024-001847</span> firmado exitosamente
                              <span className="whitespace-nowrap"> por María González</span>
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            hace 2 min
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>

                  <li>
                    <div className="relative pb-8">
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"></span>
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                            <i className="fas fa-plus text-white text-sm"></i>
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              Nuevo punto de venta registrado en
                              <span className="font-medium text-gray-900"> Farmacia Central, Providencia</span>
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            hace 15 min
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>

                  <li>
                    <div className="relative">
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center ring-8 ring-white">
                            <i className="fas fa-exclamation text-white text-sm"></i>
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              Sistema de backup completado -
                              <span className="font-medium text-gray-900"> {stats?.documents?.totalDocuments?.toLocaleString() || "0"} documentos respaldados</span>
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            hace 1 hora
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
