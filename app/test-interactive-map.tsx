import React from 'react';
import InteractiveMap from './src/components/shared/InteractiveMap';

// Test component to verify InteractiveMap renders with sample data
export function TestInteractiveMap() {
  const sampleMarkers = [
    {
      id: '1',
      position: { lat: -25.9655, lng: 32.5832 },
      type: 'destination' as const,
      popup: {
        title: 'Maputo Central',
        description: 'Historic city center',
        image: 'https://via.placeholder.com/200',
        link: '/destinos/maputo/1',
      },
    },
    {
      id: '2',
      position: { lat: -25.9700, lng: 32.5900 },
      type: 'service' as const,
      popup: {
        title: 'Hotel Polana',
        description: 'Luxury hotel overlooking the bay',
        image: 'https://via.placeholder.com/200',
        link: '/servicos/hotel/2',
      },
    },
    {
      id: '3',
      position: { lat: -25.9600, lng: 32.5700 },
      type: 'destination' as const,
      popup: {
        title: 'Fortaleza de Maputo',
        description: 'Historic fortress',
        link: '/destinos/maputo/3',
      },
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">InteractiveMap Component Test</h1>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Multiple Markers with Clustering</h2>
        <InteractiveMap
          center={{ lat: -25.9655, lng: 32.5832 }}
          zoom={13}
          markers={sampleMarkers}
          clustering={true}
          height="500px"
          onMarkerClick={(marker) => console.log('Clicked marker:', marker.id, marker.popup?.title)}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Single Marker</h2>
        <InteractiveMap
          center={{ lat: -25.9655, lng: 32.5832 }}
          zoom={15}
          markers={[sampleMarkers[0]]}
          clustering={false}
          height="400px"
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">No Controls</h2>
        <InteractiveMap
          center={{ lat: -25.9655, lng: 32.5832 }}
          zoom={12}
          markers={sampleMarkers.slice(0, 2)}
          clustering={true}
          showControls={false}
          height="400px"
        />
      </div>
    </div>
  );
}

export default TestInteractiveMap;
