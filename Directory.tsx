import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from './context';
import { UserRole } from './types';
import { Mail, Phone, MapPin, Search, List, Globe, ChevronRight } from 'lucide-react';

declare global {
  interface Window {
    require: any;
  }
}

const Directory = () => {
  const { users } = useAppContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  // Map State
  const mapDiv = useRef<HTMLDivElement>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.department || '').toLowerCase().includes(search.toLowerCase())
  );

  // Initialize Map when tab switches to 'map'
  useEffect(() => {
    if (viewMode !== 'map' || !mapDiv.current) return;

    let view: any = null;
    let cleanup = false;

    const loadArcGIS = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.require) {
          resolve();
          return;
        }
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://js.arcgis.com/4.29/esri/themes/light/main.css';
        document.head.appendChild(link);
        const script = document.createElement('script');
        script.src = 'https://js.arcgis.com/4.29/';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = (e) => reject(e);
        document.body.appendChild(script);
      });
    };

    const initMap = async () => {
      try {
        await loadArcGIS();
        if (cleanup) return;

        window.require([
          "esri/Map",
          "esri/views/MapView",
          "esri/Graphic",
          "esri/layers/GraphicsLayer"
        ], (EsriMap: any, MapView: any, Graphic: any, GraphicsLayer: any) => {
          
          if (cleanup) return;
          const map = new EsriMap({ basemap: "topo-vector" });
          const graphicsLayer = new GraphicsLayer();
          map.add(graphicsLayer);

          filteredUsers.forEach(u => {
            if (u.location) {
              const point = { type: "point", longitude: u.location.longitude, latitude: u.location.latitude };
              const markerSymbol = {
                type: "simple-marker",
                color: [5, 150, 105], // Emerald-600
                size: "10px",
                outline: { color: [255, 255, 255], width: 1 }
              };
              const popupTemplate = {
                title: u.name,
                content: `
                   <div class="py-1">
                      <p><strong>${u.jobTitle || u.role}</strong></p>
                      <p class="text-xs text-gray-500">${u.location.address || ''}</p>
                      <p class="text-xs mt-1"><a href="mailto:${u.email}" style="color:green">${u.email}</a></p>
                   </div>
                `
              };
              const graphic = new Graphic({ geometry: point, symbol: markerSymbol, popupTemplate });
              graphicsLayer.add(graphic);
            }
          });

          view = new MapView({
            container: mapDiv.current,
            map: map,
            center: [-98, 38], // Default US View
            zoom: 3
          });

          view.when(() => { if (!cleanup) setIsMapLoaded(true); });
        });
      } catch (e) { console.error("Error loading Map", e); }
    };

    initMap();
    return () => {
      cleanup = true;
      if (view) { view.destroy(); view = null; }
    };
  }, [viewMode, filteredUsers]);

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 flex-shrink-0">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Employee Directory</h2>
           <p className="text-gray-500 text-sm">Browse and manage employee profiles and locations.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
           {/* View Toggle */}
           <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
              <button 
                onClick={() => setViewMode('list')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm transition ${viewMode === 'list' ? 'bg-white shadow-sm text-emerald-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                title="List View"
              >
                <List size={16} />
                <span className="hidden sm:inline">List</span>
              </button>
              <button 
                onClick={() => setViewMode('map')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm transition ${viewMode === 'map' ? 'bg-white shadow-sm text-emerald-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                title="Map View"
              >
                <Globe size={16} />
                <span className="hidden sm:inline">Map</span>
              </button>
           </div>

           <div className="relative flex-1 md:w-64">
              <input 
                type="text" 
                placeholder="Search employees..." 
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-full shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
           </div>
        </div>
      </div>

      {/* --- LIST VIEW (Table) --- */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 overflow-y-auto">
           <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider sticky top-0 z-10">
                 <tr>
                    <th className="px-6 py-4 font-semibold border-b border-gray-200">Employee</th>
                    <th className="px-6 py-4 font-semibold border-b border-gray-200">Department</th>
                    <th className="px-6 py-4 font-semibold border-b border-gray-200">Contact</th>
                    <th className="px-6 py-4 font-semibold border-b border-gray-200">Location</th>
                    <th className="px-6 py-4 font-semibold border-b border-gray-200 text-right">Action</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                 {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-emerald-50/30 transition-colors group">
                       <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                             <img src={user.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                             <div>
                                <p className="font-bold text-gray-900 text-sm">{user.name}</p>
                                <p className="text-xs text-emerald-600 font-medium">{user.role}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-4">
                          <div className="text-sm text-gray-700 font-medium">{user.jobTitle || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{user.department || 'General'}</div>
                       </td>
                       <td className="px-6 py-4">
                          <div className="flex flex-col space-y-1">
                             <a href={`mailto:${user.email}`} className="text-sm text-gray-600 hover:text-emerald-600 flex items-center gap-2">
                                <Mail size={12} /> {user.email}
                             </a>
                             {user.phone && (
                               <span className="text-xs text-gray-500 flex items-center gap-2">
                                 <Phone size={12} /> {user.phone}
                               </span>
                             )}
                          </div>
                       </td>
                       <td className="px-6 py-4">
                          <div className="flex items-center space-x-1.5 text-sm text-gray-600">
                             <MapPin size={14} className="text-gray-400" />
                             <span className="truncate max-w-[150px]" title={user.location?.address}>{user.location?.address || '-'}</span>
                          </div>
                       </td>
                       <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => navigate(`/profile/${user.id}`)}
                            className="text-gray-400 hover:text-emerald-600 p-2 rounded-lg hover:bg-emerald-50 transition"
                            title="View Profile"
                          >
                             <ChevronRight size={18} />
                          </button>
                       </td>
                    </tr>
                 ))}
                 {filteredUsers.length === 0 && (
                    <tr>
                       <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                          <Search size={32} className="mx-auto text-gray-300 mb-2"/>
                          <p>No employees found matching your search.</p>
                       </td>
                    </tr>
                 )}
              </tbody>
           </table>
        </div>
      )}

      {/* --- MAP VIEW --- */}
      {viewMode === 'map' && (
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
           <div ref={mapDiv} className="w-full h-full absolute inset-0 outline-none"></div>
           {!isMapLoaded && (
             <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                <div className="flex flex-col items-center">
                   <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                   <p className="text-gray-500 text-sm">Loading Global Map...</p>
                </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default Directory;