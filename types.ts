
export enum TransportType {
  TRAIN = 'TRAIN',
  TUBE = 'TUBE',
  TRAM = 'TRAM'
}

export interface Departure {
  id: string;
  destination: string;
  time: string;
  platform: string;
  status: string;
  operator: string;
  type: TransportType;
  eta?: string;
}

export interface StationData {
  lastUpdated: string;
  departures: Departure[];
  sources: { title: string; uri: string }[];
}
