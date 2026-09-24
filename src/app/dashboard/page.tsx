"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

export default function DashboardPage() {
  const router = useRouter();
  const [pets, setPets] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedPet, setSelectedPet] = useState<any>(null);
  const [editingPet, setEditingPet] = useState<any>(null);
  const [showMap, setShowMap] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showVaccines, setShowVaccines] = useState(false);
  const [selectedPetForVaccines, setSelectedPetForVaccines] = useState<any>(null);
  const [vaccinations, setVaccinations] = useState<any[]>([]);
  const [showAddVaccine, setShowAddVaccine] = useState(false);
  const [vaccineForm, setVaccineForm] = useState({
    vaccine_name: "",
    date_administered: "",
    next_due: "",
    lot_number: "",
    vet_name: "",
  });
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationHistory, setLocationHistory] = useState<any[]>([]);
  const [addressCache, setAddressCache] = useState<Record<string, string>>({});
  const [loadingAddresses, setLoadingAddresses] = useState<Record<string, boolean>>({});
  const [lostReport, setLostReport] = useState("");
  const [showLostModal, setShowLostModal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    breed: "",
    color: "",
    sex: "",
    microchip: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const response = await fetch("/api/pets");
      if (response.status === 401) {
        router.push("/login");
      } else {
        loadPets();
      }
    } catch (error) {
      router.push("/login");
    }
  }

  async function loadPets() {
    try {
      const response = await fetch("/api/pets");
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al cargar mascotas");
      setPets(data.pets || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePet(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const response = await fetch("/api/pets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al crear mascota");
      alert(`✅ Mascota creada! Código: ${data.publicId}`);
      setShowForm(false);
      setFormData({ name: "", species: "", breed: "", color: "", sex: "", microchip: "" });
      loadPets();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleUpdatePet(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!editingPet) return;
    try {
      const response = await fetch(`/api/pets/${editingPet.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al actualizar mascota");
      alert("✅ Mascota actualizada!");
      setEditingPet(null);
      setFormData({ name: "", species: "", breed: "", color: "", sex: "", microchip: "" });
      loadPets();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDeletePet(petId: string) {
    if (!confirm("¿Estás seguro de eliminar esta mascota?")) return;
    try {
      const response = await fetch(`/api/pets/${petId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error al eliminar");
      loadPets();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function reportLost(petId: string, report: string) {
    try {
      const response = await fetch(`/api/pets/${petId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "lost", lost_report: report }),
      });
      if (!response.ok) throw new Error("Error al reportar");
      alert("🚨 Mascota reportada como PERDIDA");
      setShowLostModal(null);
      setLostReport("");
      loadPets();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function reportFound(petId: string) {
    try {
      const response = await fetch(`/api/pets/${petId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "home", lost_report: null }),
      });
      if (!response.ok) throw new Error("Error al actualizar");
      alert("✅ Mascota marcada como ENCONTRADA");
      loadPets();
    } catch (err: any) {
      alert(err.message);
    }
  }

  function openEditModal(pet: any) {
    setEditingPet(pet);
    setFormData({
      name: pet.name,
      species: pet.species,
      breed: pet.breed || "",
      color: pet.color || "",
      sex: pet.sex || "",
      microchip: pet.microchip || "",
    });
  }

  function closeEditModal() {
    setEditingPet(null);
    setFormData({ name: "", species: "", breed: "", color: "", sex: "", microchip: "" });
  }

  function downloadQR() {
    if (!selectedPet) return;
    const svg = document.getElementById(`qr-${selectedPet.public_id}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) { alert("Error al generar el QR"); return; }
    const img = new Image();
    img.onload = () => {
      canvas.width = 512; canvas.height = 512;
      ctx.fillStyle = "white"; ctx.fillRect(0, 0, 512, 512);
      ctx.drawImage(img, 0, 0, 512, 512);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `qr-${selectedPet.name}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  }

  function getCurrentPosition() {
    if (!navigator.geolocation) { alert("Tu navegador no soporta geolocalización"); return; }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        if (showMap) await updatePetLocation(showMap.id, latitude, longitude);
      },
      (error) => alert("Error al obtener ubicación: " + error.message)
    );
  }

  async function saveLocationToHistory(petId: string, lat: number, lng: number) {
    try {
      await fetch(`/api/pets/${petId}/location-history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng, accuracy: 10 }),
      });
    } catch (err) { console.error("Error al guardar en historial:", err); }
  }

  async function updatePetLocation(petId: string, lat: number, lng: number) {
    try {
      const response = await fetch(`/api/pets/${petId}/location`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng }),
      });
      if (!response.ok) throw new Error("Error al actualizar ubicación");
      await saveLocationToHistory(petId, lat, lng);
      alert("✅ Ubicación actualizada");
      loadPets();
    } catch (err: any) { alert(err.message); }
  }

  async function toggleGPS(pet: any, enabled: boolean) {
    try {
      const response = await fetch(`/api/pets/${pet.id}/gps`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!response.ok) throw new Error("Error al cambiar GPS");
      loadPets();
    } catch (err: any) { alert(err.message); }
  }

  async function getAddress(lat: number, lng: number): Promise<string> {
    const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    if (addressCache[key]) return addressCache[key];
    try {
      setLoadingAddresses(prev => ({ ...prev, [key]: true }));
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'XpiPet/1.0' } }
      );
      if (!response.ok) return "Dirección no disponible";
      const data = await response.json();
      let address = "";
      const addr = data.address || {};
      if (addr.road) {
        let roadName = addr.road;
        if (addr.house_number) roadName += ` #${addr.house_number}`;
        if (addr.suburb || addr.neighbourhood) roadName += `, ${addr.suburb || addr.neighbourhood}`;
        if (addr.city || addr.town) roadName += `, ${addr.city || addr.town}`;
        address = roadName;
      } else if (addr.pedestrian || addr.footway) {
        address = `${addr.pedestrian || addr.footway}`;
        if (addr.suburb) address += `, ${addr.suburb}`;
        if (addr.city) address += `, ${addr.city}`;
      } else if (addr.suburb) {
        address = `${addr.suburb}, ${addr.city || addr.town || ''}`;
      } else {
        address = data.display_name || "Dirección no disponible";
      }
      setAddressCache(prev => ({ ...prev, [key]: address }));
      setLoadingAddresses(prev => ({ ...prev, [key]: false }));
      return address;
    } catch (err) {
      console.error("Error al obtener dirección:", err);
      return "Dirección no disponible";
    }
  }

  async function loadLocationHistory(pet: any) {
    try {
      const response = await fetch(`/api/pets/${pet.id}/location-history`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al cargar historial");
      setLocationHistory(data.locations || []);
      setShowMap(pet);
      setShowHistory(true);
      const locations = data.locations || [];
      for (const loc of locations) {
        const lat = parseFloat(loc.latitude || loc.lat);
        const lng = parseFloat(loc.longitude || loc.lng);
        if (!isNaN(lat) && !isNaN(lng)) await getAddress(lat, lng);
      }
    } catch (err: any) { alert(err.message); }
  }

  async function openMap(pet: any) {
    setShowMap(pet);
    if (pet.last_known_location_lat && pet.last_known_location_lng) {
      setUserLocation({ lat: pet.last_known_location_lat, lng: pet.last_known_location_lng });
    } else {
      getCurrentPosition();
    }
  }

  // 🔥 FUNCIONES DE VACUNAS
  async function openVaccines(pet: any) {
    setSelectedPetForVaccines(pet);
    setShowVaccines(true);
    setShowAddVaccine(false);
    setVaccinations([]);
    await loadVaccinations(pet.id);
  }

  async function loadVaccinations(petId: string) {
    try {
      const response = await fetch(`/api/pets/${petId}/vaccinations`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al cargar vacunas");
      setVaccinations(data.vaccinations || []);
    } catch (err: any) {
      console.error("Error:", err);
      alert(err.message || "Error al cargar vacunas");
    }
  }

  async function handleAddVaccine(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPetForVaccines) { alert("Error: No hay mascota seleccionada"); return; }
    const submitButton = e.currentTarget.querySelector('button[type="submit"]') as HTMLButtonElement;
    if (submitButton) { submitButton.disabled = true; submitButton.textContent = "Guardando..."; }
    try {
      const response = await fetch(`/api/pets/${selectedPetForVaccines.id}/vaccinations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vaccineForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al registrar vacuna");
      alert("✅ Vacuna registrada correctamente");
      setShowAddVaccine(false);
      setVaccineForm({ vaccine_name: "", date_administered: "", next_due: "", lot_number: "", vet_name: "" });
      await loadVaccinations(selectedPetForVaccines.id);
    } catch (err: any) {
      console.error("Error:", err);
      alert(err.message || "Error al registrar vacuna");
    } finally {
      if (submitButton) { submitButton.disabled = false; submitButton.textContent = "💾 Guardar vacuna"; }
    }
  }

  async function handleDeleteVaccine(vaccinationId: string) {
    if (!confirm("¿Estás seguro de eliminar esta vacuna?")) return;
    try {
      const response = await fetch(`/api/pets/${vaccinationId}/vaccinations`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error al eliminar");
      if (selectedPetForVaccines) await loadVaccinations(selectedPetForVaccines.id);
    } catch (err: any) { alert(err.message || "Error al eliminar vacuna"); }
  }

  function handleLogout() {
    document.cookie = "auth-token=; path=/; max-age=0";
    router.push("/login");
  }

  const speciesEmoji: Record<string, string> = { dog: "🐕", cat: "🐈", bird: "", rabbit: "🐰", other: "🐾" };
  const speciesNames: Record<string, string> = { dog: "Perro", cat: "Gato", bird: "Ave", rabbit: "Conejo", other: "Otro" };
  const sexNames: Record<string, string> = { male: "Macho", female: "Hembra" };
  const statusConfig: Record<string, { color: string; text: string; emoji: string }> = {
    home: { color: "bg-green-100 text-green-700", text: "En casa", emoji: "" },
    lost: { color: "bg-red-100 text-red-700", text: "PERDIDO", emoji: "" },
  };

  function getSpeciesName(species: string): string { return speciesNames[species] || species; }
  function getSexName(sex: string): string { return sexNames[sex] || sex; }

  function getVaccineStatus(nextDue: string): { color: string; text: string; emoji: string } {
    if (!nextDue) return { color: "bg-gray-100 text-gray-700", text: "Sin próxima dosis", emoji: "📋" };
    const nextDate = new Date(nextDue);
    const today = new Date();
    const diffDays = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { color: "bg-red-100 text-red-700", text: `Vencida (${Math.abs(diffDays)} días)`, emoji: "⚠️" };
    if (diffDays <= 30) return { color: "bg-yellow-100 text-yellow-700", text: `Próxima (${diffDays} días)`, emoji: "⏰" };
    return { color: "bg-green-100 text-green-700", text: `Al día (${diffDays} días)`, emoji: "✅" };
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-purple-600">🐾 XpiPet Dashboard</h1>
          <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-red-600">Cerrar Sesión</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Mis Mascotas</h2>
          <button onClick={() => setShowForm(!showForm)} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
            {showForm ? "Cancelar" : "+ Agregar Mascota"}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Nueva Mascota</h3>
            <form onSubmit={handleCreatePet} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 focus:border-purple-600 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Especie *</label>
                <select required value={formData.species} onChange={(e) => setFormData({ ...formData, species: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 focus:border-purple-600 focus:outline-none">
                  <option value="">Seleccionar...</option>
                  <option value="dog">🐕 Perro</option>
                  <option value="cat">🐈 Gato</option>
                  <option value="bird">🐦 Ave</option>
                  <option value="rabbit">🐰 Conejo</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Raza</label>
                <input type="text" value={formData.breed} onChange={(e) => setFormData({ ...formData, breed: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 focus:border-purple-600 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input type="text" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 focus:border-purple-600 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
                <select value={formData.sex} onChange={(e) => setFormData({ ...formData, sex: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 focus:border-purple-600 focus:outline-none">
                  <option value="">Seleccionar...</option>
                  <option value="male">Macho</option>
                  <option value="female">Hembra</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Microchip</label>
                <input type="text" value={formData.microchip} onChange={(e) => setFormData({ ...formData, microchip: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 focus:border-purple-600 focus:outline-none" />
              </div>
              <div className="md:col-span-2">
                <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700">Crear Mascota</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p className="text-gray-500 text-center py-8">Cargando mascotas...</p>
        ) : pets.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <p className="text-6xl mb-4">🐾</p>
            <p className="text-gray-600 mb-4">Aún no tienes mascotas registradas</p>
            <button onClick={() => setShowForm(true)} className="text-purple-600 font-semibold hover:underline">Agregar tu primera mascota</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pets.map((pet: any) => {
              const statusInfo = statusConfig[pet.status] || statusConfig.home;
              const isLost = pet.status === "lost";
              return (
                <div key={pet.id} className={`bg-white rounded-xl shadow p-6 ${isLost ? "border-2 border-red-500" : ""}`}>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">{speciesEmoji[pet.species] || ""} {pet.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded font-semibold ${statusInfo.color}`}>{statusInfo.emoji} {statusInfo.text}</span>
                  </div>
                  {isLost && pet.lost_report && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-3 text-sm">
                      <strong>Reporte:</strong> {pet.lost_report}
                    </div>
                  )}
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>🐾 Especie: {getSpeciesName(pet.species)}</p>
                    {pet.breed && <p>🦴 Raza: {pet.breed}</p>}
                    {pet.color && <p>🎨 Color: {pet.color}</p>}
                    {pet.sex && <p>⚧ Sexo: {getSexName(pet.sex)}</p>}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500 mb-3">Código QR: <span className="font-mono font-bold text-purple-600">{pet.public_id}</span></p>
                    <div className="flex gap-2 mb-2">
                      <a href={`/pets/${pet.public_id}`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-pink-600 text-white text-sm py-2 rounded hover:bg-pink-700 text-center">👁️ Ver Perfil</a>
                      <button onClick={() => setSelectedPet(pet)} className="flex-1 bg-purple-600 text-white text-sm py-2 rounded hover:bg-purple-700">📱 Ver QR</button>
                      <button onClick={() => openEditModal(pet)} className="flex-1 bg-blue-600 text-white text-sm py-2 rounded hover:bg-blue-700">✏️ Editar</button>
                    </div>
                    <div className="flex gap-2 mb-2">
                      <button onClick={() => openMap(pet)} className="flex-1 bg-green-600 text-white text-sm py-2 rounded hover:bg-green-700">📍 Ver Ubicación</button>
                      <button onClick={() => loadLocationHistory(pet)} className="flex-1 bg-indigo-600 text-white text-sm py-2 rounded hover:bg-indigo-700"> Ver Historial</button>
                    </div>
                    <button onClick={() => openVaccines(pet)} className="w-full bg-teal-600 text-white text-sm py-2 rounded hover:bg-teal-700 mb-2 flex items-center justify-center gap-2">💉 Vacunas y Salud</button>
                    {isLost ? (
                      <button onClick={() => reportFound(pet.id)} className="w-full bg-green-600 text-white text-sm py-2 rounded hover:bg-green-700 mb-2">✅ Marcar como Encontrado</button>
                    ) : (
                      <button onClick={() => setShowLostModal(pet)} className="w-full bg-red-600 text-white text-sm py-2 rounded hover:bg-red-700 mb-2">🚨 Reportar Perdido</button>
                    )}
                    <button onClick={() => handleDeletePet(pet.id)} className="w-full bg-red-100 text-red-600 text-sm py-2 rounded hover:bg-red-200">🗑️ Eliminar</button>
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">GPS:</span>
                        <button onClick={() => toggleGPS(pet, pet.gps_enabled === 0)} className={`px-3 py-1 rounded text-xs font-semibold ${pet.gps_enabled === 1 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                          {pet.gps_enabled === 1 ? "✅ Activado" : "❌ Desactivado"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal QR */}
      {selectedPet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{speciesEmoji[selectedPet.species] || "🐾"} {selectedPet.name}</h3>
              <p className="text-sm text-gray-500 mb-6">Código: <span className="font-mono font-bold text-purple-600">{selectedPet.public_id}</span></p>
              <div className="bg-white p-4 rounded-lg border-2 border-purple-200 inline-block mb-4">
                <QRCodeSVG id={`qr-${selectedPet.public_id}`} value={`${typeof window !== 'undefined' ? window.location.origin : ''}/pets/${selectedPet.public_id}`} size={256} level="H" includeMargin={true} />
              </div>
              <p className="text-xs text-gray-500 mb-6">Escanea este código para ver el perfil de {selectedPet.name}</p>
              <div className="flex gap-3">
                <button onClick={downloadQR} className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 font-semibold">⬇️ Descargar QR</button>
                <button onClick={() => setSelectedPet(null)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 font-semibold">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {editingPet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">✏️ Editar Mascota</h3>
              <p className="text-sm text-gray-500">Modifica la información de {editingPet.name}</p>
            </div>
            <form onSubmit={handleUpdatePet} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 focus:border-purple-600 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Especie *</label>
                <select required value={formData.species} onChange={(e) => setFormData({ ...formData, species: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 focus:border-purple-600 focus:outline-none">
                  <option value="">Seleccionar...</option>
                  <option value="dog">🐕 Perro</option>
                  <option value="cat"> Gato</option>
                  <option value="bird">🐦 Ave</option>
                  <option value="rabbit">🐰 Conejo</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Raza</label>
                <input type="text" value={formData.breed} onChange={(e) => setFormData({ ...formData, breed: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 focus:border-purple-600 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input type="text" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 focus:border-purple-600 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
                <select value={formData.sex} onChange={(e) => setFormData({ ...formData, sex: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 focus:border-purple-600 focus:outline-none">
                  <option value="">Seleccionar...</option>
                  <option value="male">Macho</option>
                  <option value="female">Hembra</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Microchip</label>
                <input type="text" value={formData.microchip} onChange={(e) => setFormData({ ...formData, microchip: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 focus:border-purple-600 focus:outline-none" />
              </div>
              <div className="md:col-span-2 flex gap-3 mt-4">
                <button type="submit" className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700">💾 Guardar Cambios</button>
                <button type="button" onClick={closeEditModal} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Mapa */}
      {showMap && !showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">📍 Ubicación de {showMap.name}</h3>
              <p className="text-sm text-gray-500">Última actualización: {showMap.last_location_updated_at || "Nunca"}</p>
            </div>
            <div className="border-2 border-purple-200 rounded-lg overflow-hidden mb-6">
              {userLocation ? (
                <iframe width="100%" height="400" frameBorder="0" scrolling="no" marginHeight={0} marginWidth={0} src={`https://www.openstreetmap.org/export/embed.html?bbox=${userLocation.lng - 0.01},${userLocation.lat - 0.01},${userLocation.lng + 0.01},${userLocation.lat + 0.01}&layer=mapnik&marker=${userLocation.lat},${userLocation.lng}`} title="Mapa de ubicación" />
              ) : (
                <div className="h-96 flex items-center justify-center bg-gray-100"><p className="text-gray-500">Cargando mapa...</p></div>
              )}
            </div>
            {userLocation && (
              <div className="bg-purple-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-purple-800"><strong>Coordenadas:</strong><br />Lat: {userLocation.lat.toFixed(6)}<br />Lng: {userLocation.lng.toFixed(6)}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => { getCurrentPosition(); if (showMap && userLocation) updatePetLocation(showMap.id, userLocation.lat, userLocation.lng); }} className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 font-semibold">📡 Actualizar Ubicación</button>
              <button onClick={() => setShowMap(null)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 font-semibold">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Historial */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2"> Historial de Ubicaciones - {showMap?.name || "Mascota"}</h3>
              <p className="text-sm text-gray-500">Últimas {locationHistory.length} ubicaciones registradas</p>
            </div>
            <div className="space-y-3 mb-6">
              <h4 className="font-semibold text-gray-700 mb-3">📍 Ubicaciones registradas:</h4>
              {locationHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No hay ubicaciones registradas.</p>
              ) : (
                locationHistory.map((loc: any, index: number) => {
                  const lat = parseFloat(loc.latitude || loc.lat);
                  const lng = parseFloat(loc.longitude || loc.lng);
                  const coordKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
                  const isLoading = loadingAddresses[coordKey];
                  const address = addressCache[coordKey];
                  return (
                    <div key={loc.id} className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-bold text-purple-700">📍 Ubicación #{locationHistory.length - index}</p>
                          <p className="text-xs text-gray-600 font-mono mt-1">🌐 Lat: {lat.toFixed(6)}, Lng: {lng.toFixed(6)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{new Date(loc.created_at || loc.recorded_at).toLocaleString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                          {loc.accuracy_meters && <p className="text-xs text-gray-500"> Precisión: {loc.accuracy_meters}m</p>}
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-purple-100">
                        {isLoading ? (
                          <p className="text-xs text-purple-600 italic">🔄 Obteniendo dirección...</p>
                        ) : address ? (
                          <div>
                            <p className="text-xs text-gray-500 mb-1"> Dirección aproximada:</p>
                            <p className="text-sm font-semibold text-gray-800">{address}</p>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">Dirección no disponible</p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowHistory(false); setAddressCache({}); }} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 font-semibold">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/*  Modal de Vacunas */}
      {showVaccines && selectedPetForVaccines && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">💉 Vacunas y Salud - {selectedPetForVaccines.name}</h3>
                <p className="text-sm text-gray-500">{vaccinations.length} registro(s) de salud</p>
              </div>
              <button onClick={() => { setShowVaccines(false); setShowAddVaccine(false); }} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
            </div>

            {!showAddVaccine ? (
              <>
                {vaccinations.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">💉</div>
                    <p className="text-gray-600 mb-4">No hay registros de vacunas</p>
                    <button onClick={() => setShowAddVaccine(true)} className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 font-semibold">+ Agregar primera vacuna</button>
                  </div>
                ) : (
                  <div className="space-y-3 mb-6">
                    {vaccinations.map((vac: any) => {
                      const status = getVaccineStatus(vac.next_due);
                      return (
                        <div key={vac.id} className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-bold text-teal-900 text-lg">{vac.vaccine_name}</h4>
                              <p className="text-xs text-gray-600">Aplicada: {new Date(vac.date_administered).toLocaleDateString('es-CO')}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>{status.emoji} {status.text}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 mt-3">
                            {vac.next_due && (<div><p className="text-xs text-gray-500">Próxima dosis:</p><p className="font-semibold">{new Date(vac.next_due).toLocaleDateString('es-CO')}</p></div>)}
                            {vac.vet_name && (<div><p className="text-xs text-gray-500">Veterinario:</p><p className="font-semibold">{vac.vet_name}</p></div>)}
                            {vac.lot_number && (<div><p className="text-xs text-gray-500">Lote:</p><p className="font-mono text-xs">{vac.lot_number}</p></div>)}
                          </div>
                          <button onClick={() => handleDeleteVaccine(vac.id)} className="mt-3 text-xs text-red-600 hover:text-red-700 hover:underline">️ Eliminar registro</button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <button onClick={() => setShowAddVaccine(true)} className="w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 font-semibold flex items-center justify-center gap-2">+ Agregar nueva vacuna</button>
              </>
            ) : (
              <form onSubmit={handleAddVaccine} className="space-y-4">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Registrar nueva vacuna para {selectedPetForVaccines.name}</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la vacuna *</label>
                  <select required value={vaccineForm.vaccine_name} onChange={(e) => setVaccineForm({ ...vaccineForm, vaccine_name: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 focus:border-teal-600 focus:outline-none">
                    <option value="">Seleccionar vacuna...</option>
                    <option value="Rabia">Rabia</option>
                    <option value="Polivalente (Séxtuple)">Polivalente (Séxtuple)</option>
                    <option value="Parvovirus">Parvovirus</option>
                    <option value="Moquillo">Moquillo</option>
                    <option value="Hepatitis">Hepatitis</option>
                    <option value="Leptospirosis">Leptospirosis</option>
                    <option value="Desparasitación interna">Desparasitación interna</option>
                    <option value="Desparasitación externa">Desparasitación externa</option>
                    <option value="Triple Felina">Triple Felina (gatos)</option>
                    <option value="Leucemia Felina">Leucemia Felina (gatos)</option>
                    <option value="Otra">Otra</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de aplicación *</label>
                    <input type="date" required value={vaccineForm.date_administered} onChange={(e) => setVaccineForm({ ...vaccineForm, date_administered: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 focus:border-teal-600 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Próxima dosis</label>
                    <input type="date" value={vaccineForm.next_due} onChange={(e) => setVaccineForm({ ...vaccineForm, next_due: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 focus:border-teal-600 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Veterinario</label>
                  <input type="text" value={vaccineForm.vet_name} onChange={(e) => setVaccineForm({ ...vaccineForm, vet_name: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 focus:border-teal-600 focus:outline-none" placeholder="Dr. Juan Pérez" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número de lote</label>
                  <input type="text" value={vaccineForm.lot_number} onChange={(e) => setVaccineForm({ ...vaccineForm, lot_number: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 focus:border-teal-600 focus:outline-none" placeholder="LOT-12345" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="flex-1 bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 font-semibold">💾 Guardar vacuna</button>
                  <button type="button" onClick={() => setShowAddVaccine(false)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-semibold">Cancelar</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Reportar Perdido */}
      {showLostModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🚨</div>
              <h3 className="text-2xl font-bold text-red-600 mb-2">Reportar Mascota Perdida</h3>
              <p className="text-sm text-gray-600">Estás a punto de reportar a <strong>{showLostModal.name}</strong> como perdido</p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Descripción de lo sucedido *</label>
              <textarea value={lostReport} onChange={(e) => setLostReport(e.target.value)} placeholder="Ej: Se escapó del parque ayer por la tarde..." rows={4} className="w-full border border-gray-300 rounded px-3 py-2 focus:border-red-600 focus:outline-none" />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800"><strong>⚠️ Importante:</strong> Esta información será visible públicamente para ayudar a encontrar a tu mascota.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { if (lostReport.trim()) reportLost(showLostModal.id, lostReport); else alert("Por favor describe lo sucedido"); }} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700">🚨 Reportar Perdido</button>
              <button onClick={() => { setShowLostModal(null); setLostReport(""); }} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}