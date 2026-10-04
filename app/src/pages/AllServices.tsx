/**
 * AllServices — wrapper de ServicesListing que expõe onSelectService
 * para integração no Home.tsx.
 */
import { useState } from 'react';
import ServicesListing from './ServicesListing';
import ServiceDetail from './ServiceDetail';

interface AllServicesProps {
  onBack: () => void;
  onSelectService?: (service: any) => void;
}

export default function AllServices({ onBack, onSelectService }: AllServicesProps) {
  const [selectedService, setSelectedService] = useState<any>(null);

  if (selectedService) {
    return (
      <ServiceDetail
        service={selectedService}
        onBack={() => setSelectedService(null)}
      />
    );
  }

  return (
    <ServicesListing
      onBack={onBack}
      onSelectService={(service) => {
        if (onSelectService) {
          onSelectService(service);
        } else {
          setSelectedService(service);
        }
      }}
    />
  );
}
