export function getDistanceInKilometers(first, second) {
  const earthRadius = 6371
  const degreesToRadians = Math.PI / 180
  const latitudeDistance = (second.lat - first.lat) * degreesToRadians
  const longitudeDistance = (second.lng - first.lng) * degreesToRadians
  const firstLatitude = first.lat * degreesToRadians
  const secondLatitude = second.lat * degreesToRadians

  const haversine =
    Math.sin(latitudeDistance / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDistance / 2) ** 2

  return earthRadius * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

