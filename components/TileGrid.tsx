'use client';

import TileCard from './TileCard';

const tiles = [
  {
    modeId: 'range',
    title: 'RANGE',
    description: 'Dial in the distance and accuracy of your clubs!',
    gradient: 'bg-gradient-to-br from-green-400 via-green-500 to-green-600',
  },
  {
    modeId: 'target-range',
    title: 'TARGET RANGE',
    description: '70 targets to challenge your skill, short game to driver!',
    gradient: 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600',
  },
  {
    modeId: 'courses',
    title: 'COURSES',
    description: 'Tee off at your local club or select one of our world famous courses!',
    gradient: 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600',
  },
  {
    modeId: 'closest-to-pin',
    title: 'CLOSEST TO PIN',
    description: 'Show off your short game! Compete to land your ball as close as possible to the pin in this precision-based challenge.',
    gradient: 'bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600',
  },
];

export default function TileGrid() {
  return (
    <div className="grid grid-cols-4 gap-6 px-8 py-6 h-full">
      {tiles.map((tile) => (
        <TileCard
          key={tile.modeId}
          modeId={tile.modeId}
          title={tile.title}
          description={tile.description}
          gradient={tile.gradient}
        />
      ))}
    </div>
  );
}
