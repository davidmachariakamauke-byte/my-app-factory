import React, { useState } from 'react';
import { HardHat, ShoppingBag, Wrench, Phone, MapPin, Search, PlusCircle, User, CheckCircle, Truck, DollarSign } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('marketplace');
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState('worker'); // worker or supplier
  const [orders, setOrders] = useState([
    { id: 1, item: 'Cement (Simba)', qty: 50, status: 'In Transit', location: 'Westlands, Nairobi' },
    { id: 2, item: 'Deformed Bars 12mm', qty: 20, status: 'Delivered', location: 'Kilimani, Nairobi' }
  ]);

  const products = [
    { id: 1, name: 'Portland Cement - Rhino', price: 'KES 750', category: 'Materials', supplier: 'Hardware KE', location: 'Industrial Area', image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400' },
    { id: 2, name: 'Deformed Steel Bars (12mm)', price: 'KES 1,350', category: 'Materials', supplier: 'Devki Steel', location: 'Ruiru', image: 'https://images.unsplash.com/photo-1531834685032-c34bf0d84c77?w=400' },
    { id: 3, name: 'Bosch Heavy Duty Drill', price: 'KES 12,500', category: 'Tools', supplier: 'ToolMart Nairobi', location: 'CBD', image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400' },
    { id: 4, name: 'Safety Boots (Steel Toe)', price: 'KES 2,200', category: 'PPE', supplier: 'Kariobangi Safety', location: 'Kariobangi', image: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=400' },
  ];

  const gigs = [
    { id: 1, title: 'Fundi Mason needed for Foundation', location: 'Kasarani, Nairobi', pay: 'KES 2,500/day', contact: '0712345678' },
    { id: 2, title: 'Steel Fixer for 3-story building', location: 'Kitengela', pay: 'KES 3,000/day', contact: '0722334455' },
    { id: 3, title: 'Plumber for 10 apartments', location: 'Nakuru Town', pay: 'KES 50,000 contract', contact: '0733221144' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Top Bar */}
      <header className="bg-amber-500 text-slate-950 p-4 shadow-md sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <HardHat className="w-8 h-8" />
          <div>
            <h1 className="font-bold text-xl leading-none">FundiMarket KE</h1>
            <p className="text-xs font-semibold opacity-80">Kazi na Vifaa Mkononi</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setUserRole(userRole === 'worker' ? 'supplier' : 'worker')}
            className="bg-slate-950 text-amber-400 text-xs px-3 py-1.5 rounded-full font-bold">
            Switch: {userRole.toUpperCase()}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-4 max-w-4xl mx-auto pb-24">
        {/* Search & Filter */}
        <div className="my-4 relative">
          <Search className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Tafuta vifaa, vyuma, simiti, au kazi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 text-white pl-10 pr-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* MARKETPLACE TAB */}
        {activeTab === 'marketplace' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-amber-400">Vifaa Tayari sokoni (Market Ready)</h2>
              <span className="text-xs text-slate-400">Nairobi & Environs</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map(item => (
                <div key={item.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 flex flex-col justify-between">
                  <div>
                    <img src={item.image} alt={item.name} className="w-full h-40 object-cover" />
                    <div className="p-4">
                      <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-medium">{item.category}</span>
                      <h3 className="font-bold text-lg mt-1">{item.name}</h3>
                      <p className="text-amber-400 font-extrabold text-xl mt-1">{item.price}</p>
                      <div className="flex items-center text-xs text-slate-400 mt-2">
                        <MapPin className="w-3.5 h-3.5 mr-1" /> {item.location} ({item.supplier})
                      </div>
                    </div>
                  </div>
                  <div className="p-4 pt-0">
                    <button className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-lg flex items-center justify-center gap-2">
                      <ShoppingBag className="w-4 h-4" /> Order via M-Pesa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GIGS / KAZI TAB */}
        {activeTab === 'gigs' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-amber-400">Kazi Mpya za Ujenzi (Available Jobs)</h2>
              <button className="bg-amber-500 text-slate-950 px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1">
                <PlusCircle className="w-4 h-4" /> Post Job
              </button>
            </div>
            <div className="space-y-3">
              {gigs.map(gig => (
                <div key={gig.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-base text-white">{gig.title}</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5" /> {gig.location}
                      </p>
                    </div>
                    <span className="bg-green-500/20 text-green-400 font-bold text-sm px-2.5 py-1 rounded">
                      {gig.pay}
                    </span>
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <a href={`tel:${gig.contact}`} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 text-amber-400">
                      <Phone className="w-3.5 h-3.5" /> Pigia Simu ({gig.contact})
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ORDERS & DELIVERIES TAB */}
        {activeTab === 'orders' && (
          <div>
            <h2 className="text-lg font-bold text-amber-400 mb-4">Deliveries to Site</h2>
            <div className="space-y-3">
              {orders.map(order => (
                <div key={order.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-white">{order.item} (Qty: {order.qty})</h3>
                    <p className="text-xs text-slate-400">Site: {order.location}</p>
                    <span className="inline-flex items-center gap-1 text-xs text-amber-400 mt-2">
                      <Truck className="w-3.5 h-3.5" /> Status: {order.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <CheckCircle className="w-6 h-6 text-green-400 ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 flex justify-around p-3 z-50">
        <button 
          onClick={() => setActiveTab('marketplace')}
          className={`flex flex-col items-center gap-1 text-xs ${activeTab === 'marketplace' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
          <ShoppingBag className="w-5 h-5" />
          Market
        </button>
        <button 
          onClick={() => setActiveTab('gigs')}
          className={`flex flex-col items-center gap-1 text-xs ${activeTab === 'gigs' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
          <Wrench className="w-5 h-5" />
          Kazi
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center gap-1 text-xs ${activeTab === 'orders' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
          <Truck className="w-5 h-5" />
          Deliveries
        </button>
      </nav>
    </div>
  );
}