import React from 'react';
import { useCurrentFrame } from 'remotion';
import { AltstadtPlate, BundeshausPlate, FlatPlate, TramPlate } from './Landscapes';
const cam = { x: 0, y: 0, z: 1 };
export const BernPlateTest: React.FC = () => {
  const f = useCurrentFrame();
  return [<BundeshausPlate cam={cam} />, <AltstadtPlate cam={cam} />, <TramPlate cam={cam} tramX={60} />, <FlatPlate cam={cam} />][f % 4];
};
