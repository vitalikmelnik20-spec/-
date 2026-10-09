import React from 'react';
import { useCurrentFrame } from 'remotion';
import { ApartmentPlate, BusStreetPlate, CapitolPlate, HousePlate, WaterfrontPlate } from './Landscapes';
const cam = { x: 0, y: 0, z: 1 };
export const PlateTest: React.FC = () => {
  const f = useCurrentFrame();
  return [<CapitolPlate cam={cam} />, <WaterfrontPlate cam={cam} />, <ApartmentPlate cam={cam} />, <HousePlate cam={cam} />, <BusStreetPlate cam={cam} busX={100} />][f % 5];
};
