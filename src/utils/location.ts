type Coordinate = [number, number];

const czechRepublicOutline: Coordinate[] = [
  [48.55, 14.33],
  [48.8, 12.1],
  [49.5, 12.0],
  [50.4, 12.1],
  [50.95, 13.0],
  [51.05, 14.3],
  [50.9, 15.6],
  [50.75, 16.9],
  [50.3, 18.85],
  [49.9, 18.85],
  [49.55, 18.2],
  [49.2, 18.0],
  [48.8, 17.1],
  [48.55, 16.8],
];

const isInsideCzechRepublic = ([latitude, longitude]: Coordinate): boolean => {
  let inside = false;

  for (
    let index = 0, previousIndex = czechRepublicOutline.length - 1;
    index < czechRepublicOutline.length;
    previousIndex = index++
  ) {
    const [currentLatitude, currentLongitude] = czechRepublicOutline[index];
    const [previousLatitude, previousLongitude] = czechRepublicOutline[previousIndex];
    const crossesLatitude =
      currentLatitude > latitude !== previousLatitude > latitude &&
      longitude <
        ((previousLongitude - currentLongitude) * (latitude - currentLatitude)) /
          (previousLatitude - currentLatitude) +
          currentLongitude;

    if (crossesLatitude) inside = !inside;
  }

  return inside;
};

export const generateRandomCzechLocation = (): string => {
  const latitudes = czechRepublicOutline.map(([latitude]) => latitude);
  const longitudes = czechRepublicOutline.map(([, longitude]) => longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);

  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const coordinate: Coordinate = [
      minLatitude + Math.random() * (maxLatitude - minLatitude),
      minLongitude + Math.random() * (maxLongitude - minLongitude),
    ];

    if (isInsideCzechRepublic(coordinate)) {
      return `[${coordinate[0].toFixed(6)}, ${coordinate[1].toFixed(6)}]`;
    }
  }

  return '[50.0755, 14.4378]';
};
